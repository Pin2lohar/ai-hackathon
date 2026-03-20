"use client";

import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS: Record<string, string> = {
  positive: "#10b981",
  neutral: "#6366f1",
  negative: "#ef4444",
  unknown: "var(--muted-foreground)",
};

export function SentimentChart({
  data,
}: {
  data: { sentiment: string; count: number }[];
}) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        name: d.sentiment,
        value: d.count,
      })),
    [data],
  );
  const total = chartData.reduce((sum, row) => sum + row.value, 0);

  return (
    <Card className="rounded-2xl border-border/80 bg-background/90 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Sentiment split</CardTitle>
        <p className="text-muted-foreground text-sm">
          Distribution across analyzed calls
        </p>
      </CardHeader>
      <CardContent className="h-72 pt-0">
        {chartData.length === 0 ? (
          <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
            No data yet — upload a call to get started.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius={56}
                outerRadius={86}
                paddingAngle={3}
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={2}
                label={({ name, value }) => {
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return `${name} ${pct}%`;
                }}
                labelLine={false}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[entry.name] ?? COLORS.unknown}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: 8 }}
                formatter={(value, entry) => {
                  const raw = entry.payload as { value: number };
                  const pct =
                    total > 0 ? Math.round(((raw?.value ?? 0) / total) * 100) : 0;
                  return `${value} (${pct}%)`;
                }}
              />
              <Tooltip
                formatter={(value) => {
                  const n = typeof value === "number" ? value : Number(value ?? 0);
                  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                  return [`${n} calls (${pct}%)`, "Count"];
                }}
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
