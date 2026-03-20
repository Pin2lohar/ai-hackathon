"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, Trash2, User, UserRound } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DeleteCallDialog } from "@/components/calls/delete-call-dialog";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioPlayerCard } from "@/components/calls/audio-player-card";
import { BudgetCallBanner } from "@/components/calls/budget-call-banner";
import { LiveTranscriptDialog } from "@/components/calls/live-transcript-dialog";
import { InsightPanel } from "@/components/calls/insight-panel";
import { SentimentBadge } from "@/components/calls/sentiment-badge";
import { TranscriptViewer } from "@/components/calls/transcript-viewer";
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

export function CallDetailView({ call }: { call: CallDocument }) {
  const router = useRouter();
  const pageAudioRef = useRef<HTMLAudioElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const processedLabel = useProcessedLabel(call.createdAt);
  const audioUrl = `/uploads/${encodeURIComponent(call.storedFilename)}`;
  const scores = call.analysis.performance_scores;
  const scoreRows = [
    { key: "Communication", value: scores.communication },
    { key: "Politeness", value: scores.politeness },
    { key: "Business knowledge", value: scores.business_knowledge },
    { key: "Problem handling", value: scores.problem_handling },
    { key: "Listening", value: scores.listening },
  ];

  const talkData = [
    { name: "Agent", value: call.analysis.talk_time.agentPercent },
    { name: "Customer", value: call.analysis.talk_time.customerPercent },
  ];

  const coverageEntries = Object.entries(call.analysis.questionnaire_coverage);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            href="/calls"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-2 -ml-2 inline-flex gap-1 rounded-xl text-muted-foreground",
            )}
          >
            <ArrowLeft className="size-4" />
            All calls
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {call.originalFilename}
          </h1>
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-4 shrink-0 opacity-80" aria-hidden />
                <span className="font-medium">Processed</span>
                <span className="tabular-nums">{processedLabel || "—"}</span>
              </span>
            </p>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <User className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <span className="text-muted-foreground">Sales rep</span>
                <span className="font-medium text-foreground">
                  {displayOrDash(call.analysis.sales_rep_name)}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium text-foreground">
                  {displayOrDash(call.analysis.customer_name)}
                </span>
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <SentimentBadge sentiment={call.analysis.sentiment} />
            <span>Duration {formatDuration(call.durationSeconds)}</span>
            <span className="font-medium text-foreground">
              Score {call.analysis.agent_score.toFixed(1)}/10
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 gap-2 rounded-xl border-destructive/25 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" />
          Delete call
        </Button>
      </div>

      <DeleteCallDialog
        call={call}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          void router.push("/calls");
          router.refresh();
        }}
      />

      <BudgetCallBanner budget={call.analysis.budget} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AudioPlayerCard
          ref={pageAudioRef}
          title={call.originalFilename}
          audioUrl={audioUrl}
          footer={
            <LiveTranscriptDialog
              call={call}
              audioUrl={audioUrl}
              pageAudioRef={pageAudioRef}
            />
          }
        />
        <Card className="rounded-xl border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <p className="text-sm leading-relaxed">{call.analysis.summary}</p>
            <Separator />
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                Keywords
              </p>
              <div className="flex flex-wrap gap-2">
                {call.analysis.keywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-2xl border border-border/80 bg-background/75 p-1.5 backdrop-blur-sm">
          <TabsTrigger value="insights" className="rounded-xl px-4 py-2 hover:bg-gray-100 hover:shadow-md">
            Insights
          </TabsTrigger>
          <TabsTrigger value="scores" className="rounded-xl px-4 py-2 hover:bg-gray-100 hover:shadow-md">
            Scores & talk time
          </TabsTrigger>
          <TabsTrigger value="transcript" className="rounded-xl px-4 py-2 hover:bg-gray-100 hover:shadow-md">
            Transcript
          </TabsTrigger>
        </TabsList>
        <TabsContent value="insights" className="mt-6 space-y-6">
          {call.analysis.financial_insights.length > 0 ? (
            <InsightPanel
              title="Money and financial insights"
              items={call.analysis.financial_insights}
            />
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <InsightPanel
              title="Positive observations"
              items={call.analysis.positive_observations}
              variant="positive"
            />
            <InsightPanel
              title="Negative observations"
              items={call.analysis.negative_observations}
              variant="negative"
            />
          </div>
          <InsightPanel title="Action items" items={call.analysis.action_items} />
          <Card className="rounded-xl border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Questionnaire coverage
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Evidence-based checklist from the transcript
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {coverageEntries.map(([key, ok]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                >
                  <span className="capitalize text-muted-foreground">
                    {key.replaceAll("_", " ")}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {ok ? "Yes" : "No"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="scores" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-border/80 bg-background/90 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Talk time</CardTitle>
              </CardHeader>
              <CardContent className="h-64 pt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={talkData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      <Cell fill="#6366f1" />
                      <Cell fill="#06b6d4" />
                    </Pie>
                    <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 8 }} />
                    <Tooltip
                      formatter={(value) => [
                        typeof value === "number" ? `${value}%` : String(value ?? ""),
                        "Share",
                      ]}
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "1px solid var(--border)",
                        background: "var(--popover)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border/80 bg-background/90 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Overall agent score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tabular-nums">
                    {call.analysis.agent_score.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground text-sm">/ 10</span>
                </div>
                <Progress
                  value={call.analysis.agent_score * 10}
                  className="h-2 rounded-full"
                />
              </CardContent>
            </Card>
          </div>
          <Card className="rounded-2xl border-border/80 bg-background/90 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Performance dimensions
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreRows} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis
                    dataKey="key"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={64}
                  />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} width={28} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={36}>
                    {scoreRows.map((row, i) => (
                      <Cell
                        key={row.key}
                        fill={
                          i % 5 === 0
                            ? "#6366f1"
                            : i % 5 === 1
                              ? "#8b5cf6"
                              : i % 5 === 2
                                ? "#0ea5e9"
                                : i % 5 === 3
                                  ? "#14b8a6"
                                  : "#f59e0b"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transcript" className="mt-6">
          <TranscriptViewer transcript={call.transcript} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
