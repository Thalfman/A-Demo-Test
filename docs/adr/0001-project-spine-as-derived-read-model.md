# Cross-module project view is a derived read-model; data stays frozen

The Project Spine (a slide-over drawer showing one Project across all four
modules) joins the five data sources at render time through a read-only selector
(`lib/projectGraph.ts`), keyed on `projectId`. We deliberately did **not** enrich
the data: `lib/types.ts`, the generator, and `/data` remain frozen, per the
boundary in `PLAN.md` §2 ("consume them as-is").

We considered adding a structured evidence layer to the AI artifacts (claim →
projectId/field/value) to power richer provenance, and rejected it: it would
breach the frozen-data boundary and risk dressing up the intentional mess. The
spine is built only on links that already exist in the committed data
(`Discrepancy.projectId`, `RecommendedAction.projectId`,
`DocumentMeta.relatedProjectId`, `EvmProjectEntry.projectId`, `Project.id`), so
every cross-module connection it shows is real, not invented.

Consequence: if a future Project reference is needed that the data doesn't
already carry, the answer is to surface the gap — not to mutate the generator to
fit the UI.
