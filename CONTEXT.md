# PM/Ops AI

A static, client-only proof of concept that demonstrates AI-generated value
across four project-management / operations workflows, driven by one coherent
synthetic portfolio. Every data point and AI output is precomputed and bundled.

## Language

**Project**:
The unit of work and the canonical join entity — one Project is referenced from
every module by its `projectId` (health, EVM, reconciliation, documents).
_Avoid_: initiative, effort, workstream.

**Portfolio**:
The full set of Projects viewed together.
_Avoid_: program.

**Program**:
A named grouping of Projects within a Division.
_Avoid_: portfolio.

**Division**:
The org unit that owns Projects (eng, infra, data, cx).
_Avoid_: department, team.

**Discrepancy**:
A single field-level disagreement between the Finance export and the PMO export
for a Project.
_Avoid_: mismatch (one discrepancy type), error.

**Recommended Action**:
An AI-proposed corrective step tied to a Project, or to the Portfolio when its
`projectId` is null.
_Avoid_: task, todo, recommendation.

**AI Artifact**:
A precomputed, clearly-labeled AI output — briefing, narrative, summary, or
document. Always rendered behind the blue analyst rail.
_Avoid_: insight, generated content.

**Data-Quality Flag**:
A record of one cleanup the normalizer applied to a raw Project field (missing,
coerced, date drift, spelling normalized, stale, rounded estimate).
_Avoid_: error, warning, issue.
