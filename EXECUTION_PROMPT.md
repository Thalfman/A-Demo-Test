# EXECUTION PROMPT — Build the PM/Ops AI Proof-of-Concept

> Run this prompt against the existing scaffold in this repository. It builds the
> shared UI + chart components and all four module pages, one at a time, with a
> green `npm run build` after each step. It is self-contained — everything you
> need is below or in `PLAN.md` / `lib/types.ts`.

## Role & goal

You are implementing the UI for a **static, client-only Next.js proof of
concept**. The scaffold already exists: config, the full data layer in `/lib`, a
committed synthetic dataset in `/data`, and an app shell with placeholder routes.
Your job is to replace the four placeholder pages with real modules, building the
shared presentational components first. When you finish, `npm run build` must
succeed and produce a working static `out/`.

## Hard rules

1. **Static export only.** No API routes, no server actions, no `next/image`
   remote loaders, no env/secrets, no network calls. `output: 'export'` is set.
2. **Do not modify** `lib/types.ts`, `lib/normalize.ts`, `lib/format.ts`,
   `lib/tokens.ts`, `lib/loaders.ts`, `scripts/generate-data.ts`, or anything in
   `/data`. Consume them as-is. (You may add new files under `/components` and
   replace files under `/app`.)
3. **Pages are server components** that load data via `lib/loaders.ts`. Push all
   interactivity (filter/sort/select) and **all Recharts charts** into
   `'use client'` child components.
4. **Null-safe always.** Render every value through `lib/format.*`. The dataset is
   deliberately messy (nulls, drifting dates, spelling drift) — surface it, don't
   crash on it.
5. **Label AI content.** Every precomputed AI artifact is rendered with an
   `AIBadge` / `AICallout` so it is unmistakably AI-generated.
6. **Build gate.** Run `npm run build` after the component step and after each
   module. Fix all type, lint, and build errors before continuing. Never advance
   on a red build.

## Data contract (read `PLAN.md` §4–6 for detail)

- Loaders: `getPortfolio`, `getEvm`, `getReconciliation`, `getDocuments`,
  `getMeta` from `@/lib/loaders`.
- Model: all types in `@/lib/types` (e.g., `Project`, `RawProject`, `EvmData`,
  `Discrepancy`, `AppDocument`, `AiArtifact`, `ProjectStatus`, `Severity`).
- Normalize messy portfolio rows: `normalizePortfolio` from `@/lib/normalize`
  (returns clean `Project[]` + `summary`; each project carries `.flags`).
- Format: `formatCurrency`, `formatPercent`, `formatNumber`, `formatRatio`,
  `formatDate`, `statusToColorToken` from `@/lib/format`.
- Chart colors: `colors`, `statusColors`, `chartPalette`, `evmSeriesColors` from
  `@/lib/tokens`.

## Steps

### Step 0 — Baseline
Run `npm install` (already satisfied) and `npm run build`. Confirm it is green
before changing anything.

### Step 1 — Shared components (`/components`)
Build the inventory from `PLAN.md` §5: `Card`, `StatCard`, `StatusBadge`,
`SeverityChip`, `AIBadge`, `AICallout`, `DataTable<T>`, `FilterBar`,
`ChartContainer`, `EvmLineChart`, `CategoryBarChart`, `IndexBullet`,
`DocumentViewer`, `DataQualityChip`.
- Use Tailwind utilities and the design tokens (e.g., `bg-surface-raised`,
  `border-border`, `text-ink-muted`, `rounded-token`, `text-brand`).
- Chart components and any stateful component: add `'use client'`.
- `DataTable` is generic, sortable, and renders `"—"` for missing cells via
  `lib/format`.
- Keep `Placeholder.tsx` until each page is replaced.
- **Run `npm run build`.** Fix everything before Step 2.

### Step 2 — Module 1: Portfolio Health (`app/portfolio/page.tsx`)
Implement per `PLAN.md` §6 Module 1: AI briefing callout → roll-up `StatCard`s →
`FilterBar` (division/status/phase) → status + budget-by-division
`CategoryBarChart`s → projects `DataTable` with `StatusBadge` and
`DataQualityChip`. Server page loads `getPortfolio()`, runs `normalizePortfolio`,
passes `Project[]` to a client component for filtering/sorting.
- **Run `npm run build`.** Fix all errors.

### Step 3 — Module 2: EVM & Variance (`app/evm/page.tsx`)
Implement per `PLAN.md` §6 Module 2: portfolio CPI/SPI/CV/VAC `StatCard`s →
portfolio `EvmLineChart` → `AICallout` (`aiNarrative`) + Recommended Actions list
(`recommendedActions`, with `SeverityChip`) → per-project `DataTable` with
drill-down `EvmLineChart` + `IndexBullet`. Loads `getEvm()`.
- **Run `npm run build`.** Fix all errors.

### Step 4 — Module 3: Cross-System Reconciliation (`app/reconciliation/page.tsx`)
Implement per `PLAN.md` §6 Module 3: `AICallout` (`aiSummary`) → discrepancy
`StatCard`s → discrepancy `DataTable` (finance vs PMO values, `SeverityChip`) →
optional side-by-side export tables with mismatch highlighting. Loads
`getReconciliation()`.
- **Run `npm run build`.** Fix all errors.

### Step 5 — Module 4: Status & SOP Library (`app/documents/page.tsx`)
Implement per `PLAN.md` §6 Module 4: grouped Status Reports and SOPs as `Card`s
(title, summary, tags, `AIBadge`) → `DocumentViewer` rendering `doc.body`
markdown. Loads `getDocuments()`.
- **Run `npm run build`.** Fix all errors.

### Step 6 — Finish
- Delete `components/Placeholder.tsx` once no route imports it.
- Run `npm run build` (must be green) and confirm `out/` contains
  `index.html` plus `portfolio/`, `evm/`, `reconciliation/`, `documents/`.
- Smoke-test with `npm run dev`: every tab renders real content, charts draw, no
  console errors, missing values show as `"—"`, AI sections are labeled.

## Definition of done
A fully working static app: four real modules driven by the committed synthetic
data, AI artifacts surfaced and labeled in every module, deterministic data
untouched, and `npm run build` producing a clean static `out/`.
