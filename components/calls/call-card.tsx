"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  Clock,
  Trash2,
  User,
  UserRound,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SentimentBadge } from "@/components/calls/sentiment-badge";
import { formatCurrencyAmount } from "@/lib/format-money";
import type { CallDocument } from "@/types/call";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number) {
  if (!seconds || seconds < 1) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function useProcessedLabel(iso: string) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso)),
    );
  }, [iso]);

  return label;
}

function displayOrDash(value: string) {
  const t = value.trim();
  return t.length > 0 ? t : "—";
}

export function CallCard({
  call,
  className,
  onDeleteClick,
}: {
  call: CallDocument;
  className?: string;
  /** When set, shows a delete control (parent should confirm before removing). */
  onDeleteClick?: () => void;
}) {
  const processedLabel = useProcessedLabel(call.createdAt);
  const salesRep = displayOrDash(call.analysis.sales_rep_name);
  const customer = displayOrDash(call.analysis.customer_name);
  const budget = call.analysis.budget;
  const budgetAmount =
    budget.amount != null && Number.isFinite(budget.amount)
      ? formatCurrencyAmount(budget.amount, budget.currency)
      : null;

  return (
    <Link href={`/calls/${call._id}`} className={cn("block", className)}>
      <Card className="call-card group h-full rounded-2xl border-border/80 shadow-md transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle className="truncate text-base font-semibold leading-tight">
              {call.originalFilename}
            </CardTitle>
            <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs tabular-nums">
              <CalendarClock className="size-3.5 shrink-0 opacity-70" aria-hidden />
              <span className="text-muted-foreground/90 font-medium">
                Processed
              </span>
              <span>{processedLabel || "\u00a0"}</span>
            </p>
            <div className="space-y-1.5 text-xs">
              <p className="flex min-w-0 items-start gap-2">
                <User
                  className="text-muted-foreground mt-0.5 size-3.5 shrink-0 opacity-80"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="text-muted-foreground">Sales rep</span>{" "}
                  <span className="font-medium text-foreground">{salesRep}</span>
                </span>
              </p>
              <p className="flex min-w-0 items-start gap-2">
                <UserRound
                  className="text-muted-foreground mt-0.5 size-3.5 shrink-0 opacity-80"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="text-muted-foreground">Customer</span>{" "}
                  <span className="font-medium text-foreground">{customer}</span>
                </span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-start gap-0.5">
            {onDeleteClick ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-8 shrink-0 rounded-lg hover:bg-red-100/60 dark:hover:bg-red-500/20"
                aria-label={`Delete ${call.originalFilename}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteClick();
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
            <SentimentBadge sentiment={call.analysis.sentiment} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {call.analysis.summary}
          </p>
          {budget.discussed ? (
            <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
              {budgetAmount ?? "Budget / pricing discussed"}
              {budgetAmount && budget.amount_descriptor.trim()
                ? ` · ${budget.amount_descriptor.trim()}`
                : null}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="font-medium text-foreground">
                {call.analysis.agent_score.toFixed(1)}
              </span>
              /10 score
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5 opacity-70" aria-hidden />
              {formatDuration(call.durationSeconds)}
            </span>
            <ChevronRight className="ml-auto size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
