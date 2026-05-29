/**
 * TypeScript mirror of the design tokens in app/globals.css.
 *
 * Recharts and other JS-driven visuals need literal color values (they can't
 * resolve CSS variables reliably), so the hex values live here too. When you
 * change a token in globals.css, change it here as well.
 */

import type { ProjectStatus } from './types';

export const colors = {
  brand: '#2563eb',
  brandMuted: '#93c5fd',
  surface: '#f8fafc',
  surfaceRaised: '#ffffff',
  border: '#e2e8f0',
  ink: '#0f172a',
  inkMuted: '#64748b',
} as const;

export const statusColors: Record<ProjectStatus, string> = {
  'On Track': '#16a34a',
  'At Risk': '#d97706',
  'Off Track': '#dc2626',
};

/** General categorical palette for charts (divisions, series, etc.). */
export const chartPalette = [
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
] as const;

/** Conventional EVM curve colors: planned / earned / actual. */
export const evmSeriesColors = {
  pv: '#2563eb',
  ev: '#16a34a',
  ac: '#dc2626',
} as const;

export const radiusPx = 8;
