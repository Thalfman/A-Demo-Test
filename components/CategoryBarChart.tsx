'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts';

import { ChartLegend, type LegendSeries } from '@/components/ChartLegend';
import { ChartTooltip } from '@/components/ChartTooltip';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useMountOnlyAnimation } from '@/hooks/useMountOnlyAnimation';
import { useSeriesToggle } from '@/hooks/useSeriesToggle';
import { formatNumber } from '@/lib/format';
import { getChartColors } from '@/lib/tokens';
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
 *  per-cell coloring (e.g., status distribution) and custom axis/value
 *  formatters (e.g., currency). Shares the app's custom tooltip; a multi-series
 *  chart also gets a clickable legend to isolate a bar. Bars default to ink. */
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
  const c = useMemo(() => getChartColors(theme), [theme]);
  const animate = useMountOnlyAnimation();
  const { hidden, toggle } = useSeriesToggle();

  const colorFor = (bar: BarSpec, i: number) =>
    bar.color ?? c.chartPalette[i % c.chartPalette.length];

  const legend: LegendSeries[] = bars.map((bar, i) => ({
    key: bar.key,
    name: bar.name ?? bar.key,
    color: colorFor(bar, i),
  }));

  return (
    <div>
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
            content={
              <ChartTooltip
                colors={c}
                valueFormatter={valueFormatter ?? formatNumber}
                hiddenKeys={hidden}
              />
            }
          />
          {bars.map((bar, barIndex) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name ?? bar.key}
              hide={hidden.has(bar.key)}
              fill={colorFor(bar, barIndex)}
              stackId={stacked ? 'stack' : undefined}
              radius={stacked ? undefined : [4, 4, 0, 0]}
              isAnimationActive={animate}
              animationDuration={800}
              animationBegin={barIndex * 120}
              animationEasing="ease-out"
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
      {bars.length > 1 ? (
        <ChartLegend series={legend} hidden={hidden} onToggle={toggle} />
      ) : null}
    </div>
  );
}
