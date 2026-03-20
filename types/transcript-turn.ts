import { z } from "zod";

export const transcriptSpeakerSchema = z.enum(["sales_rep", "customer"]);

export const transcriptTurnSchema = z.object({
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  text: z.string(),
  speaker: transcriptSpeakerSchema,
});

export type TranscriptSpeaker = z.infer<typeof transcriptSpeakerSchema>;
export type TranscriptTurn = z.infer<typeof transcriptTurnSchema>;
