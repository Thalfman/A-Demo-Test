'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { chartPalette, colors } from '@/lib/tokens';
import { ChartContainer } from './ChartContainer';

export interface BarSpec {
  key: string;
  name?: string;
  color?: string;
  /** Per-category colors (indexed by data row) — overrides `color`. */
  cellColors?: string[];
}

type Row = Record<string, string | number>;

/** Categorical bar chart. One or more bar series keyed off `data` rows. Supports
 *  per-cell coloring (e.g., status distribution) and custom axis/tooltip
 *  formatters (e.g., currency). */
export function CategoryBarChart({
  data,
  xKey,
  bars,
  height,
  stacked = false,
  yTickFormatter,
  valueFormatter,
}: {
  data: Row[];
  xKey: string;
  bars: BarSpec[];
  height?: number;
  stacked?: boolean;
  yTickFormatter?: (v: number) => string;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <ChartContainer height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: colors.inkMuted }}
          stroke={colors.border}
        />
        <YAxis
          width={56}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: colors.inkMuted }}
          stroke={colors.border}
          tickFormatter={yTickFormatter}
        />
        <Tooltip
          cursor={{ fill: `${colors.brand}0d` }}
          formatter={
            valueFormatter
              ? (value: number, name) => [valueFormatter(value), name]
              : undefined
          }
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
          }}
        />
        {bars.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
        {bars.map((bar, barIndex) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.name ?? bar.key}
            fill={bar.color ?? chartPalette[barIndex % chartPalette.length]}
            stackId={stacked ? 'stack' : undefined}
            radius={stacked ? undefined : [4, 4, 0, 0]}
          >
            {bar.cellColors
              ? data.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      bar.cellColors![idx] ??
                      chartPalette[idx % chartPalette.length]
                    }
                  />
                ))
              : null}
          </Bar>
        ))}
      </BarChart>
    </ChartContainer>
  );
}
