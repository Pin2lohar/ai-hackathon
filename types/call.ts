import { z } from "zod";
import type { TranscriptTurn } from "@/types/transcript-turn";

export const sentimentSchema = z.enum(["positive", "neutral", "negative"]);

export const performanceScoresSchema = z.object({
  communication: z.number().min(0).max(10),
  politeness: z.number().min(0).max(10),
  business_knowledge: z.number().min(0).max(10),
  problem_handling: z.number().min(0).max(10),
  listening: z.number().min(0).max(10),
});

export const talkTimeSchema = z.object({
  agentPercent: z.number().min(0).max(100),
  customerPercent: z.number().min(0).max(100),
});

/** Budget, pricing, or money discussion extracted from the transcript. */
export const budgetDiscussionSchema = z.object({
  /** True if pricing, budget, cost, fees, payment terms, ROI, or spend limits were meaningfully discussed. */
  discussed: z.boolean(),
  /**
   * Numeric amount in major units (e.g. 5000 for $5,000) when clearly stated in the call.
   * null if money was discussed but no specific figure, or if not discussed.
   */
  amount: z.number().nullable(),
  /** ISO 4217 when inferable (USD, EUR, GBP…); empty string if unknown. */
  currency: z.string(),
  /** e.g. "per month", "annual contract", "one-time setup fee". */
  amount_descriptor: z.string(),
  /** One concise sentence summarizing the budget/money thread for UI (shown at top of call when discussed). */
  headline: z.string(),
});

export const analysisSchema = z.object({
  summary: z.string(),
  /** Sales / service rep or agent name if stated or inferable; else "". */
  sales_rep_name: z.string(),
  /** Customer or caller name if stated or inferable; else "". */
  customer_name: z.string(),
  sentiment: sentimentSchema,
  agent_score: z.number().min(0).max(10),
  talk_time: talkTimeSchema,
  performance_scores: performanceScoresSchema,
  keywords: z.array(z.string()),
  action_items: z.array(z.string()),
  positive_observations: z.array(z.string()),
  negative_observations: z.array(z.string()),
  questionnaire_coverage: z.record(z.string(), z.boolean()),
  budget: budgetDiscussionSchema,
  /** Short bullets: pricing objections, discounts, payment plans, ROI, upsell value, etc. Empty if none. */
  financial_insights: z.array(z.string()),
});

export type Sentiment = z.infer<typeof sentimentSchema>;
export type PerformanceScores = z.infer<typeof performanceScoresSchema>;
export type TalkTime = z.infer<typeof talkTimeSchema>;
export type BudgetDiscussion = z.infer<typeof budgetDiscussionSchema>;
export type CallAnalysis = z.infer<typeof analysisSchema>;

export type CallDocument = {
  _id: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  durationSeconds: number;
  transcript: string;
  /** Timestamped lines with speaker labels for live playback sync (may be empty for older calls). */
  transcriptTurns: TranscriptTurn[];
  analysis: CallAnalysis;
  createdAt: string;
};
