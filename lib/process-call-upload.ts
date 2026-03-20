import { randomUUID } from "crypto";
import { unlink, writeFile } from "fs/promises";
import path from "path";
import { analyzeTranscript } from "@/lib/analyze-transcript";
import { insertCall } from "@/lib/calls";
import { labelTranscriptTurns } from "@/lib/label-transcript-turns";
import { transcribeAudioFile } from "@/lib/transcribe";
import { ensureUploadsDir } from "@/lib/uploads-dir";
import type { CallDocument } from "@/types/call";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/vnd.wave",
]);

function extForMime(mime: string): string {
  if (mime === "audio/mpeg" || mime === "audio/mp3") return ".mp3";
  return ".wav";
}

export type ProcessCallUploadResult =
  | { ok: true; call: CallDocument }
  | { ok: false; error: string; status: number };

/**
 * Save audio, transcribe with Whisper, analyze with GPT, persist call.
 */
export async function processCallUpload(file: File): Promise<ProcessCallUploadResult> {
  let savedPath: string | null = null;
  try {
    if (file.size > MAX_UPLOAD_BYTES) {
      return {
        ok: false,
        error: "File too large (max 25MB)",
        status: 400,
      };
    }

    const mimeType = file.type || "audio/mpeg";
    if (!ALLOWED_MIME.has(mimeType)) {
      return {
        ok: false,
        error: "Unsupported audio type. Use MP3 or WAV.",
        status: 400,
      };
    }

    const id = randomUUID();
    const ext =
      path.extname(file.name).toLowerCase() === ".wav"
        ? ".wav"
        : extForMime(mimeType);
    const storedFilename = `${id}${ext}`;

    const uploadsDir = await ensureUploadsDir();
    savedPath = path.join(uploadsDir, storedFilename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(savedPath, buffer);

    const { text: transcript, durationSeconds: whisperDuration, segments } =
      await transcribeAudioFile({
        filePath: savedPath,
        originalFilename: file.name || `recording${ext}`,
        mimeType,
      });

    if (!transcript.trim()) {
      await unlink(savedPath).catch(() => {});
      savedPath = null;
      return {
        ok: false,
        error: "Transcription was empty",
        status: 422,
      };
    }

    const analysis = await analyzeTranscript(transcript);

    const transcriptTurns = await labelTranscriptTurns({
      segments,
      salesRepName: analysis.sales_rep_name,
      customerName: analysis.customer_name,
      transcript,
    });

    const call = await insertCall({
      _id: id,
      originalFilename: file.name || `recording${ext}`,
      storedFilename,
      mimeType,
      durationSeconds: whisperDuration || 0,
      transcript,
      transcriptTurns,
      analysis,
    });

    return { ok: true, call };
  } catch (e) {
    if (savedPath) {
      await unlink(savedPath).catch(() => {});
    }
    const message = e instanceof Error ? e.message : "Upload failed";
    console.error("[processCallUpload]", e);
    return { ok: false, error: message, status: 500 };
  }
}
