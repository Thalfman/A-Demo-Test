'use client';

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
 * keeping this a thin presentational layer over that math.
 */
export function ChartTooltip({
  active,
  label,
  payload = [],
  colors,
  valueFormatter,
  showEvmDelta = false,
}: {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
  colors: ChartColors;
  valueFormatter: (v: number) => string;
  showEvmDelta?: boolean;
}) {
  if (!active || payload.length === 0) return null;

  const point = (payload[0] as { payload?: Record<string, unknown> }).payload;
  const variance =
    showEvmDelta && hasEvmShape(point) ? evmVariance(point) : null;

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
        {payload.map((entry, i) => {
          const value = asNumber(entry.value);
          return (
            <li
              key={entry.dataKey ?? i}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-[2px]"
                  style={{ backgroundColor: entry.color }}
                />
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
          <span
            className="tabular-nums"
            style={{
              color:
                variance.scheduleVariance < 0
                  ? colors.statusColors['Off Track']
                  : colors.statusColors['On Track'],
            }}
          >
            {variance.scheduleVariance >= 0 ? '+' : ''}
            {valueFormatter(variance.scheduleVariance)} (
            {variance.earnedVsPlannedDelta >= 0 ? '+' : ''}
            {formatPercent(variance.earnedVsPlannedDelta, 1)})
          </span>
        </p>
      ) : null}
    </div>
  );
}
