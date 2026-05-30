import { describe, expect, it } from 'vitest';
import { evmVariance } from './evmVariance';
import type { EvmSeriesPoint } from './types';

const point = (over: Partial<EvmSeriesPoint> = {}): EvmSeriesPoint => ({
  period: '2025-01',
  pv: 100,
  ev: 90,
  ac: 110,
  ...over,
});

describe('evmVariance', () => {
  it('reports cost variance as earned minus actual cost', () => {
    expect(evmVariance(point({ ev: 90, ac: 110 })).costVariance).toBe(-20);
  });

  it('reports schedule variance as earned minus planned value', () => {
    expect(evmVariance(point({ ev: 90, pv: 100 })).scheduleVariance).toBe(-10);
  });

  it('reports earned-vs-planned delta as a ratio of planned value', () => {
    expect(evmVariance(point({ ev: 90, pv: 100 })).earnedVsPlannedDelta).toBe(
      -0.1,
    );
  });

  it('returns a zero delta when planned value is zero', () => {
    expect(evmVariance(point({ ev: 50, pv: 0 })).earnedVsPlannedDelta).toBe(0);
  });
});
