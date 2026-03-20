"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { CallCard } from "@/components/calls/call-card";
import { DeleteCallDialog } from "@/components/calls/delete-call-dialog";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadCallsCsv } from "@/lib/export-calls-csv";
import { cn } from "@/lib/utils";
import type { CallDocument, Sentiment } from "@/types/call";

type SentimentFilter = "all" | Sentiment;
type BudgetLibraryFilter = "all" | "discussed" | "not_discussed";

function sentimentBucket(call: CallDocument): Sentiment {
  const raw = call.analysis.sentiment?.trim().toLowerCase();
  if (raw === "positive" || raw === "negative" || raw === "neutral") {
    return raw;
  }
  return "neutral";
}

function parseLocalDayStart(ymd: string): Date | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function parseLocalDayEnd(ymd: string): Date | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d, 23, 59, 59, 999);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Inclusive local-day bounds; swaps ends if "from" is after "to". */
function effectiveDateRangeBounds(
  dateFrom: string,
  dateTo: string,
): { from: Date | null; to: Date | null } {
  let from = parseLocalDayStart(dateFrom);
  let to = parseLocalDayEnd(dateTo);
  if (from && to && from.getTime() > to.getTime()) {
    from = parseLocalDayStart(dateTo);
    to = parseLocalDayEnd(dateFrom);
  }
  return { from, to };
}

function callMatchesFilters(
  call: CallDocument,
  opts: {
    sentiment: SentimentFilter;
    repQuery: string;
    budget: BudgetLibraryFilter;
    dateFrom: string;
    dateTo: string;
  },
): boolean {
  if (opts.sentiment !== "all" && sentimentBucket(call) !== opts.sentiment) {
    return false;
  }

  const q = opts.repQuery.trim().toLowerCase();
  if (q.length > 0) {
    const rep = (call.analysis.sales_rep_name ?? "").trim().toLowerCase();
    if (!rep.includes(q)) return false;
  }

  const discussed = call.analysis.budget?.discussed === true;
  if (opts.budget === "discussed" && !discussed) return false;
  if (opts.budget === "not_discussed" && discussed) return false;

  const callTime = new Date(call.createdAt).getTime();
  if (Number.isNaN(callTime)) return false;

  const { from, to } = effectiveDateRangeBounds(opts.dateFrom, opts.dateTo);
  if (from && callTime < from.getTime()) return false;
  if (to && callTime > to.getTime()) return false;

  return true;
}

function buildExportFilterLabel(
  sentiment: SentimentFilter,
  repQuery: string,
  budget: BudgetLibraryFilter,
  dateFrom: string,
  dateTo: string,
): string {
  const parts: string[] = [sentiment === "all" ? "all-calls" : sentiment];
  const rq = repQuery.trim();
  if (rq) parts.push(`rep-${rq.slice(0, 24)}`);
  if (budget === "discussed") parts.push("budget-yes");
  if (budget === "not_discussed") parts.push("budget-no");
  if (dateFrom) parts.push(`from-${dateFrom}`);
  if (dateTo) parts.push(`to-${dateTo}`);
  return parts.join("_");
}

const selectClassName = cn(
  "h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-background/90 px-3 py-2 text-sm transition-all duration-200 ease-in-out outline-none",
  "focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "dark:bg-input/30",
);

export function CallsLibrary({
  initialCalls,
}: Readonly<{ initialCalls: CallDocument[] }>) {
  const router = useRouter();
  const [calls, setCalls] = useState(initialCalls);
  const [filter, setFilter] = useState<SentimentFilter>("all");
  const [repQuery, setRepQuery] = useState("");
  const [budgetFilter, setBudgetFilter] =
    useState<BudgetLibraryFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [callToDelete, setCallToDelete] = useState<CallDocument | null>(null);

  useEffect(() => {
    setCalls(initialCalls);
  }, [initialCalls]);

  const repSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const c of calls) {
      const n = (c.analysis.sales_rep_name ?? "").trim();
      if (n) set.add(n);
    }
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [calls]);

  const filtered = useMemo(
    () =>
      calls.filter((c) =>
        callMatchesFilters(c, {
          sentiment: filter,
          repQuery,
          budget: budgetFilter,
          dateFrom,
          dateTo,
        }),
      ),
    [calls, filter, repQuery, budgetFilter, dateFrom, dateTo],
  );

  const hasExtraFilters =
    repQuery.trim().length > 0 ||
    budgetFilter !== "all" ||
    dateFrom.length > 0 ||
    dateTo.length > 0;

  const clearAllFilters = useCallback(() => {
    setFilter("all");
    setRepQuery("");
    setBudgetFilter("all");
    setDateFrom("");
    setDateTo("");
  }, []);

  const exportFiltered = useCallback(() => {
    if (filtered.length === 0) {
      toast.error("No calls to export for this filter.");
      return;
    }
    try {
      downloadCallsCsv(
        filtered,
        buildExportFilterLabel(filter, repQuery, budgetFilter, dateFrom, dateTo),
      );
      toast.success(
        `Exported ${filtered.length} call${filtered.length === 1 ? "" : "s"} (CSV). Open in Excel or Google Sheets.`,
      );
    } catch {
      toast.error("Export failed. Try again.");
    }
  }, [filtered, filter, repQuery, budgetFilter, dateFrom, dateTo]);

  if (calls.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-indigo-200/70 bg-indigo-50/40 px-6 py-16 text-center shadow-sm dark:border-indigo-400/30 dark:bg-indigo-500/10">
        <p className="text-muted-foreground text-sm">
          No processed calls yet. Upload an MP3 or WAV to transcribe and analyze.
        </p>
        <Link
          href="/calls/new"
          className={buttonVariants({
            className: "mt-4 inline-flex gap-2 rounded-xl shadow-sm",
          })}
        >
          <Upload className="size-4" />
          Upload your first call
        </Link>
      </div>
    );
  }

  const anyFilterActive =
    filter !== "all" || hasExtraFilters;

  let summaryLine: string;
  if (!anyFilterActive) {
    summaryLine = `${calls.length} call${calls.length === 1 ? "" : "s"} in your library`;
  } else if (filtered.length === 0) {
    summaryLine = `No matches (of ${calls.length} total)`;
  } else {
    summaryLine = `Showing ${filtered.length} of ${calls.length}`;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/80 bg-background/70 p-4 shadow-sm backdrop-blur-sm sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">
              Search &amp; filters
            </h2>
            {anyFilterActive ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 rounded-lg text-muted-foreground"
                onClick={clearAllFilters}
              >
                <X className="size-3.5" aria-hidden />
                Clear all
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="calls-rep-search">Sales rep</Label>
              <Input
                id="calls-rep-search"
                type="search"
                placeholder="Name contains…"
                value={repQuery}
                onChange={(e) => setRepQuery(e.target.value)}
                list={
                  repSuggestions.length > 0 ? "calls-rep-datalist" : undefined
                }
                autoComplete="off"
                className="rounded-lg"
              />
              {repSuggestions.length > 0 ? (
                <datalist id="calls-rep-datalist">
                  {repSuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              ) : null}
            </div>
            <div className="w-full space-y-2 xl:w-44 xl:shrink-0">
              <Label htmlFor="calls-budget-filter">Budget discussed</Label>
              <select
                id="calls-budget-filter"
                value={budgetFilter}
                onChange={(e) =>
                  setBudgetFilter(e.target.value as BudgetLibraryFilter)
                }
                className={selectClassName}
              >
                <option value="all">Any</option>
                <option value="discussed">Yes</option>
                <option value="not_discussed">No</option>
              </select>
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="calls-date-from">From date</Label>
                <Input
                  id="calls-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calls-date-to">To date</Label>
                <Input
                  id="calls-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as SentimentFilter)}
            className="w-full sm:w-auto"
          >
            <TabsList
              variant="line"
              className="h-auto w-full min-w-0 flex-wrap justify-start gap-1 bg-transparent p-0 sm:w-fit"
            >
              <TabsTrigger value="all" className="shrink-0 px-3 py-1.5">
                All
              </TabsTrigger>
              <TabsTrigger value="positive" className="shrink-0 px-3 py-1.5">
                Positive
              </TabsTrigger>
              <TabsTrigger value="neutral" className="shrink-0 px-3 py-1.5">
                Neutral
              </TabsTrigger>
              <TabsTrigger value="negative" className="shrink-0 px-3 py-1.5">
                Negative
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <p className="text-muted-foreground text-sm tabular-nums sm:text-right">
              {summaryLine}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
              disabled={filtered.length === 0}
              title="Downloads only the calls that match the current filters (UTF-8 CSV for Excel or Google Sheets)."
              onClick={exportFiltered}
            >
              <Download className="size-4" aria-hidden />
              Export CSV
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border/80 bg-muted/15 px-6 py-12 text-center shadow-sm">
            <p className="text-muted-foreground text-sm">
              No calls match your filters. Adjust search, sentiment, budget, or
              date range—or upload new recordings.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((call) => (
              <CallCard
                key={call._id}
                call={call}
                onDeleteClick={() => setCallToDelete(call)}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteCallDialog
        call={callToDelete}
        open={!!callToDelete}
        onOpenChange={(next) => {
          if (!next) setCallToDelete(null);
        }}
        onDeleted={(id) => {
          setCalls((prev) => prev.filter((c) => c._id !== id));
          router.refresh();
        }}
      />
    </>
  );
}
