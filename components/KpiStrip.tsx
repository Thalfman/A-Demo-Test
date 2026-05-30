'use client';

import type { ReactNode } from 'react';

import { useCountUp } from '@/hooks/useCountUp';

export type KpiTone = 'positive' | 'negative' | 'neutral';

export interface KpiItem {
  label: ReactNode;
  /** Pre-formatted static value (string/node). Ignored when `countTo` is set. */
  value?: ReactNode;
  /** Animate from 0 to this number on first paint. */
  countTo?: number;
  /** Formatter for `countTo` (defaults to a rounded integer). */
  format?: (n: number) => string;
  hint?: ReactNode;
  tone?: KpiTone;
}

const toneClass: Record<KpiTone, string> = {
  positive: 'text-status-ontrack',
  negative: 'text-status-offtrack',
  neutral: 'text-ink',
};

/** Hairline-divided instrument strip of KPIs — one cluster, dividers not gaps,
 *  anchored by a stronger bottom rule. Replaces rows of floating stat cards. */
export function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="flex divide-x divide-hairline overflow-x-auto rounded-md border border-hairline border-b-2 border-b-hairline-strong bg-panel shadow-elev [&>*]:min-w-[7.5rem] [&>*]:flex-1">
      {items.map((item, i) => (
        <KpiCell key={i} item={item} />
      ))}
    </div>
  );
}

function KpiCell({ item }: { item: KpiItem }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
        {item.label}
      </p>
      <p
        className={`mt-1.5 font-mono text-[22px] font-medium leading-none ${
          toneClass[item.tone ?? 'neutral']
        }`}
      >
        {item.countTo != null ? (
          <CountValue value={item.countTo} format={item.format} />
        ) : (
          item.value
        )}
      </p>
      {item.hint != null ? (
        <p className="mt-1.5 text-[11px] text-ink-muted">{item.hint}</p>
      ) : null}
    </div>
  );
}

function CountValue({
  value,
  format,
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const v = useCountUp(value);
  return <>{format ? format(v) : String(Math.round(v))}</>;
}
