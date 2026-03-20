# AI Call Intelligence Platform

Next.js (App Router) app that uploads MP3/WAV recordings, transcribes with **OpenAI Whisper**, analyzes transcripts with **GPT** into structured JSON, persists results in a **local JSON file** (`data/calls.json`), and surfaces a **dashboard** plus **call detail** views with charts.

**No database required** — only an OpenAI API key.

## Prerequisites

- Node.js 20+
- OpenAI API key with access to Whisper and chat models

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Set `OPENAI_API_KEY`. Optionally set `OPENAI_ANALYSIS_MODEL` (default: `gpt-4o-mini`).

3. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Go to **Upload call** and submit an MP3 or WAV (max 25MB), or use **Bulk upload** for up to 10 files in one batch (same pipeline per file).
2. The API saves audio under `public/uploads/`, transcribes, analyzes, and appends the call to `data/calls.json`.
3. **Dashboard** shows aggregates: totals, sentiment split, average score/duration, keyword frequency, action-item count, and recent calls.
4. **All calls** (`/calls`) lists every processed recording; click a card to open insights for that call.
5. On a call detail page: audio playback, transcript, tabs for insights/scores, and charts.

**Live transcript** (call detail): open **Live transcript** on the recording card for a popup with audio and speaker-labeled lines; new uploads sync highlights to playback using Whisper timestamps + GPT speaker labeling. Older calls show plain transcript in the popup until re-uploaded.

**Sales rep / customer names** are inferred from each transcript (main analysis plus a focused extraction pass when needed). Calls processed **before** that logic may show blank names until you run:

```bash
npm run backfill:names
```

(Requires Node 20+ with `--env-file` support and `OPENAI_API_KEY` in `.env.local`.)

## Production notes

- **Call data**: Stored in `data/calls.json` on the server filesystem. For serverless or multiple instances, replace with a real database or object storage.
- **Audio files**: Stored under `public/uploads/`. For production, use S3 (or similar) and store URLs in your datastore.
- **Timeouts**: The upload route sets `maxDuration` for long-running transcription/analysis on supported hosts.
- **Secrets**: Keep API keys in environment variables only (see `.env.example`).

## Stack

- Next.js 16, React 19, TypeScript (strict)
- Tailwind CSS v4, shadcn/ui (Base UI)
- OpenAI SDK (Whisper + chat completions)
- Zod, Recharts, Sonner
