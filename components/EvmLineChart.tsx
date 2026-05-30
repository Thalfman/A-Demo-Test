'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useTheme } from '@/components/theme/ThemeProvider';
import { useMountOnlyAnimation } from '@/hooks/useMountOnlyAnimation';
import { formatCurrency } from '@/lib/format';
import { getChartColors, radiusPx } from '@/lib/tokens';
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
 *  Tolerates sparse series (some projects carry as few as two points). */
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
  const c = getChartColors(theme);
  const animate = useMountOnlyAnimation();

  return (
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
          formatter={(value: number, name) => [formatCurrency(value), name]}
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
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {SERIES.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={c.evmSeriesColors[s.key]}
            strokeWidth={2}
            strokeDasharray={s.key === 'ac' ? '5 3' : undefined}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
            isAnimationActive={animate}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
