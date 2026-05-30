'use client';

import type { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

/** Responsive Recharts wrapper. Gives the chart a fixed-height, full-width box
 *  (ResponsiveContainer needs a sized parent) plus an optional title. */
export function ChartContainer({
  title,
  height = 280,
  children,
}: {
  title?: string;
  height?: number;
  children: ReactElement;
}) {
  return (
    <div>
      {title ? (
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
          {title}
        </p>
      ) : null}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
