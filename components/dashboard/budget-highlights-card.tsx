"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyAmount } from "@/lib/format-money";
import type { DashboardStats } from "@/lib/calls";

export function BudgetHighlightsCard({
  highlights,
}: {
  highlights: DashboardStats["budgetHighlights"];
}) {
  if (highlights.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-2xl border-border/80 bg-background/90 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div
            className="flex size-9 items-center justify-center rounded-xl border border-emerald-300/50 bg-emerald-100/70"
            aria-hidden
          >
            <TrendingUp className="size-4 text-emerald-700" strokeWidth={1.75} />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Stated budget amounts
            </CardTitle>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Calls with explicit figures, largest first. Mixing currencies is
              informational only.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
          {highlights.map((row) => (
            <li key={row._id}>
              <Link
                href={`/calls/${row._id}`}
                className="hover:bg-muted/40 flex flex-col gap-1 px-3 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {row.originalFilename}
                  </p>
                  {row.headline.trim() ? (
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {row.headline.trim()}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 text-right text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatCurrencyAmount(row.amount, row.currency)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
