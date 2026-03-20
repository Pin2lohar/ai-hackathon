import { z } from "zod";
import { getOpenAI } from "@/lib/openai";
import type { WhisperSegment } from "@/lib/transcribe";
import type { TranscriptTurn } from "@/types/transcript-turn";

const assignmentSchema = z.object({
  assignments: z.array(
    z.object({
      segment_index: z.number().int().min(0),
      speaker: z.enum(["sales_rep", "customer"]),
    }),
  ),
});

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON object");
  }
  return trimmed.slice(start, end + 1);
}

/** Merge Whisper chunks so we stay within a practical prompt size. */
function coalesceSegments(
  segments: WhisperSegment[],
  maxSegments: number,
): WhisperSegment[] {
  const cleaned = segments
    .map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }))
    .filter((s) => s.text.length > 0);

  if (cleaned.length <= maxSegments) {
    return cleaned;
  }

  const n = cleaned.length;
  const out: WhisperSegment[] = [];
  for (let b = 0; b < maxSegments; b++) {
    const i0 = Math.floor((b * n) / maxSegments);
    const i1 = Math.floor(((b + 1) * n) / maxSegments);
    const chunk = cleaned.slice(i0, i1);
    if (chunk.length === 0) continue;
    const text = chunk.map((c) => c.text).join(" ").trim();
    if (!text) continue;
    out.push({
      start: chunk[0].start,
      end: chunk[chunk.length - 1].end,
      text,
    });
  }
  return out;
}

function mergeConsecutiveSpeakerTurns(
  segments: WhisperSegment[],
  speakers: ("sales_rep" | "customer")[],
): TranscriptTurn[] {
  const turns: TranscriptTurn[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const speaker = speakers[i] ?? "sales_rep";
    const text = seg.text.trim();
    if (!text) continue;
    const last = turns[turns.length - 1];
    if (last && last.speaker === speaker) {
      last.end = seg.end;
      last.text = `${last.text} ${text}`.trim();
    } else {
      turns.push({
        start: seg.start,
        end: seg.end,
        text,
        speaker,
      });
    }
  }
  return turns;
}

const SYSTEM = `You label who is speaking in each timestamped segment of a sales or support call.

You receive JSON with:
- segments: array of { "segment_index": number, "start_sec": number, "end_sec": number, "text": string }
- sales_rep_hint: string (agent name if known, else "")
- customer_hint: string (customer name if known, else "")

Respond with a single JSON object only (no markdown):
{
  "assignments": [
    { "segment_index": 0, "speaker": "sales_rep" },
    { "segment_index": 1, "speaker": "customer" }
  ]
}

Rules:
- speaker is exactly "sales_rep" or "customer".
- sales_rep = company employee / agent / representative.
- customer = external caller, prospect, or person being helped.
- You MUST include exactly one assignment per segment_index from the input, with every index 0..n-1 present once.
- Use hints when they help; if hints are empty, infer from content (greeting scripts, product pitch vs personal questions).
- Do not skip or duplicate segment_index values.`;

/**
 * Assigns each Whisper segment to sales rep or customer, then merges consecutive same-speaker lines.
 */
export async function labelTranscriptTurns(params: {
  segments: WhisperSegment[];
  salesRepName: string;
  customerName: string;
  transcript: string;
}): Promise<TranscriptTurn[]> {
  const { segments, salesRepName, customerName, transcript } = params;

  if (segments.length === 0) {
    return [];
  }

  const coalesced = coalesceSegments(segments, 55);
  const payload = {
    segments: coalesced.map((s, segment_index) => ({
      segment_index,
      start_sec: s.start,
      end_sec: s.end,
      text: s.text,
    })),
    sales_rep_hint: salesRepName.trim(),
    customer_hint: customerName.trim(),
  };

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_ANALYSIS_MODEL ?? "gpt-4o-mini",
    temperature: 0.15,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Full transcript for extra context (may be long):\n\n${transcript.slice(0, 24_000)}\n\n---\nSegments to label (JSON):\n${JSON.stringify(payload)}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return mergeConsecutiveSpeakerTurns(
      coalesced,
      coalesced.map((_, i) => (i % 2 === 0 ? "sales_rep" : "customer")),
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(content));
  } catch {
    return mergeConsecutiveSpeakerTurns(
      coalesced,
      coalesced.map((_, i) => (i % 2 === 0 ? "sales_rep" : "customer")),
    );
  }

  const result = assignmentSchema.safeParse(parsed);
  if (!result.success) {
    return mergeConsecutiveSpeakerTurns(
      coalesced,
      coalesced.map((_, i) => (i % 2 === 0 ? "sales_rep" : "customer")),
    );
  }

  const byIndex = new Map<number, "sales_rep" | "customer">();
  for (const a of result.data.assignments) {
    byIndex.set(a.segment_index, a.speaker);
  }

  const speakers: ("sales_rep" | "customer")[] = coalesced.map((_, i) => {
    const s = byIndex.get(i);
    if (s) return s;
    return i % 2 === 0 ? "sales_rep" : "customer";
  });

  return mergeConsecutiveSpeakerTurns(coalesced, speakers);
}
