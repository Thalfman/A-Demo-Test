/**
 * TypeScript mirror of the design tokens in app/globals.css.
 *
 * Recharts and other JS-driven visuals need literal color values (they can't
 * resolve CSS variables reliably), so the hex values live here too — keyed by
 * theme (Dim / Dark / Light). globals.css is the source of truth; when you
 * change a token there, change the matching set here as well.
 */

import type { ProjectStatus } from './types';

export type Theme = 'light' | 'dark' | 'dim';

interface TokenSet {
  bg: string;
  panel: string;
  panel2: string;
  hairline: string;
  hairlineStrong: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  ai: string;
  ontrack: string;
  atrisk: string;
  offtrack: string;
  chart1: string;
  chart2: string;
  chartGrid: string;
}

const DIM: TokenSet = {
  bg: '#1c1e23',
  panel: '#24262c',
  panel2: '#2c2f36',
  hairline: '#383b43',
  hairlineStrong: '#494d57',
  ink: '#eaecef',
  inkMuted: '#9da4b0',
  inkFaint: '#6e7682',
  ai: '#5c92fa',
  ontrack: '#46c265',
  atrisk: '#d6a035',
  offtrack: '#f0566b',
  chart1: '#eaecef',
  chart2: '#7e879a',
  chartGrid: '#2f333c',
};

const DARK: TokenSet = {
  bg: '#0b0e14',
  panel: '#11151f',
  panel2: '#161b27',
  hairline: '#222a3a',
  hairlineStrong: '#313b52',
  ink: '#e7ebf3',
  inkMuted: '#8b94a7',
  inkFaint: '#566073',
  ai: '#5c92fa',
  ontrack: '#3fb950',
  atrisk: '#d6a035',
  offtrack: '#f0566b',
  chart1: '#e7ebf3',
  chart2: '#6f7a91',
  chartGrid: '#1e2533',
};

const LIGHT: TokenSet = {
  bg: '#f4f6fa',
  panel: '#ffffff',
  panel2: '#f5f7fb',
  hairline: '#e2e6ee',
  hairlineStrong: '#cbd2df',
  ink: '#0e1320',
  inkMuted: '#5a6473',
  inkFaint: '#8a93a2',
  ai: '#005fbe',
  ontrack: '#1f9d57',
  atrisk: '#a86c12',
  offtrack: '#c4374c',
  chart1: '#0e1320',
  chart2: '#7a8398',
  chartGrid: '#e2e6ee',
};

const SETS: Record<Theme, TokenSet> = { dim: DIM, dark: DARK, light: LIGHT };

export interface ChartColors {
  grid: string;
  axis: string;
  tick: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  ai: string;
  statusColors: Record<ProjectStatus, string>;
  /** Conventional EVM curve colors: planned / earned / actual. */
  evmSeriesColors: { pv: string; ev: string; ac: string };
  /** General categorical palette (monochrome-first: ink, neutral, accent, status). */
  chartPalette: string[];
}

/** Resolve the literal-hex color set Recharts needs for the active theme. */
export function getChartColors(theme: Theme): ChartColors {
  const t = SETS[theme];
  return {
    grid: t.chartGrid,
    axis: t.hairline,
    tick: t.inkMuted,
    tooltipBg: t.panel,
    tooltipBorder: t.hairline,
    tooltipText: t.ink,
    ai: t.ai,
    statusColors: {
      'On Track': t.ontrack,
      'At Risk': t.atrisk,
      'Off Track': t.offtrack,
    },
    evmSeriesColors: { pv: t.chart2, ev: t.chart1, ac: t.offtrack },
    chartPalette: [t.chart1, t.chart2, t.ai, t.atrisk, t.ontrack, t.offtrack],
  };
}

/* -------------------------------------------------------------------------- */
/* Legacy named exports (DIM set, the default theme) — retained so any         */
/* lingering imports keep compiling.                                           */
/* -------------------------------------------------------------------------- */

export const colors = {
  brand: DIM.ai,
  brandMuted: DIM.inkFaint,
  surface: DIM.bg,
  surfaceRaised: DIM.panel,
  border: DIM.hairline,
  ink: DIM.ink,
  inkMuted: DIM.inkMuted,
} as const;

export const statusColors: Record<ProjectStatus, string> = {
  'On Track': DIM.ontrack,
  'At Risk': DIM.atrisk,
  'Off Track': DIM.offtrack,
};

export const chartPalette = [
  DIM.chart1,
  DIM.chart2,
  DIM.ai,
  DIM.atrisk,
  DIM.ontrack,
  DIM.offtrack,
] as const;

export const evmSeriesColors = {
  pv: DIM.chart2,
  ev: DIM.chart1,
  ac: DIM.offtrack,
} as const;

export const radiusPx = 6;
