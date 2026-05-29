import type { ReactNode } from 'react';

export type StatTone = 'positive' | 'negative' | 'neutral';

const toneClass: Record<StatTone, string> = {
  positive: 'text-status-ontrack',
  negative: 'text-status-offtrack',
  neutral: 'text-ink',
};

/** KPI tile. `value` is rendered as-is — callers pass a pre-formatted string
 *  (via lib/format) or a node. */
export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: StatTone;
}) {
  return (
    <div className="rounded-token border border-border bg-surface-raised p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass[tone]}`}>
        {value}
      </p>
      {hint != null ? (
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
