'use client';

import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

import { ChartLegend, type LegendSeries } from '@/components/ChartLegend';
import { ChartTooltip } from '@/components/ChartTooltip';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useMountOnlyAnimation } from '@/hooks/useMountOnlyAnimation';
import { useSeriesToggle } from '@/hooks/useSeriesToggle';
import { formatCurrency } from '@/lib/format';
import { getChartColors } from '@/lib/tokens';
import type { EvmSeriesPoint } from '@/lib/types';
import { ChartContainer } from './ChartContainer';

const SERIES: { key: keyof Omit<EvmSeriesPoint, 'period'>; name: string }[] = [
  { key: 'pv', name: 'Planned (PV)' },
  { key: 'ev', name: 'Earned (EV)' },
  { key: 'ac', name: 'Actual (AC)' },
];

const MONO = 'var(--font-mono)';

/** PV / EV / AC cumulative curves over time. PV reads as a muted baseline, EV as
 *  full ink, AC as dashed status-red, so over/underrun is legible at a glance.
 *  A clickable legend toggles individual curves; the tooltip shares the app's
 *  custom card and surfaces the earned-vs-planned delta. Tolerates sparse series
 *  (some projects carry as few as two points). */
export function EvmLineChart({
  data,
  title,
  height,
}: {
  data: EvmSeriesPoint[];
  title?: string;
  height?: number;
}) {
  const { theme } = useTheme();
  const c = useMemo(() => getChartColors(theme), [theme]);
  const animate = useMountOnlyAnimation();
  const { hidden, toggle } = useSeriesToggle();

  const legend: LegendSeries[] = SERIES.map((s) => ({
    key: s.key,
    name: s.name,
    color: c.evmSeriesColors[s.key],
    dashed: s.key === 'ac',
  }));

  return (
    <div>
      <ChartContainer title={title} height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 11, fill: c.tick, fontFamily: MONO }}
            stroke={c.axis}
          />
          <YAxis
            width={56}
            tick={{ fontSize: 11, fill: c.tick, fontFamily: MONO }}
            stroke={c.axis}
            tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
          />
          <Tooltip
            content={
              <ChartTooltip
                colors={c}
                valueFormatter={(v) => formatCurrency(v)}
                showEvmDelta
                hiddenKeys={hidden}
              />
            }
          />
          {SERIES.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              hide={hidden.has(s.key)}
              stroke={c.evmSeriesColors[s.key]}
              strokeWidth={2}
              strokeDasharray={s.key === 'ac' ? '5 3' : undefined}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              isAnimationActive={animate}
              animationDuration={900}
              animationBegin={i * 140}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ChartContainer>
      <ChartLegend series={legend} hidden={hidden} onToggle={toggle} />
    </div>
  );
}
