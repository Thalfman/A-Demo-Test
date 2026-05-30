import type { ReactNode } from 'react';

export type StatTone = 'positive' | 'negative' | 'neutral';

const toneClass: Record<StatTone, string> = {
  positive: 'text-status-ontrack',
  negative: 'text-status-offtrack',
  neutral: 'text-ink',
};

/** Compact KPI cell (used in the EVM drill-down 2×2 grid). `value` is rendered
 *  as-is — callers pass a pre-formatted string (via lib/format) or a node. */
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
    <div className="rounded-sm border border-hairline bg-panel-2 p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
        {label}
      </p>
      <p className={`mt-1 font-mono text-lg font-medium tabular-nums ${toneClass[tone]}`}>
        {value}
      </p>
      {hint != null ? (
        <p className="mt-1 text-[11px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
