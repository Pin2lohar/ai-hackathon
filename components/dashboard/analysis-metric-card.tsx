"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AnalysisMetricCard({
  icon: Icon,
  title,
  description,
  value,
  valueDetail,
  valueClassName,
  gradientClassName,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  value: ReactNode;
  valueDetail?: ReactNode;
  valueClassName?: string;
  gradientClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "h-full rounded-2xl border-border/80 bg-gradient-to-br shadow-md transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg",
        gradientClassName ?? "from-white to-indigo-50/50 dark:from-zinc-900 dark:to-indigo-950/30",
      )}
    >
      <CardHeader className="space-y-3 pb-2">
        <div className="flex gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-indigo-200/70 bg-indigo-50 shadow-sm dark:border-indigo-400/40 dark:bg-indigo-500/15"
            aria-hidden
          >
            <Icon className="size-5 text-indigo-600 dark:text-indigo-300" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-foreground text-sm font-semibold leading-snug tracking-tight">
              {title}
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        <div
          className={cn(
            "text-foreground min-h-8 text-2xl font-semibold tracking-tight tabular-nums",
            valueClassName,
          )}
        >
          {value}
        </div>
        {valueDetail ? (
          <div className="text-muted-foreground min-h-8 text-[11px] font-normal leading-snug">
            {valueDetail}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
