'use client';

import { useCountUp } from '@/hooks/useCountUp';

export type HeroKpiTone = 'positive' | 'negative' | 'neutral';

export interface HeroKpiItem {
  label: string;
  /** Animate from 0 to this on first paint; resolves instantly on opt-out. */
  value: number;
  /** Render the counted value (defaults to a rounded integer). */
  format?: (n: number) => string;
  hint?: string;
  tone?: HeroKpiTone;
}

const toneClass: Record<HeroKpiTone, string> = {
  positive: 'text-status-ontrack',
  negative: 'text-status-offtrack',
  neutral: 'text-ink',
};

/**
 * Four-up showcase KPI band for the landing hero. Bigger and more declarative
 * than the in-module `KpiStrip` — the landing is treated as a showcase cover, so
 * the numbers count up on mount (PRD #9 §2, via the shared `useCountUp` hook,
 * which resolves instantly under reduced motion). Values are computed upstream
 * and passed in; this only animates and formats. Numbers take ink/status tones —
 * never the reserved AI accent. Reflows to a 2×2 grid on narrow viewports (§15).
 */
export function HeroKpiBand({ items }: { items: HeroKpiItem[] }) {
  return (
    <dl className="grid grid-cols-2 divide-hairline rounded-md border border-hairline border-b-2 border-b-hairline-strong bg-panel shadow-elev sm:grid-cols-4 sm:divide-x">
      {items.map((item, i) => (
        <HeroKpiCell key={i} item={item} />
      ))}
    </dl>
  );
}

function HeroKpiCell({ item }: { item: HeroKpiItem }) {
  const value = useCountUp(item.value);
  const text = item.format ? item.format(value) : String(Math.round(value));
  return (
    <div className="px-4 py-3.5 sm:px-5">
      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-muted">
        {item.label}
      </dt>
      <dd
        className={`mt-1.5 font-mono text-[28px] font-semibold leading-none tabular-nums sm:text-[34px] ${
          toneClass[item.tone ?? 'neutral']
        }`}
      >
        {text}
      </dd>
      {item.hint ? (
        <p className="mt-1.5 text-[11px] text-ink-muted">{item.hint}</p>
      ) : null}
    </div>
  );
}
