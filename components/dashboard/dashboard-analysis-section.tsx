"use client";

import {
  CircleDollarSign,
  Key,
  ListChecks,
  Phone,
  Smile,
  Star,
  Timer,
  Wallet,
} from "lucide-react";
import { AnalysisMetricCard } from "@/components/dashboard/analysis-metric-card";
import type { DashboardStats } from "@/lib/calls";

function formatDuration(seconds: number | null) {
  if (seconds === null || Number.isNaN(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatSentimentPrimary(
  buckets: DashboardStats["sentimentBuckets"],
  total: number,
) {
  if (total === 0) return "—";
  const p = Math.round((buckets.positive / total) * 100);
  const n = Math.round((buckets.neutral / total) * 100);
  const neg = Math.round((buckets.negative / total) * 100);
  return `${p}% pos · ${n}% neu · ${neg}% neg`;
}

function formatTopKeywordsValue(stats: DashboardStats) {
  if (stats.totalCalls === 0) {
    return "—";
  }
  if (stats.totalKeywordMentions === 0) {
    return "0 mentions";
  }
  return `${stats.totalKeywordMentions.toLocaleString()} mentions`;
}

function formatBudgetDiscussedValue(stats: DashboardStats) {
  if (stats.totalCalls === 0) return "—";
  return `${stats.pctCallsBudgetDiscussed}%`;
}

function formatBudgetDiscussedDetail(stats: DashboardStats) {
  if (stats.totalCalls === 0) return undefined;
  return `${stats.budgetDiscussedCount} of ${stats.totalCalls} calls mention budget, pricing, or money`;
}

function formatStatedAmountsValue(stats: DashboardStats) {
  if (stats.totalCalls === 0) return "—";
  return stats.callsWithStatedBudgetAmount.toLocaleString();
}

function formatStatedAmountsDetail(stats: DashboardStats) {
  if (stats.totalCalls === 0) return undefined;
  if (stats.callsWithStatedBudgetAmount === 0) {
    return "No explicit figures extracted yet — upload new calls for fresh analysis.";
  }
  return "Calls where the model found a concrete numeric budget or price.";
}

function formatTopKeywordsDetail(stats: DashboardStats) {
  if (stats.topKeywordsPreview.length === 0) {
    return stats.uniqueKeywordCount === 0
      ? "No keywords extracted yet"
      : `${stats.uniqueKeywordCount} unique terms tracked`;
  }
  const sample = stats.topKeywordsPreview
    .slice(0, 3)
    .map((k) => k.keyword)
    .join(", ");
  return (
    <>
      <span className="text-foreground font-medium">Top terms:</span> {sample}
      {stats.uniqueKeywordCount > 3 ? (
        <span className="text-muted-foreground">
          {" "}
          · {stats.uniqueKeywordCount} unique
        </span>
      ) : null}
    </>
  );
}

export function DashboardAnalysisSection({ stats }: { stats: DashboardStats }) {
  const total = stats.totalCalls;
  const avgScore =
    stats.averageAgentScore !== null
      ? stats.averageAgentScore.toFixed(1)
      : "—";

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Library analytics
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Aggregates across every recording that finished the intelligence
          pipeline (transcription + analysis).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnalysisMetricCard
          icon={Phone}
          title="Total calls processed"
          description="A running count of all recordings that have been successfully analyzed by the system."
          value={total.toLocaleString()}
          gradientClassName="from-white to-indigo-100/55 dark:from-zinc-900 dark:to-indigo-950/35"
          valueDetail={
            total === 0 ? "Upload audio to populate this metric." : undefined
          }
        />

        <AnalysisMetricCard
          icon={Smile}
          title="Sentiment split"
          description="Distribution of positive, neutral, and negative sentiment labels across analyzed calls."
          value={formatSentimentPrimary(stats.sentimentBuckets, total)}
          gradientClassName="from-white to-blue-100/55 dark:from-zinc-900 dark:to-blue-950/35"
          valueDetail={
            total > 0
              ? `${stats.sentimentBuckets.positive} positive · ${stats.sentimentBuckets.neutral} neutral · ${stats.sentimentBuckets.negative} negative calls`
              : undefined
          }
        />

        <AnalysisMetricCard
          icon={Star}
          title="Average call score"
          description="Mean agent quality score across all processed calls, on a scale of 0 to 10."
          value={avgScore === "—" ? "—" : `${avgScore} / 10`}
          gradientClassName="from-white to-indigo-100/50 dark:from-zinc-900 dark:to-indigo-950/30"
          valueDetail={
            total > 0
              ? "Derived from structured GPT analysis per call."
              : undefined
          }
        />

        <AnalysisMetricCard
          icon={Timer}
          title="Avg. call duration"
          description="Average audio length — useful as a benchmark for engagement and pacing."
          value={formatDuration(stats.averageDurationSeconds)}
          gradientClassName="from-white to-sky-100/55 dark:from-zinc-900 dark:to-sky-950/35"
          valueDetail={
            total > 0 ? "Based on Whisper-reported duration." : undefined
          }
        />

        <AnalysisMetricCard
          icon={Key}
          title="Top keywords"
          description="Most frequently discussed topics or terms extracted from transcripts across your library."
          value={formatTopKeywordsValue(stats)}
          gradientClassName="from-white to-violet-100/55 dark:from-zinc-900 dark:to-violet-950/35"
          valueDetail={formatTopKeywordsDetail(stats)}
        />

        <AnalysisMetricCard
          icon={ListChecks}
          title="Action items total"
          description="Aggregate count of follow-ups, commitments, and to-dos identified in call analyses."
          value={stats.totalActionItems.toLocaleString()}
          gradientClassName="from-white to-cyan-100/55 dark:from-zinc-900 dark:to-cyan-950/35"
          valueDetail={
            total > 0
              ? "Summed from GPT-extracted action items per call."
              : undefined
          }
        />

        <AnalysisMetricCard
          icon={Wallet}
          title="Budget / pricing discussed"
          description="Share of calls where spend, pricing, fees, quotes, or payment terms were discussed."
          value={formatBudgetDiscussedValue(stats)}
          gradientClassName="from-white to-indigo-100/50 dark:from-zinc-900 dark:to-indigo-950/30"
          valueDetail={formatBudgetDiscussedDetail(stats)}
        />

        <AnalysisMetricCard
          icon={CircleDollarSign}
          title="Calls with stated amounts"
          description="Recordings where analysis extracted an explicit numeric budget or price from the transcript."
          value={formatStatedAmountsValue(stats)}
          gradientClassName="from-white to-blue-100/50 dark:from-zinc-900 dark:to-blue-950/30"
          valueDetail={formatStatedAmountsDetail(stats)}
        />
      </div>
    </section>
  );
}
