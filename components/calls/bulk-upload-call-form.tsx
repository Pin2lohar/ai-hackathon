"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { BulkUploadResponse } from "@/types/bulk-upload";

const ACCEPT = "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,.mp3,.wav";
const MAX_FILES = 10;

export function BulkUploadCallForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastResults, setLastResults] = useState<BulkUploadResponse | null>(null);

  const totalBytes = useMemo(
    () => files.reduce((sum, f) => sum + f.size, 0),
    [files],
  );

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) {
      setFiles([]);
      return;
    }
    setFiles(Array.from(list));
    setLastResults(null);
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (files.length === 0) {
        toast.error("Choose one or more audio files.");
        return;
      }
      if (files.length > MAX_FILES) {
        toast.error(`Select at most ${MAX_FILES} files per batch.`);
        return;
      }

      setBusy(true);
      const loadingId = toast.loading("Bulk upload in progress…");

      try {
        const body = new FormData();
        for (const f of files) {
          body.append("files", f);
        }

        const res = await fetch("/api/calls/upload/bulk", {
          method: "POST",
          body,
        });

        const json = (await res.json()) as BulkUploadResponse & { error?: string };

        if (!res.ok) {
          throw new Error(json.error ?? "Bulk upload failed");
        }

        if (!json.results || !json.summary) {
          throw new Error("Invalid response");
        }

        const { summary } = json;
        if (summary.failed === 0) {
          toast.success(
            `Processed ${summary.succeeded} recording(s) successfully.`,
            { id: loadingId },
          );
        } else if (summary.succeeded === 0) {
          toast.error("No recordings were processed successfully.", {
            id: loadingId,
          });
        } else {
          toast.warning(
            `${summary.succeeded} succeeded, ${summary.failed} failed. See details below.`,
            { id: loadingId },
          );
        }

        setLastResults(json);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Bulk upload failed";
        toast.error(message, { id: loadingId });
      } finally {
        setBusy(false);
      }
    },
    [files, router],
  );

  return (
    <Card className="upload-dropzone-card w-full max-w-lg rounded-2xl border-border/80 shadow-md lg:mx-0">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Bulk upload</CardTitle>
        <CardDescription>
          Up to {MAX_FILES} MP3 or WAV files per batch (25MB each). Each file
          runs the same Whisper + GPT pipeline as a single upload.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="audio-bulk">Audio files</Label>
            <Input
              id="audio-bulk"
              name="files"
              type="file"
              accept={ACCEPT}
              multiple
              disabled={busy}
              onChange={onFileChange}
              className="cursor-pointer rounded-xl border-border/80 file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
            />
            {files.length > 0 ? (
              <p className="text-muted-foreground text-xs">
                {files.length} file(s), {(totalBytes / (1024 * 1024)).toFixed(2)} MB
                total
              </p>
            ) : null}
          </div>

          {busy ? (
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <Loader2 className="size-3.5 animate-spin shrink-0" />
              Transcribing and analyzing each file in order. This can take several
              minutes for a full batch.
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={busy || files.length === 0}
            className="w-full rounded-xl shadow-sm sm:w-auto"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing batch…
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Process all recordings
              </>
            )}
          </Button>
        </form>

        {lastResults ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Last batch</p>
            <ScrollArea className="h-48 rounded-xl border border-border/80 bg-background/70 p-3">
              <ul className="space-y-2 pr-3 text-sm">
                {lastResults.results.map((row, i) => (
                  <li key={`${i}-${row.filename}`} className="flex gap-2">
                    {row.success ? (
                      <CheckCircle2
                        className="text-emerald-600 dark:text-emerald-400 mt-0.5 size-4 shrink-0"
                        aria-hidden
                      />
                    ) : (
                      <XCircle
                        className="text-destructive mt-0.5 size-4 shrink-0"
                        aria-hidden
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {row.filename}
                      </span>
                      {row.success && row.callId ? (
                        <Link
                          href={`/calls/${row.callId}`}
                          className="text-primary text-xs underline-offset-4 hover:underline"
                        >
                          View call
                        </Link>
                      ) : null}
                      {!row.success && row.error ? (
                        <span className="text-destructive block text-xs">
                          {row.error}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-lg inline-flex",
              )}
            >
              Open dashboard
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
