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

import { useTheme } from '@/components/theme/ThemeProvider';
import { useMountOnlyAnimation } from '@/hooks/useMountOnlyAnimation';
import { getChartColors, radiusPx } from '@/lib/tokens';
import { ChartContainer } from './ChartContainer';

export interface BarSpec {
  key: string;
  name?: string;
  color?: string;
  /** Per-category colors (indexed by data row) — overrides `color`. */
  cellColors?: string[];
}

type Row = Record<string, string | number>;

const MONO = 'var(--font-mono)';

/** Categorical bar chart. One or more bar series keyed off `data` rows. Supports
 *  per-cell coloring (e.g., status distribution) and custom axis/tooltip
 *  formatters (e.g., currency). Bars default to ink; status charts pass cells. */
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
  const { theme } = useTheme();
  const c = getChartColors(theme);
  const animate = useMountOnlyAnimation();

  return (
    <ChartContainer height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: c.tick, fontFamily: MONO }}
          stroke={c.axis}
        />
        <YAxis
          width={56}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: c.tick, fontFamily: MONO }}
          stroke={c.axis}
          tickFormatter={yTickFormatter}
        />
        <Tooltip
          cursor={{ fill: c.grid, fillOpacity: 0.5 }}
          formatter={
            valueFormatter
              ? (value: number, name) => [valueFormatter(value), name]
              : undefined
          }
          contentStyle={{
            fontSize: 12,
            fontFamily: MONO,
            borderRadius: radiusPx,
            backgroundColor: c.tooltipBg,
            border: `1px solid ${c.tooltipBorder}`,
            color: c.tooltipText,
          }}
          labelStyle={{ color: c.tooltipText }}
          itemStyle={{ color: c.tooltipText }}
        />
        {bars.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
        {bars.map((bar, barIndex) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.name ?? bar.key}
            fill={bar.color ?? c.chartPalette[barIndex % c.chartPalette.length]}
            stackId={stacked ? 'stack' : undefined}
            radius={stacked ? undefined : [4, 4, 0, 0]}
            isAnimationActive={animate}
          >
            {bar.cellColors
              ? data.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      bar.cellColors![idx] ??
                      c.chartPalette[idx % c.chartPalette.length]
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
