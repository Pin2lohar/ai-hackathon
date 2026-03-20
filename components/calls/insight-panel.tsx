"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function InsightPanel({
  title,
  items,
  variant = "default",
  className,
}: {
  title: string;
  items: string[];
  variant?: "default" | "positive" | "negative";
  className?: string;
}) {
  const border =
    variant === "positive"
      ? "border-emerald-500/20"
      : variant === "negative"
        ? "border-rose-500/20"
        : "border-border/80";

  return (
    <Card
      className={cn(
        "insight-panel rounded-xl border shadow-sm",
        border,
        className,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">None noted.</p>
        ) : (
          <ScrollArea className="max-h-48 pr-3">
            <ul className="space-y-2 text-sm leading-relaxed">
              {items.map((item, i) => (
                <li
                  key={`${i}-${item.slice(0, 24)}`}
                  className="border-border/60 border-b pb-2 last:border-0 last:pb-0"
                >
                  {item}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
