// Shell placeholder for specced-but-unbuilt module routes. This is NOT a reusable
// presentational primitive — those (cards, tables, charts) belong to the
// execution run. It only renders the "Specced, see PLAN.md" state.
export function Placeholder({
  title,
  summary,
}: {
  title: string;
  summary?: string;
}) {
  return (
    <section className="rounded-token border border-border bg-surface-raised p-8">
      <p className="text-xs font-medium uppercase tracking-wide text-brand">
        Specced — see PLAN.md
      </p>
      <h2 className="mt-2 text-xl font-semibold">{title}</h2>
      {summary ? <p className="mt-1 text-ink-muted">{summary}</p> : null}
      <p className="mt-4 max-w-prose text-sm text-ink-muted">
        This module is fully specified in <code>PLAN.md</code> and will be built
        by the execution run (<code>EXECUTION_PROMPT.md</code>). The shared data
        layer in <code>/lib</code> and the synthetic dataset in <code>/data</code>{' '}
        it depends on already exist.
      </p>
    </section>
  );
}
