import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { extractCallParticipantNames } from "@/lib/extract-call-names";
import { ensureUploadsDir } from "@/lib/uploads-dir";
import type {
  BudgetDiscussion,
  CallAnalysis,
  CallDocument,
} from "@/types/call";
import type { TranscriptTurn } from "@/types/transcript-turn";

const DATA_DIR = path.join(process.cwd(), "data");
const CALLS_FILE = path.join(DATA_DIR, "calls.json");

type StoredCall = {
  _id: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  durationSeconds: number;
  transcript: string;
  transcriptTurns?: TranscriptTurn[];
  analysis: CallAnalysis;
  createdAt: string;
};

type FileShape = { calls: StoredCall[] };

let chain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readCallsRaw(): Promise<StoredCall[]> {
  const raw = await readFile(CALLS_FILE, "utf8").catch(
    (e: NodeJS.ErrnoException) => {
      if (e.code === "ENOENT") {
        return '{"calls":[]}';
      }
      throw e;
    },
  );
  try {
    const parsed = JSON.parse(raw) as FileShape | StoredCall[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return Array.isArray(parsed.calls) ? parsed.calls : [];
  } catch {
    return [];
  }
}

async function writeCallsRaw(calls: StoredCall[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const payload: FileShape = { calls };
  await writeFile(CALLS_FILE, JSON.stringify(payload, null, 2), "utf8");
}

const DEFAULT_BUDGET: BudgetDiscussion = {
  discussed: false,
  amount: null,
  currency: "",
  amount_descriptor: "",
  headline: "",
};

function normalizeBudgetFromStorage(input: unknown): BudgetDiscussion {
  if (!input || typeof input !== "object") {
    return { ...DEFAULT_BUDGET };
  }
  const o = input as Record<string, unknown>;
  const amount = o.amount;
  return {
    discussed: o.discussed === true,
    amount:
      typeof amount === "number" && Number.isFinite(amount) ? amount : null,
    currency: typeof o.currency === "string" ? o.currency.trim() : "",
    amount_descriptor:
      typeof o.amount_descriptor === "string" ? o.amount_descriptor.trim() : "",
    headline: typeof o.headline === "string" ? o.headline.trim() : "",
  };
}

function normalizeFinancialInsightsFromStorage(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 12);
}

function normalizeAnalysisForRead(analysis: CallAnalysis): CallAnalysis {
  const r = analysis as unknown as Record<string, unknown>;
  const base = { ...analysis } as CallAnalysis;
  return {
    ...base,
    sales_rep_name:
      typeof r.sales_rep_name === "string" ? r.sales_rep_name.trim() : "",
    customer_name:
      typeof r.customer_name === "string" ? r.customer_name.trim() : "",
    budget: normalizeBudgetFromStorage(r.budget),
    financial_insights: normalizeFinancialInsightsFromStorage(
      r.financial_insights,
    ),
  };
}

function normalizeTranscriptTurns(doc: StoredCall): TranscriptTurn[] {
  const t = doc.transcriptTurns;
  if (!Array.isArray(t)) return [];
  return t.filter(
    (row): row is TranscriptTurn =>
      !!row &&
      typeof row === "object" &&
      typeof (row as TranscriptTurn).start === "number" &&
      typeof (row as TranscriptTurn).end === "number" &&
      typeof (row as TranscriptTurn).text === "string" &&
      ((row as TranscriptTurn).speaker === "sales_rep" ||
        (row as TranscriptTurn).speaker === "customer"),
  );
}

function toCallDocument(doc: StoredCall): CallDocument {
  return {
    _id: doc._id,
    originalFilename: doc.originalFilename,
    storedFilename: doc.storedFilename,
    mimeType: doc.mimeType,
    durationSeconds: doc.durationSeconds,
    transcript: doc.transcript,
    transcriptTurns: normalizeTranscriptTurns(doc),
    analysis: normalizeAnalysisForRead(doc.analysis),
    createdAt: doc.createdAt,
  };
}

export async function insertCall(input: {
  _id: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  durationSeconds: number;
  transcript: string;
  transcriptTurns: TranscriptTurn[];
  analysis: CallAnalysis;
}): Promise<CallDocument> {
  return withLock(async () => {
    const calls = await readCallsRaw();
    const now = new Date().toISOString();
    const stored: StoredCall = {
      ...input,
      createdAt: now,
    };
    calls.push(stored);
    await writeCallsRaw(calls);
    return toCallDocument(stored);
  });
}

/**
 * Re-runs focused name extraction for stored calls missing sales rep or customer
 * names (e.g. analyzed before the two-pass pipeline). Uses OpenAI; run via
 * `npm run backfill:names`.
 */
export async function backfillMissingParticipantNames(): Promise<{
  updated: number;
  examined: number;
}> {
  return withLock(async () => {
    const calls = await readCallsRaw();
    let updated = 0;
    for (const c of calls) {
      const er = (c.analysis.sales_rep_name ?? "").trim();
      const ec = (c.analysis.customer_name ?? "").trim();
      if (er && ec) continue;
      const extracted = await extractCallParticipantNames(c.transcript);
      const nextRep = er || extracted.sales_rep_name;
      const nextCust = ec || extracted.customer_name;
      if (nextRep === er && nextCust === ec) continue;
      c.analysis = {
        ...c.analysis,
        sales_rep_name: nextRep,
        customer_name: nextCust,
      };
      updated++;
    }
    if (updated > 0) {
      await writeCallsRaw(calls);
    }
    return { updated, examined: calls.length };
  });
}

export async function listCalls(limit = 100): Promise<CallDocument[]> {
  return withLock(async () => {
    const calls = await readCallsRaw();
    const sorted = [...calls].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return sorted
      .slice(0, Math.min(limit, 200))
      .map((c) => toCallDocument(c));
  });
}

/** Every processed call, newest first (for the calls index page). */
export async function listAllCalls(): Promise<CallDocument[]> {
  return withLock(async () => {
    const calls = await readCallsRaw();
    const sorted = [...calls].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return sorted.map((c) => toCallDocument(c));
  });
}

function isLikelyCallId(id: string): boolean {
  return id.length > 0 && id.length <= 128 && !/[\\/]/.test(id);
}

export async function getCallById(id: string): Promise<CallDocument | null> {
  if (!isLikelyCallId(id)) {
    return null;
  }
  return withLock(async () => {
    const calls = await readCallsRaw();
    const found = calls.find((c) => c._id === id);
    return found ? toCallDocument(found) : null;
  });
}

const STORED_AUDIO_BASENAME = /^[a-f0-9-]{36}\.(mp3|wav)$/i;

/**
 * Removes a call from persisted storage and deletes its audio file under
 * public/uploads when the filename matches the expected UUID pattern.
 */
export async function deleteCallById(
  id: string,
): Promise<{ ok: true } | { ok: false; reason: "not_found" | "invalid_id" }> {
  if (!isLikelyCallId(id)) {
    return { ok: false, reason: "invalid_id" };
  }
  return withLock(async () => {
    const calls = await readCallsRaw();
    const idx = calls.findIndex((c) => c._id === id);
    if (idx === -1) {
      return { ok: false, reason: "not_found" };
    }
    const removed = calls[idx]!;
    const next = calls.filter((_, i) => i !== idx);
    await writeCallsRaw(next);

    const base = path.basename(removed.storedFilename);
    if (
      base === removed.storedFilename &&
      STORED_AUDIO_BASENAME.test(base)
    ) {
      const uploadsDir = await ensureUploadsDir();
      const filePath = path.join(uploadsDir, base);
      await unlink(filePath).catch(() => {});
    }

    return { ok: true };
  });
}

export type DashboardStats = {
  /** Calls successfully stored after transcription + analysis */
  totalCalls: number;
  sentimentSplit: { sentiment: string; count: number }[];
  /** Counts for the three primary sentiment labels (other labels roll into neutral) */
  sentimentBuckets: {
    positive: number;
    neutral: number;
    negative: number;
  };
  averageAgentScore: number | null;
  averageDurationSeconds: number | null;
  keywordFrequency: { keyword: string; count: number }[];
  /** Sum of keyword occurrences across the library (each call’s keyword list contributes) */
  totalKeywordMentions: number;
  /** Distinct normalized keyword strings observed */
  uniqueKeywordCount: number;
  /** Top terms for dashboard summary (subset of keywordFrequency) */
  topKeywordsPreview: { keyword: string; count: number }[];
  totalActionItems: number;
  /** Calls where budget/pricing/money was discussed (normalized from analysis). */
  budgetDiscussedCount: number;
  /** Subset of budget discussions that include a numeric amount. */
  callsWithStatedBudgetAmount: number;
  /** 0–100; share of library with budget discussion. */
  pctCallsBudgetDiscussed: number;
  /** Largest stated amounts first (for dashboard list). */
  budgetHighlights: {
    _id: string;
    originalFilename: string;
    amount: number;
    currency: string;
    headline: string;
  }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  return withLock(async () => {
    const calls = await readCallsRaw();
    const totalCalls = calls.length;

    if (totalCalls === 0) {
      return {
        totalCalls: 0,
        sentimentSplit: [],
        sentimentBuckets: { positive: 0, neutral: 0, negative: 0 },
        averageAgentScore: null,
        averageDurationSeconds: null,
        keywordFrequency: [],
        totalKeywordMentions: 0,
        uniqueKeywordCount: 0,
        topKeywordsPreview: [],
        totalActionItems: 0,
        budgetDiscussedCount: 0,
        callsWithStatedBudgetAmount: 0,
        pctCallsBudgetDiscussed: 0,
        budgetHighlights: [],
      };
    }

    let scoreSum = 0;
    let durationSum = 0;
    let totalActionItems = 0;
    let budgetDiscussedCount = 0;
    let callsWithStatedBudgetAmount = 0;
    const sentimentCounts = new Map<string, number>();
    const keywordCounts = new Map<string, number>();
    const budgetHighlightRows: {
      _id: string;
      originalFilename: string;
      amount: number;
      currency: string;
      headline: string;
    }[] = [];

    for (const c of calls) {
      const analysis = normalizeAnalysisForRead(c.analysis);
      scoreSum += analysis.agent_score;
      durationSum += c.durationSeconds;
      totalActionItems += analysis.action_items?.length ?? 0;

      if (analysis.budget.discussed) {
        budgetDiscussedCount += 1;
        if (analysis.budget.amount != null) {
          callsWithStatedBudgetAmount += 1;
          budgetHighlightRows.push({
            _id: c._id,
            originalFilename: c.originalFilename,
            amount: analysis.budget.amount,
            currency: analysis.budget.currency,
            headline: analysis.budget.headline,
          });
        }
      }

      const s = analysis.sentiment;
      sentimentCounts.set(s, (sentimentCounts.get(s) ?? 0) + 1);

      for (const kw of analysis.keywords ?? []) {
        const key = kw.trim().toLowerCase();
        if (!key) continue;
        keywordCounts.set(key, (keywordCounts.get(key) ?? 0) + 1);
      }
    }

    const sentimentSplit = [...sentimentCounts.entries()]
      .map(([sentiment, count]) => ({ sentiment, count }))
      .sort((a, b) => b.count - a.count);

    let bucketPositive = 0;
    let bucketNeutral = 0;
    let bucketNegative = 0;
    for (const [label, count] of sentimentCounts.entries()) {
      const key = label.trim().toLowerCase();
      if (key === "positive") bucketPositive += count;
      else if (key === "negative") bucketNegative += count;
      else bucketNeutral += count;
    }

    const keywordFrequency = [...keywordCounts.entries()]
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 24);

    let totalKeywordMentions = 0;
    for (const c of keywordCounts.values()) {
      totalKeywordMentions += c;
    }

    const uniqueKeywordCount = keywordCounts.size;
    const topKeywordsPreview = keywordFrequency.slice(0, 5);

    budgetHighlightRows.sort((a, b) => b.amount - a.amount);
    const budgetHighlights = budgetHighlightRows.slice(0, 8);
    const pctCallsBudgetDiscussed = Math.round(
      (budgetDiscussedCount / totalCalls) * 100,
    );

    return {
      totalCalls,
      sentimentSplit,
      sentimentBuckets: {
        positive: bucketPositive,
        neutral: bucketNeutral,
        negative: bucketNegative,
      },
      averageAgentScore: scoreSum / totalCalls,
      averageDurationSeconds: durationSum / totalCalls,
      keywordFrequency,
      totalKeywordMentions,
      uniqueKeywordCount,
      topKeywordsPreview,
      totalActionItems,
      budgetDiscussedCount,
      callsWithStatedBudgetAmount,
      pctCallsBudgetDiscussed,
      budgetHighlights,
    };
  });
}
