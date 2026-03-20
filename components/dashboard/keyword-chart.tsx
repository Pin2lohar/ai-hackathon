"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function KeywordChart({
  data,
}: {
  data: { keyword: string; count: number }[];
}) {
  const chartData = data.map((d, i) => ({
    keyword:
      d.keyword.length > 28 ? `${d.keyword.slice(0, 26)}…` : d.keyword,
    count: d.count,
    full: d.keyword,
    fill:
      i % 5 === 0
        ? "#6366f1"
        : i % 5 === 1
          ? "#8b5cf6"
          : i % 5 === 2
            ? "#0ea5e9"
            : i % 5 === 3
              ? "#14b8a6"
              : "#f59e0b",
  }));

  return (
    <Card className="rounded-2xl border-border/80 bg-background/90 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Keyword frequency</CardTitle>
        <p className="text-muted-foreground text-sm">
          Top terms extracted from transcripts
        </p>
      </CardHeader>
      <CardContent className="h-80 pt-0">
        {chartData.length === 0 ? (
          <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
            No keywords yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="keyword"
                width={120}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.15 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const row = payload[0].payload as {
                    full: string;
                    count: number;
                  };
                  return (
                    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-sm shadow-md">
                      <p className="font-medium">{row.full}</p>
                      <p className="text-muted-foreground">{row.count} mentions</p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="count"
                radius={[0, 6, 6, 0]}
                fill="var(--primary)"
                maxBarSize={18}
              >
                {chartData.map((row) => (
                  <Cell key={row.full} fill={row.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
