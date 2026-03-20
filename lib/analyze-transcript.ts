import { getOpenAI } from "@/lib/openai";
import { extractCallParticipantNames } from "@/lib/extract-call-names";
import { CALL_ANALYSIS_SYSTEM_PROMPT } from "@/lib/prompts/analysis";
import { analysisSchema, type CallAnalysis } from "@/types/call";

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON object");
  }
  return trimmed.slice(start, end + 1);
}

export async function analyzeTranscript(transcript: string): Promise<CallAnalysis> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_ANALYSIS_MODEL ?? "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: CALL_ANALYSIS_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Call transcript:\n\n${transcript}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty analysis response from model");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(content));
  } catch {
    throw new Error("Failed to parse analysis JSON");
  }

  const result = analysisSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Analysis validation failed: ${result.error.message}`);
  }

  let analysis = result.data;
  const missingRep = !analysis.sales_rep_name.trim();
  const missingCust = !analysis.customer_name.trim();
  if (missingRep || missingCust) {
    const extracted = await extractCallParticipantNames(transcript);
    analysis = {
      ...analysis,
      sales_rep_name: missingRep
        ? extracted.sales_rep_name
        : analysis.sales_rep_name.trim(),
      customer_name: missingCust
        ? extracted.customer_name
        : analysis.customer_name.trim(),
    };
  }

  return analysis;
}
