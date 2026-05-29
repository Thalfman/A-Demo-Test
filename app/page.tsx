import Link from 'next/link';

import { getMeta } from '@/lib/loaders';

export default function HomePage() {
  const meta = getMeta();
  return (
    <div className="space-y-6">
      <section className="rounded-token border border-border bg-surface-raised p-6">
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="mt-1 max-w-prose text-ink-muted">
          A static proof of concept demonstrating AI-generated value across four
          PM/Ops workflows, driven by one synthetic portfolio of{' '}
          {meta.counts.projects} projects. All AI outputs are precomputed and
          clearly labeled.
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          Dataset seed {meta.seed} · as of {meta.generatedAt} ·{' '}
          {meta.dataQuality.flaggedFields} data-quality flags across{' '}
          {meta.counts.projects} projects.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {meta.modules.map((module) => (
          <Link
            key={module.id}
            href={module.route}
            className="rounded-token border border-border bg-surface-raised p-5 transition-colors hover:border-brand"
          >
            <h3 className="font-medium">{module.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{module.summary}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-brand">
              Specced — see PLAN.md
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
