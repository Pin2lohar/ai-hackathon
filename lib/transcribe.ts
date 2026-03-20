import { createReadStream } from "fs";
import { toFile } from "openai";
import { getOpenAI } from "@/lib/openai";

export type WhisperSegment = {
  start: number;
  end: number;
  text: string;
};

export async function transcribeAudioFile(params: {
  filePath: string;
  originalFilename: string;
  mimeType: string;
}): Promise<{
  text: string;
  durationSeconds: number;
  segments: WhisperSegment[];
}> {
  const openai = getOpenAI();
  const stream = createReadStream(params.filePath);
  const file = await toFile(stream, params.originalFilename, {
    type: params.mimeType,
  });

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
  });

  const duration =
    typeof response.duration === "number" ? response.duration : 0;
  const text = response.text?.trim() ?? "";

  const raw = response.segments ?? [];
  const segments: WhisperSegment[] = raw
    .map((s) => ({
      start: s.start,
      end: s.end,
      text: (s.text ?? "").trim(),
    }))
    .filter((s) => s.text.length > 0);

  return { text, durationSeconds: duration, segments };
}
