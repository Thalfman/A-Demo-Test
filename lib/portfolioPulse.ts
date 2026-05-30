/**
 * The single portfolio "pulse" — project count, off-track count, and portfolio
 * CPI/SPI — computed once from the committed data so every surface that shows
 * these headline numbers (header PulseStrip, landing hero) tells one consistent
 * story (PRD #9 §16). Pure read-model over the frozen data (ADR-0001): it reads
 * existing values only and never enriches or mutates them.
 */

import { getEvm, getMeta, getPortfolio } from './loaders';
import { normalizePortfolio } from './normalize';

export interface PortfolioPulse {
  projects: number;
  offTrack: number;
  cpi: number;
  spi: number;
}

export function getPortfolioPulse(): PortfolioPulse {
  const meta = getMeta();
  const { metrics } = getEvm().portfolio;
  const { projects } = normalizePortfolio(getPortfolio().projects);
  return {
    projects: meta.counts.projects,
    offTrack: projects.filter((p) => p.status === 'Off Track').length,
    cpi: metrics.cpi,
    spi: metrics.spi,
  };
}
