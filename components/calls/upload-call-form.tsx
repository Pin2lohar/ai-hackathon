"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CallDocument } from "@/types/call";

const ACCEPT = "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,.mp3,.wav";

export function UploadCallForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!file) {
        toast.error("Choose an audio file first.");
        return;
      }
      setBusy(true);
      const loadingId = toast.loading("Transcribing and analyzing…");
      try {
        const body = new FormData();
        body.set("file", file);
        const res = await fetch("/api/calls/upload", {
          method: "POST",
          body,
        });
        const json = (await res.json()) as {
          call?: CallDocument;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(json.error ?? "Upload failed");
        }
        if (!json.call) {
          throw new Error("Invalid response");
        }
        toast.success("Call processed successfully.", { id: loadingId });
        router.push(`/calls/${json.call._id}`);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        toast.error(message, { id: loadingId });
      } finally {
        setBusy(false);
      }
    },
    [file, router],
  );

  return (
    <Card className="upload-dropzone-card w-full max-w-lg rounded-2xl border-border/80 shadow-md lg:mx-0">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Upload recording</CardTitle>
        <CardDescription>
          MP3 or WAV, up to 25MB. We transcribe with Whisper and analyze with GPT.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="audio">Audio file</Label>
            <Input
              id="audio"
              name="file"
              type="file"
              accept={ACCEPT}
              disabled={busy}
              onChange={onFileChange}
              className="cursor-pointer rounded-xl border-border/80 file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
            />
            {file ? (
              <p className="text-muted-foreground text-xs">
                Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            disabled={busy || !file}
            className="w-full rounded-xl shadow-sm sm:w-auto"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Run intelligence pipeline
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
