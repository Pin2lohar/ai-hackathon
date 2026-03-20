import type { CallDocument } from "@/types/call";

function sentimentValue(
  call: CallDocument,
): "positive" | "neutral" | "negative" {
  const raw = call.analysis.sentiment?.trim().toLowerCase();
  if (raw === "positive" || raw === "negative" || raw === "neutral") {
    return raw;
  }
  return "neutral";
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 1) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m > 0) {
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${s}s`;
}

/** One cell: multiple lines so each item is readable in Sheets/Excel when the row is tall enough. */
function formatActionItems(call: CallDocument): string {
  const items = call.analysis.action_items ?? [];
  const cleaned = items.map((x) => String(x).trim()).filter(Boolean);
  if (cleaned.length === 0) return "";
  return cleaned.join("\n");
}

const HEADERS = [
  "Sales rep name",
  "Customer name",
  "Positive",
  "Neutral",
  "Negative",
  "Date (processed)",
  "Budget or money discussed",
  "Call duration",
  "Action items",
] as const;

/**
 * Builds CSV for the given calls (already filtered). Columns match spreadsheet-friendly
 * Yes/No flags for sentiment and budget discussion.
 */
export function buildCallsExportCsv(calls: CallDocument[]): string {
  const rows: string[][] = [Array.from(HEADERS)];

  for (const call of calls) {
    const s = sentimentValue(call);
    const budgetDiscussed = call.analysis.budget?.discussed === true;
    rows.push([
      (call.analysis.sales_rep_name ?? "").trim(),
      (call.analysis.customer_name ?? "").trim(),
      s === "positive" ? "Yes" : "No",
      s === "neutral" ? "Yes" : "No",
      s === "negative" ? "Yes" : "No",
      call.createdAt,
      budgetDiscussed ? "Yes" : "No",
      formatDuration(call.durationSeconds),
      formatActionItems(call),
    ]);
  }

  return rows.map((r) => r.map(escapeCsvCell).join(",")).join("\r\n");
}

function sanitizeFilenamePart(label: string): string {
  return label.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "calls";
}

/**
 * Triggers a browser download of calls as UTF-8 CSV (BOM-prefixed for Excel).
 */
export function downloadCallsCsv(
  calls: CallDocument[],
  filterLabel: string,
): void {
  const csv = buildCallsExportCsv(calls);
  const stamp = new Date().toISOString().slice(0, 10);
  const part = sanitizeFilenamePart(filterLabel);
  const filename = `calls-export-${part}-${stamp}.csv`;

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
