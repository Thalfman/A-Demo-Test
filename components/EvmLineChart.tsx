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

import { formatCurrency } from '@/lib/format';
import { colors, evmSeriesColors } from '@/lib/tokens';
import type { EvmSeriesPoint } from '@/lib/types';
import { ChartContainer } from './ChartContainer';

const SERIES: { key: keyof Omit<EvmSeriesPoint, 'period'>; name: string }[] = [
  { key: 'pv', name: 'Planned (PV)' },
  { key: 'ev', name: 'Earned (EV)' },
  { key: 'ac', name: 'Actual (AC)' },
];

/** PV / EV / AC cumulative curves over time. Tolerates sparse series (some
 *  projects carry as few as two points). */
export function EvmLineChart({
  data,
  title,
  height,
}: {
  data: EvmSeriesPoint[];
  title?: string;
  height?: number;
}) {
  return (
    <ChartContainer title={title} height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 11, fill: colors.inkMuted }}
          stroke={colors.border}
        />
        <YAxis
          width={56}
          tick={{ fontSize: 11, fill: colors.inkMuted }}
          stroke={colors.border}
          tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
        />
        <Tooltip
          formatter={(value: number, name) => [formatCurrency(value), name]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {SERIES.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={evmSeriesColors[s.key]}
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
