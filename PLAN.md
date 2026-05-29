# PLAN — PM/Ops AI Proof-of-Concept

Build-ready specifications for all four modules. The scaffold (config, data layer,
synthetic data, app shell) already exists in this repo. This document is the
contract the execution run (`EXECUTION_PROMPT.md`) builds against. **No module UI
or shared presentational components have been built yet** — only the app shell
(navigation + placeholder routes).

---

## 1. Context

A static, client-only Next.js app demonstrating AI-generated value across four
project-management / operations workflows, using one coherent synthetic
portfolio. It is a proof of concept for a prospective employer — no backend, no
live model calls, no secrets. Every data point and every AI artifact is
precomputed and bundled.

## 2. Architecture & boundary

```
data/*.json  ──▶  lib/loaders.ts  ──▶  (module page = server component)
                       │                      │ passes typed data
                  lib/types.ts                ▼
                  (SSOT model)        client child components ──▶ shared UI + Recharts
                       ▲                      │
   lib/normalize.ts ───┘   lib/format.ts ◀────┘   lib/tokens.ts (chart colors)
```

- **Pages are server components** that read data through `lib/loaders.ts` and pass
  it to **client child components** (`'use client'`) for any interactivity
  (filtering, sorting, selection) and all Recharts visuals.
- **Static-export safe**: no API routes, no server-only runtime, no `next/image`
  remote loaders. `next.config.mjs` already sets `output: 'export'`.
- **Never** modify `lib/types.ts`, the generator, or `/data` to fit the UI —
  consume them as-is. If a field is missing, surface it (it is intentional mess).

## 3. Tech stack (already configured)

Next.js 14.2 (App Router) · React 18 · TypeScript 5 (strict) · Tailwind v3 ·
Recharts 2 (already a dependency). Path alias `@/*` → repo root.

## 4. Data model reference (single source of truth)

All types live in **`lib/types.ts`**. Load only through **`lib/loaders.ts`**:

| Loader | Returns | Backing file | Key shapes |
| --- | --- | --- | --- |
| `getPortfolio()` | `PortfolioData` | `data/portfolio.json` | `projects: RawProject[]`, `aiBriefing: AiArtifact` |
| `getEvm()` | `EvmData` | `data/evm.json` | `portfolio{metrics,series}`, `projects: EvmProjectEntry[]`, `aiNarrative`, `recommendedActions` |
| `getReconciliation()` | `ReconciliationData` | `data/reconciliation.json` | `financeExport`, `pmoExport` (`ReconExport`), `discrepancies: Discrepancy[]`, `aiSummary` |
| `getDocuments()` | `DocumentsData` | `data/documents.json` | `statusReports: AppDocument[]`, `sops: AppDocument[]` |
| `getMeta()` | `Meta` | `data/meta.json` | `counts`, `dataQuality`, `divisions`, `modules` |

Supporting utilities:

- **`lib/normalize.ts`** — `normalizePortfolio(projects: RawProject[])` →
  `{ projects: Project[]; summary: DataQualitySummary }`. Canonicalizes spellings,
  reparses drifting dates, and attaches `DataQualityFlag[]` per project
  (`project.flags`). Module 1 **must** run raw projects through this.
- **`lib/format.ts`** — null-safe display helpers (return `"—"` for missing):
  `formatCurrency`, `formatPercent` (0..1 ratio), `formatNumber`, `formatRatio`
  (CPI/SPI), `formatDate`, `statusToColorToken`. Use these for **every** rendered
  value.
- **`lib/tokens.ts`** — `colors`, `statusColors` (by `ProjectStatus`),
  `chartPalette`, `evmSeriesColors` (`pv`/`ev`/`ac`). Use for Recharts fills/strokes.

## 5. Shared component inventory (build first, in `/components`)

Build these before any page. Keep stateless where possible; mark chart and
interactive components `'use client'`.

| Component | Purpose | Props (sketch) | Uses |
| --- | --- | --- | --- |
| `Card` | Titled container | `{ title?, action?, children, className? }` | — |
| `StatCard` | KPI tile | `{ label, value, hint?, tone?: 'positive'\|'negative'\|'neutral' }` | format.* |
| `StatusBadge` | Status pill | `{ status: ProjectStatus }` | `statusColors` |
| `SeverityChip` | Severity tag | `{ severity: Severity }` | tokens |
| `AIBadge` | Labels AI content | `{ generatedAt?: string }` | — |
| `AICallout` | Renders an `AiArtifact` (body + bullets) with `AIBadge` | `{ artifact: AiArtifact }` | — |
| `DataTable<T>` | Sortable, null-safe table | `{ columns, rows, initialSort? }` | format.* |
| `FilterBar` | Select/segmented filters | `{ filters, values, onChange }` | — |
| `ChartContainer` | Responsive Recharts wrapper | `{ title?, height?, children }` | Recharts `ResponsiveContainer` |
| `EvmLineChart` | PV/EV/AC curves | `{ data: EvmSeriesPoint[] }` | `evmSeriesColors` |
| `CategoryBarChart` | Categorical bars | `{ data, xKey, bars }` | `chartPalette` |
| `IndexBullet` | CPI/SPI vs 1.0 | `{ label, value, target?=1 }` | `statusColors` |
| `DocumentViewer` | Render `AppDocument.body` (markdown) | `{ doc: AppDocument }` | — |
| `DataQualityChip` | Flag count + popover detail | `{ flags: DataQualityFlag[] }` | — |

`DocumentViewer` may use a tiny markdown renderer; a minimal headings/list/para
renderer is sufficient (no new heavy dependency required).

---

## 6. Module specs

### Module 1 — Portfolio Health · route `/portfolio` · `app/portfolio/page.tsx`

- **Data**: `getPortfolio()`. Run `normalizePortfolio(data.projects)` to get clean
  `Project[]` + `summary`. Use `data.aiBriefing` for the AI artifact.
- **Components**: `AICallout`, `StatCard`, `FilterBar`, `DataTable`, `StatusBadge`,
  `CategoryBarChart`, `DataQualityChip`, `Card`.
- **Layout** (top → bottom):
  1. `AICallout` with `aiBriefing` (Portfolio Health Briefing).
  2. Roll-up `StatCard` row: project count, total BAC (`Σ project.evm.bac`),
     # Off Track, portfolio CPI/SPI (from `getEvm().portfolio.metrics`).
  3. `FilterBar`: division (`meta.divisions`), status, phase.
  4. Charts: status distribution + budget-by-division (`CategoryBarChart`).
  5. `DataTable` of projects — columns: name, division (`divisionName`), owner
     (null-safe), phase, status (`StatusBadge`), % complete (`formatPercent`),
     BAC (`formatCurrency`), data quality (`DataQualityChip` from `project.flags`).
- **AI artifact surfaced**: `aiBriefing`.

### Module 2 — EVM & Variance · route `/evm` · `app/evm/page.tsx`

- **Data**: `getEvm()`.
- **Components**: `StatCard`, `EvmLineChart`, `IndexBullet`, `DataTable`,
  `AICallout`, `SeverityChip`, `Card`.
- **Layout**:
  1. Portfolio `StatCard` row: CPI, SPI (`formatRatio`), CV, VAC (`formatCurrency`)
     from `portfolio.metrics`.
  2. `EvmLineChart` of `portfolio.series` (PV/EV/AC, trailing 12 months).
  3. `AICallout` with `aiNarrative` + a **Recommended Actions** list rendering
     `recommendedActions[]` (each: `SeverityChip`, action, rationale; link
     `projectId` to its row).
  4. Per-project `DataTable`: name, CPI, SPI, CV, VAC, EAC. Selecting a row reveals
     that project's `EvmLineChart` (from `projects[].series`) and `IndexBullet`s.
- **AI artifact surfaced**: `aiNarrative` + `recommendedActions`.

### Module 3 — Cross-System Reconciliation · route `/reconciliation` · `app/reconciliation/page.tsx`

- **Data**: `getReconciliation()`.
- **Components**: `AICallout`, `StatCard`, `DataTable`, `SeverityChip`, `Card`.
- **Layout**:
  1. `AICallout` with `aiSummary`.
  2. `StatCard` row: total discrepancies (`discrepancies.length`), # high severity,
     # missing records (`type` ∈ {`missing_in_finance`,`missing_in_pmo`}),
     # duplicates.
  3. Discrepancy `DataTable`: project name, field, type, finance value, PMO value,
     severity (`SeverityChip`). Render `null` values as `"—"`.
  4. Optional side-by-side `DataTable`s of `financeExport.records` vs
     `pmoExport.records`, highlighting mismatched cells.
- **AI artifact surfaced**: `aiSummary`.

### Module 4 — Status & SOP Library · route `/documents` · `app/documents/page.tsx`

- **Data**: `getDocuments()`.
- **Components**: `Card`, `DocumentViewer`, `AIBadge`, `FilterBar` (by type), tag chips.
- **Layout**:
  1. Two groups: **Status Reports** (`statusReports`) and **SOPs** (`sops`).
  2. List each as a `Card` (title, summary, tags, `AIBadge`). Selecting opens
     `DocumentViewer` rendering `doc.body` (markdown) with `doc.meta`.
- **AI artifact surfaced**: the documents themselves (every doc is `aiGenerated`).

---

## 7. Build discipline

Build **one module at a time**, running `npm run build` after the shared
components and after each module, fixing every type/lint/build error before
moving on. Every rendered value goes through `lib/format.*`; every AI artifact is
labeled with `AIBadge`/`AICallout`. End state: `npm run build` green with a
working static `out/`. Full procedure in `EXECUTION_PROMPT.md`.
