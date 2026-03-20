# Run Project Guide

This guide explains how to run the app locally from scratch.

## 1) Prerequisites

- Node.js `20+`
- npm (comes with Node)
- OpenAI API key with access to:
  - Whisper transcription
  - Chat models (for analysis)

## 2) Install dependencies

From the project root:

```bash
npm install
```

## 3) Configure environment variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Open `.env.local` and set:

```env
OPENAI_API_KEY=your_key_here
```

Optional:

```env
OPENAI_ANALYSIS_MODEL=gpt-4o-mini
```

## 4) Start development server

```bash
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

## 5) Build and run production mode (optional)

```bash
npm run build
npm run start
```

## 6) Common commands

- Lint:

```bash
npm run lint
```

- Backfill old calls with inferred names:

```bash
npm run backfill:names
```

## 7) Where data is stored

- Processed calls: `data/calls.json`
- Uploaded audio: `public/uploads/`

## 8) Quick usage flow

1. Go to `Upload call`.
2. Upload MP3/WAV.
3. Wait for transcription + analysis.
4. Review dashboard and call insights.

## 9) Troubleshooting

- **Missing API key / auth errors**  
  Confirm `OPENAI_API_KEY` is set in `.env.local`.

- **Port already in use**  
  Start on another port:
  ```bash
  npm run dev -- -p 3001
  ```

- **No results after upload**  
  Check terminal logs for upload/API errors and verify network + OpenAI key access.
