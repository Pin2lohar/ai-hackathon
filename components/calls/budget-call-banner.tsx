"use client";

import { PiggyBank } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyAmount } from "@/lib/format-money";
import type { BudgetDiscussion } from "@/types/call";
import { cn } from "@/lib/utils";

export function BudgetCallBanner({
  budget,
  className,
}: {
  budget: BudgetDiscussion;
  className?: string;
}) {
  if (!budget.discussed) return null;

  const rawAmount = budget.amount;
  const hasAmount = rawAmount != null && Number.isFinite(rawAmount);
  const amountLabel = hasAmount
    ? formatCurrencyAmount(rawAmount, budget.currency)
    : null;
  const descriptor = budget.amount_descriptor.trim();

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-xl border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-background shadow-sm dark:border-emerald-500/20 dark:from-emerald-500/15",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-6">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          aria-hidden
        >
          <PiggyBank className="size-7" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            Budget &amp; money
          </p>
          {hasAmount ? (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-foreground text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                {amountLabel}
              </p>
              {descriptor ? (
                <span className="text-muted-foreground text-sm font-medium">
                  {descriptor}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="text-foreground text-lg font-semibold sm:text-xl">
              Budget or pricing discussed
            </p>
          )}
          {budget.headline.trim() ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {budget.headline.trim()}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
