'use client';

import { SeriesSwatch } from '@/components/SeriesSwatch';
import { evmVariance } from '@/lib/evmVariance';
import { formatPercent } from '@/lib/format';
import { radiusPx, type ChartColors } from '@/lib/tokens';
import type { EvmSeriesPoint } from '@/lib/types';

/** One row Recharts hands us per series at the hovered point. Typed loosely
 *  because Recharts clones this component in, injecting these at render. */
interface TooltipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
}

const asNumber = (v: TooltipEntry['value']): number | null => {
  const n = Array.isArray(v) ? v[v.length - 1] : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

const hasEvmShape = (p: unknown): p is EvmSeriesPoint => {
  if (!p || typeof p !== 'object') return false;
  const r = p as Record<string, unknown>;
  return (
    typeof r.pv === 'number' &&
    typeof r.ev === 'number' &&
    typeof r.ac === 'number'
  );
};

/**
 * Shared custom Recharts tooltip card. Renders the hovered label, then each
 * series as a color swatch + name + formatted value, so the EVM line chart and
 * the categorical bar charts read as one coherent toolset (PRD #9 §9). When
 * `showEvmDelta` is set and the hovered row is an EVM point, it appends the
 * earned-vs-planned schedule delta from the pure `evmVariance` helper (§7, §13),
 * keeping this a thin presentational layer over that math. `hiddenKeys` (the
 * legend's toggled-off series) are dropped so the card never names a curve the
 * viewer just hid — and the delta is suppressed when PV or EV is hidden.
 */
export function ChartTooltip({
  active,
  label,
  payload = [],
  colors,
  valueFormatter,
  showEvmDelta = false,
  hiddenKeys,
}: {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  colors: ChartColors;
  valueFormatter: (v: number) => string;
  showEvmDelta?: boolean;
  hiddenKeys?: ReadonlySet<string>;
}) {
  const visible = hiddenKeys
    ? payload.filter((e) => !hiddenKeys.has(String(e.dataKey)))
    : payload;

  if (!active || visible.length === 0) return null;

  const point = (visible[0] as { payload?: Record<string, unknown> }).payload;
  const evmHidden = !!hiddenKeys && (hiddenKeys.has('pv') || hiddenKeys.has('ev'));
  const variance =
    showEvmDelta && !evmHidden && hasEvmShape(point) ? evmVariance(point) : null;

  const deltaTone =
    variance == null || variance.scheduleVariance === 0
      ? colors.tick
      : variance.scheduleVariance < 0
        ? colors.statusColors['Off Track']
        : colors.statusColors['On Track'];
  const sign = variance && variance.scheduleVariance > 0 ? '+' : '';

  return (
    <div
      className="min-w-[10rem] font-mono text-[12px] shadow-pop"
      style={{
        borderRadius: radiusPx,
        backgroundColor: colors.tooltipBg,
        border: `1px solid ${colors.tooltipBorder}`,
        color: colors.tooltipText,
      }}
    >
      {label != null ? (
        <p
          className="border-b px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em]"
          style={{ borderColor: colors.tooltipBorder, color: colors.tick }}
        >
          {label}
        </p>
      ) : null}
      <ul className="space-y-1 px-3 py-2">
        {visible.map((entry, i) => {
          const value = asNumber(entry.value);
          return (
            <li
              key={entry.dataKey ?? i}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-2">
                <SeriesSwatch color={entry.color ?? colors.tick} />
                <span style={{ color: colors.tick }}>{entry.name}</span>
              </span>
              <span className="tabular-nums">
                {value == null ? '—' : valueFormatter(value)}
              </span>
            </li>
          );
        })}
      </ul>
      {variance ? (
        <p
          className="border-t px-3 py-1.5 text-[11px]"
          style={{ borderColor: colors.tooltipBorder, color: colors.tick }}
        >
          EV vs PV{' '}
          <span className="tabular-nums" style={{ color: deltaTone }}>
            {sign}
            {valueFormatter(variance.scheduleVariance)} ({sign}
            {formatPercent(variance.earnedVsPlannedDelta, 1)})
          </span>
        </p>
      ) : null}
    </div>
  );
}
