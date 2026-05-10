# FinPal — AI Personal Finance Manager + Grounded Chatbot

> Semester NLP project. Production-inspired architecture, demoable in 5 minutes, zero-budget stack.
> Full architecture document: [`/.claude/plans/act-as-a-senior-warm-mccarthy.md`](../.claude/plans/act-as-a-senior-warm-mccarthy.md)

A Next.js 14 personal finance app for a single Pakistani user. Tracks income, expenses, savings, and forecasts next-month spending. Centerpiece: a tool-calling chatbot powered by **Groq Llama 3.3 70B** that gives grounded financial advice — every PKR figure it cites comes from a real tool call over real data, never from the model's imagination.

---

## What's inside

- **3 months of synthetic Pakistani spending** (Feb 10 – May 10, 2026) — total PKR 293,107, ~128 transactions, realistic merchants (Foodpanda, Cheezious, K-Electric, JazzCash, Daraz, FAST University…), day-of-week effects, salary cycles, one missed savings transfer, two anomalies.
- **Forecast engine** — EWMA(α=0.5) blended with linear trend across the 3 monthly aggregates per category. Honest about n=3 limits.
- **Rule engine** — affordability check, installment safety (EMI / disposable ratio), 5-component risk score (0–100), monthly health, savings recommendation, goal projection.
- **RAG** — local embeddings via Transformers.js (`Xenova/all-MiniLM-L6-v2`, 384 dims, runs in Node, no API key). Cosine top-k over per-transaction embeddings, with recency boost.
- **Chatbot orchestration** — Vercel AI SDK `streamText` + Groq, 11 tools, multi-step reasoning (`maxSteps=6`), Live Context Block in system prompt, output validator that flags ungrounded numbers.
- **Dashboard** — Overview KPIs, monthly trend, category pie, risk breakdown, recent transactions, paginated browser, forecast chart, affordability simulator, savings goal tracker.

---

## Setup

### 1. Prereqs
- Node.js 20+
- npm
- A Groq API key (free): https://console.groq.com/keys

### 2. Install + configure

```bash
cd finance-ai
npm install
```

Copy `.env.example` → `.env.local` and set your key:

```env
GROQ_API_KEY="gsk_your_real_key_here"
DATABASE_URL="file:./prisma/dev.db"
```

### 3. Initialize database + generate data

```bash
npx prisma migrate dev --name init   # creates prisma/dev.db
npx tsx scripts/seed.ts              # generates 3 months of synthetic transactions
npx tsx scripts/embed_all.ts         # one-shot: embeds transactions for RAG (downloads model on first run, ~25 MB)
```

The seeder asserts that 3-month total expense is in `[200,000, 300,000]` PKR.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

---

## Demo Script (viva, 5 minutes)

1. **Overview** — explain KPIs (liquid balance, MTD spend with projected, savings rate, income), risk band with breakdown, monthly trend, category pie.
2. **Forecast page** — show next-month projection with confidence band; explain *why simple > deep* (n=3 monthly aggregates). Use the Affordability Simulator: enter "iPhone 15", PKR 320,000, 6 months → simulator returns "not yet — short by PKR 403,190; ~37 months at current savings rate" with the rule's full reasoning.
3. **Chat** — ask in this order, expanding the **🔧 tool calls** trace under each answer:
   - *"What category am I overspending in?"* → expects `getCategoryBreakdown` + `getRiskScore`.
   - *"Can I afford an iPhone in 6 months?"* → `runAffordability` with `monthsAhead=6`.
   - *"Should I save first or buy on installments?"* → `runInstallmentSafety` + `runAffordability`.
   - *"Find the big purchase I made on Daraz"* → `retrieveSimilarTransactions` returns the seeded anomaly.
   - *"How risky is my spending right now?"* → `getRiskScore` with full breakdown.
   - *"Can I safely spend PKR 40,000 the rest of this month?"* → `getMonthlyHealth`.
4. **Wrap** — explain the four anti-hallucination layers (system prompt rule, Live Context Block, tool-only numbers, output validator), and how the architecture stays honest even with only 3 months of data.

---

## Project layout

```
finance-ai/
├── prisma/
│   ├── schema.prisma
│   └── dev.db                       # SQLite, gitignored
├── scripts/
│   ├── seed.ts                      # synthetic generator + DB seed
│   ├── embed_all.ts                 # RAG embeddings precompute
│   └── check.ts                     # quick DB inspector
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts        # streamText + tools (the chatbot)
│   │   │   ├── summary/route.ts
│   │   │   ├── forecast/route.ts
│   │   │   ├── risk/route.ts
│   │   │   ├── affordability/route.ts
│   │   │   └── transactions/route.ts
│   │   ├── page.tsx                 # Overview
│   │   ├── transactions/page.tsx
│   │   ├── forecast/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Nav.tsx
│   │   ├── KpiCard.tsx
│   │   ├── RiskBadge.tsx
│   │   ├── AffordabilitySimulator.tsx
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx       # useChat() + sample-question chips
│   │   │   └── ToolCallTrace.tsx    # expandable tool-call panel for viva
│   │   └── charts/
│   │       ├── MonthlyTrend.tsx
│   │       ├── CategoryPie.tsx
│   │       └── ForecastChart.tsx
│   └── lib/
│       ├── db.ts                    # Prisma singleton
│       ├── utils.ts                 # cn() helper
│       ├── types.ts
│       ├── finance/
│       │   ├── constants.ts         # thresholds + risk weights
│       │   ├── helpers.ts           # date math, aggregations, fmtPKR
│       │   ├── rules.ts             # affordability, risk, installment, etc.
│       │   └── snapshot.ts          # FinancialSnapshot for KPI cards
│       ├── forecast/
│       │   └── engine.ts            # EWMA + linear trend; anomaly z-score
│       ├── rag/
│       │   ├── embed.ts             # Transformers.js wrapper
│       │   └── retrieve.ts          # cosine top-k + recency boost
│       └── chat/
│           ├── tools.ts             # 11 tool definitions for the LLM
│           ├── prompt.ts            # system prompt + Live Context Block
│           ├── memory.ts            # short-term conversation history
│           └── validator.ts         # output number-grounding check
├── next.config.mjs                  # serverComponentsExternalPackages for Transformers.js + Prisma
├── tsconfig.json
└── package.json
```

---

## Architecture (one paragraph)

A Next.js 14 monolith. Server Components query SQLite via Prisma to render dashboards. The chat route (`/api/chat`) builds a system prompt with a **Live Context Block** (refreshed each turn) plus the user's profile + active goals. Vercel AI SDK's `streamText` is given **11 tools** mapped to deterministic functions (rule engine, snapshot, forecast, RAG retrieval). Groq Llama 3.3 70B picks tools, tools execute server-side, results stream back to the LLM, which synthesizes the answer. Before delivery, an output validator extracts every PKR / percent in the answer and verifies it appears (within tolerance) in either the tool results or the Live Context Block. Embeddings are computed locally with Transformers.js once and stored as `Bytes` in the `Transaction` table; runtime retrieval is in-memory cosine top-k. No microservices, no external vector DB, no Python — single repo, single deploy.

Full doc: [`/.claude/plans/act-as-a-senior-warm-mccarthy.md`](../.claude/plans/act-as-a-senior-warm-mccarthy.md). It also covers the production-scale aspirational architecture (microservices, pgvector, Prophet/TFT, OAuth, observability) so the design story stretches to enterprise scope at viva.

---

## The 11 tools the chatbot can call

| Tool | When the LLM calls it |
|---|---|
| `getFinancialSnapshot` | "How am I doing", current state, balances |
| `getCategoryBreakdown` | "How much on groceries", "biggest category" |
| `getForecast` | "Next month spend", "what will I spend" |
| `runAffordability` | "Can I afford X", "in how many months can I buy Y" |
| `runInstallmentSafety` | "Should I take installments for X", EMI safety |
| `getRiskScore` | "How risky am I", risk band + breakdown |
| `getMonthlyHealth` | "Am I overspending this month", run-rate vs baseline |
| `getSavingsRecommendation` | "How much should I save monthly" |
| `retrieveSimilarTransactions` | Fuzzy retrieval ("the Daraz thing", "food trips") |
| `getAnomalies` | Unusual spend flags |
| `getSavingsGoalProgress` | iPhone goal, emergency fund progress |

---

## Anti-hallucination (4 layers)

1. **System prompt rule** — "every number must come from a tool result or LIVE_CONTEXT".
2. **Live Context Block** — refreshed each turn with balances, MTD spend, projected month-end, top categories, risk score, anomalies, goals. The model sees authoritative numbers before deciding to call tools.
3. **Tool-only numbers** — every figure the user sees has provenance: which tool produced it, with what args.
4. **Output validator** (`src/lib/chat/validator.ts`) — extracts every `PKR …` / `%` from the assistant's answer and verifies it's within ±2% of a number returned by tools or sitting in the Live Context Block. Mismatches are surfaced (not silently stripped) so failures are visible at viva.

---

## Honest limits

- **Forecast:** n=3 monthly observations per category. EWMA + linear trend is statistically appropriate; anything deeper (Prophet, LSTM, TFT) would overfit. No seasonality detection (need ≥12 months).
- **Single user.** Authentication is scaffolded (UserProfile, accounts) but not wired — the demo uses hardcoded `userId = 1`.
- **No real bank integration.** The dataset is synthetic; CSV-import for HBL/Meezan/JazzCash is on the roadmap.
- **Embedding cold start.** Transformers.js downloads `Xenova/all-MiniLM-L6-v2` (~25 MB) on first call. Precompute step (`scripts/embed_all.ts`) does this once after seeding.

---

## Useful commands

```bash
npm run dev                          # dev server on :3000
npx tsc --noEmit                     # type-check
npx prisma studio                    # browse the DB at :5555
npx tsx scripts/seed.ts              # regenerate synthetic data
npx tsx scripts/embed_all.ts         # re-embed after re-seeding
npx tsx scripts/check.ts             # quick DB sanity print
```

---

## Tech credits

- Next.js 14 (App Router) · React 18 · TypeScript
- Prisma 6 + SQLite
- Vercel AI SDK 4 + `@ai-sdk/groq`
- Groq inference (free tier) — Llama 3.3 70B Versatile
- Transformers.js (`@xenova/transformers`) — local embeddings
- Recharts · Tailwind CSS · Faker
