import Link from "next/link";
import { Upload } from "lucide-react";
import { CallsLibrary } from "@/components/calls/calls-library";
import { buttonVariants } from "@/components/ui/button-variants";
import type { CallDocument } from "@/types/call";

export function CallsIndexView({ calls }: { calls: CallDocument[] }) {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            All calls
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm sm:text-base">
            Every recording that finished transcription and analysis. Filter by
            rep, sentiment, budget, and date; open any call for transcript,
            scores, charts, and action items.
          </p>
          {calls.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm tabular-nums">
              No calls yet
            </p>
          ) : null}
        </div>
        <Link
          href="/calls/new"
          className={buttonVariants({
            className: "inline-flex gap-2 rounded-xl shadow-sm sm:shrink-0",
          })}
        >
          <Upload className="size-4" />
          Upload call
        </Link>
      </div>

      <CallsLibrary initialCalls={calls} />
    </div>
  );
}
