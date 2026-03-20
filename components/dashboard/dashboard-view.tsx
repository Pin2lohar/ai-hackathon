"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { CallCard } from "@/components/calls/call-card";
import { BudgetHighlightsCard } from "@/components/dashboard/budget-highlights-card";
import { DashboardAnalysisSection } from "@/components/dashboard/dashboard-analysis-section";
import { KeywordChart } from "@/components/dashboard/keyword-chart";
import { SentimentChart } from "@/components/dashboard/sentiment-chart";
import type { CallDocument } from "@/types/call";
import type { DashboardStats } from "@/lib/calls";

export function DashboardView({
  stats,
  recentCalls,
}: {
  stats: DashboardStats;
  recentCalls: CallDocument[];
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm sm:text-base">
            Monitor call volume, quality scores, and themes across your
            conversation intelligence pipeline.
          </p>
        </div>
        <Link
          href="/calls/new"
          className={buttonVariants({
            className: "inline-flex gap-2 rounded-xl shadow-md",
          })}
        >
          <Upload className="size-4" />
          Upload call
        </Link>
      </div>

      <DashboardAnalysisSection stats={stats} />

      {stats.budgetHighlights.length > 0 ? (
        <section className="space-y-4">
          <BudgetHighlightsCard highlights={stats.budgetHighlights} />
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Charts</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Visual breakdown of sentiment mix and keyword frequency.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          <SentimentChart data={stats.sentimentSplit} />
          <KeywordChart data={stats.keywordFrequency} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Recent calls</h2>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {stats.totalCalls > 0 ? (
              <Link
                href="/calls"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium"
              >
                View all calls
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
            {recentCalls.length > 0 ? (
              <Link
                href="/calls/new"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium"
              >
                New upload
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </div>
        </div>
        {recentCalls.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-indigo-200/70 bg-indigo-50/40 px-6 py-14 text-center shadow-sm dark:border-indigo-400/30 dark:bg-indigo-500/10">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md">
              <Sparkles className="size-5" aria-hidden />
            </div>
            <p className="text-muted-foreground text-sm">
              No calls yet. Upload an MP3 or WAV to transcribe and analyze.
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
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentCalls.map((call) => (
              <CallCard key={call._id} call={call} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
