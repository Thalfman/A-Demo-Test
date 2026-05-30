'use client';

import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

import { useTheme } from '@/components/theme/ThemeProvider';
import { useMountOnlyAnimation } from '@/hooks/useMountOnlyAnimation';
import { getChartColors } from '@/lib/tokens';
import type { EvmSeriesPoint } from '@/lib/types';

const SERIES: (keyof Omit<EvmSeriesPoint, 'period'>)[] = ['pv', 'ev', 'ac'];

/**
 * Compact PV / EV / AC portfolio sparkline for the landing hero — the focal
 * visual that sits the AI value on a real Portfolio rather than decorative
 * chrome (PRD #9 §3). A dedicated thin component rather than a "mini" mode on
 * EvmLineChart, to keep the full chart's prop surface clean. Reuses the EVM
 * series color tokens and the mount-only draw, so it animates once and recolors
 * silently on a theme flip.
 */
export function MiniEvmChart({
  data,
  height = 56,
}: {
  data: EvmSeriesPoint[];
  height?: number;
}) {
  const { theme } = useTheme();
  const c = useMemo(() => getChartColors(theme), [theme]);
  const animate = useMountOnlyAnimation();

  return (
    <div
      style={{ width: '100%', height }}
      role="img"
      aria-label="Portfolio earned-value curves — planned, earned, and actual cost over the trailing 12 months"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
          {SERIES.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={c.evmSeriesColors[key]}
              strokeWidth={key === 'ev' ? 2 : 1.25}
              strokeDasharray={key === 'ac' ? '4 3' : undefined}
              dot={false}
              isAnimationActive={animate}
              animationDuration={1000}
              animationBegin={i * 160}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
