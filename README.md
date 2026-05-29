# PM/Ops AI — Proof of Concept

A static, client-only web app that demonstrates AI-generated value across core
project-management and operations workflows, using one coherent synthetic
portfolio. No backend, no live model calls, no secrets — every data point and
every AI output is precomputed and bundled.

> **Status: scaffold + specs.** This repo currently contains the build-clean
> shell, the full data layer, the committed synthetic dataset, and the plans. The
> four module UIs are specified in [`PLAN.md`](./PLAN.md) and built by
> [`EXECUTION_PROMPT.md`](./EXECUTION_PROMPT.md).

## Modules (specced; UI built by the execution run)

1. **Portfolio Health** — status, budget, and schedule across the portfolio.
2. **EVM & Variance** — CPI/SPI/variance with an AI status narrative + actions.
3. **Cross-System Reconciliation** — discrepancies between two divergent exports.
4. **Status & SOP Library** — finished executive status reports and SOPs.

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind v3 · Recharts.
Static export (`output: 'export'`), deployable to Vercel as a static site.

## Getting started

```bash
npm install
npm run dev           # http://localhost:3000
npm run build         # static export to ./out
npm run generate:data # regenerate /data deterministically (seed 1337)
```

## Project structure

```
app/                 App Router shell + placeholder routes
components/          App-shell nav + placeholder (module UI added later)
lib/                 Data layer — single source of truth
  types.ts           Shared data model (SSOT)
  loaders.ts         Typed JSON loaders
  normalize.ts       Cleanup + data-quality flagging
  format.ts          Null-safe display formatters
  tokens.ts          Design tokens mirrored for charts
data/                Committed synthetic JSON (one file per module + meta)
scripts/             Deterministic seeded data generator
PLAN.md              Build-ready specs for all four modules
EXECUTION_PROMPT.md  Self-contained prompt that builds the app
```

## Synthetic data

`scripts/generate-data.ts` is deterministic: a seeded PRNG (mulberry32, seed
1337) and a fixed "as of" date, so `npm run generate:data` reproduces the
committed `/data` byte-for-byte. It generates realistic ground truth (log-normal
costs/durations, correlated cost/schedule health, one troubled project, outliers)
and a messy real-world copy (nulls, inconsistent spellings, date-format drift,
stale records, round estimates, and two diverging system exports for
reconciliation).
