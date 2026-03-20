import type { TranscriptTurn } from "@/types/transcript-turn";

/**
 * When Whisper-timed transcriptTurns are missing, approximate start/end times by
 * splitting the transcript into sentences and allocating duration by character share.
 * Speakers alternate (sales_rep first) — good enough for live-style playback UX.
 */
export function buildSyntheticTranscriptTurns(
  transcript: string,
  durationSeconds: number,
): TranscriptTurn[] {
  const trimmed = transcript.replace(/\s+/g, " ").trim();
  if (!trimmed || durationSeconds <= 0) return [];

  const parts = trimmed.split(/(?<=[.!?])\s+/).filter((p) => p.length > 0);
  const chunks = parts.length > 0 ? parts : [trimmed];

  const lengths = chunks.map((c) => c.length);
  const totalChars = lengths.reduce((a, b) => a + b, 0) || 1;

  const turns: TranscriptTurn[] = [];
  let t = 0;
  for (let i = 0; i < chunks.length; i++) {
    const start = t;
    const end =
      i === chunks.length - 1
        ? durationSeconds
        : Math.min(
            durationSeconds,
            t + (lengths[i] / totalChars) * durationSeconds,
          );
    t = end;
    turns.push({
      start,
      end,
      text: chunks[i],
      speaker: i % 2 === 0 ? "sales_rep" : "customer",
    });
  }
  return turns;
}
