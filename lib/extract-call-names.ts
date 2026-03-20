import { z } from "zod";
import { getOpenAI } from "@/lib/openai";

const namesSchema = z.object({
  sales_rep_name: z.string(),
  customer_name: z.string(),
});

const EXTRACT_NAMES_SYSTEM = `You identify the two main people on a sales or support phone call.

Return a single JSON object only (no markdown) with exactly:
{
  "sales_rep_name": string,
  "customer_name": string
}

Definitions:
- sales_rep_name: The company employee / agent / representative (the person working for the seller or support org). Look for self-introductions ("this is Ryan", "I'm Sarah from…", "my name is…"), agent speaker labels, or who pitches the product.
- customer_name: The external party (prospect, buyer, caller, or person being helped). Look for "speaking with…", how the agent addresses them, or customer introductions.

Rules:
- Use the clearest full or first name appearing in the transcript. If only a first name exists, use that.
- If multiple people exist on one side, pick the primary contact for that side.
- If a role cannot be determined, use "" for that field. Never invent names not supported by the transcript.
- If the transcript has no real names, return both as "".

Be generous about filling fields when names appear anywhere in the first half of the call (introductions).`;

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Name extraction did not return a JSON object");
  }
  return trimmed.slice(start, end + 1);
}

/**
 * Focused pass to fill sales_rep_name / customer_name when the main analysis omits them.
 */
export async function extractCallParticipantNames(
  transcript: string,
): Promise<{ sales_rep_name: string; customer_name: string }> {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return { sales_rep_name: "", customer_name: "" };
  }

  const openai = getOpenAI();
  const maxChars = 120_000;
  const body =
    trimmed.length > maxChars
      ? `${trimmed.slice(0, maxChars)}\n\n[… transcript truncated …]`
      : trimmed;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_ANALYSIS_MODEL ?? "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXTRACT_NAMES_SYSTEM },
      { role: "user", content: `Transcript:\n\n${body}` },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return { sales_rep_name: "", customer_name: "" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(content));
  } catch {
    return { sales_rep_name: "", customer_name: "" };
  }

  const result = namesSchema.safeParse(parsed);
  if (!result.success) {
    return { sales_rep_name: "", customer_name: "" };
  }

  return {
    sales_rep_name: result.data.sales_rep_name.trim(),
    customer_name: result.data.customer_name.trim(),
  };
}
