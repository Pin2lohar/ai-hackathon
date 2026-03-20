import { cn } from "@/lib/utils";
import type { Sentiment } from "@/types/call";

const styles: Record<Sentiment, string> = {
  positive:
    "sentiment-badge sentiment-badge--positive border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  neutral:
    "sentiment-badge sentiment-badge--neutral border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  negative:
    "sentiment-badge sentiment-badge--negative border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

export function SentimentBadge({
  sentiment,
  className,
}: {
  sentiment: Sentiment;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        styles[sentiment],
        className,
      )}
    >
      {sentiment}
    </span>
  );
}
