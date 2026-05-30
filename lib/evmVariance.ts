import type { EvmSeriesPoint } from './types';

export interface EvmPointVariance {
  costVariance: number;
  scheduleVariance: number;
  earnedVsPlannedDelta: number;
}

export function evmVariance(point: EvmSeriesPoint): EvmPointVariance {
  return {
    costVariance: point.ev - point.ac,
    scheduleVariance: point.ev - point.pv,
    earnedVsPlannedDelta:
      point.pv === 0 ? 0 : (point.ev - point.pv) / point.pv,
  };
}
