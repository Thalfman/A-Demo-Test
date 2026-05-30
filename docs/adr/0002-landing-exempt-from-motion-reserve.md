# The landing page is exempt from the "motion = AI tell" rule

The design system reserves motion as a semantic signal for the AI layer — "the
single AI tell" is the analyst rail drawing itself in on mount (see
`app/globals.css`). The landing page deliberately breaks this rule: it animates
count-up KPIs, a staggered reveal of the module cards, and a portfolio EVM
sparkline draw — none of which are AI artifacts.

We treat the landing as a **showcase cover, not a data workspace**. The rule
exists so that inside the modules a viewer learns "motion here means a machine
produced this"; on the cover there is no data to misread, so decorative motion
buys first-impression polish without diluting the signal where it carries
meaning. We considered relaxing the rule globally (rejected — it weakens the
identity that makes the AI layer feel distinct) and keeping the landing strict
(rejected — too little visual lift for an employer-facing demo).

Consequence: motion inside `/portfolio`, `/evm`, `/reconciliation`, and
`/documents` stays AI-reserved. Decorative motion is allowed **only** on the
landing route. If that distinction blurs, the AI tell loses its meaning.
