/**
 * Null-safe display formatters. Every formatter returns an em dash ("—") for
 * missing/blank/NaN input so module UIs never render "null" or "NaN". Date
 * parsing reuses `parseLooseDate` from normalize so drifting formats display
 * consistently.
 */

import { parseLooseDate } from './normalize';
import type { ProjectStatus } from './types';

export const DASH = '—';

const isMissing = (v: number | null | undefined): v is null | undefined =>
  v == null || Number.isNaN(v);

export function formatCurrency(
  value: number | null | undefined,
  opts: { compact?: boolean } = {},
): string {
  if (isMissing(value)) return DASH;
  if (opts.compact) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  }
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

/** Format a 0..1 ratio as a percentage. */
export function formatPercent(
  ratio: number | null | undefined,
  digits = 0,
): string {
  if (isMissing(ratio)) return DASH;
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (isMissing(value)) return DASH;
  return value.toLocaleString('en-US');
}

/** Format an index/ratio like CPI or SPI (e.g., 0.87). */
export function formatRatio(
  value: number | null | undefined,
  digits = 2,
): string {
  if (isMissing(value)) return DASH;
  return value.toFixed(digits);
}

/** Format any supported date string (ISO, US slashes, long form) for display. */
export function formatDate(
  input: string | null | undefined,
  opts: { style?: 'short' | 'iso' } = {},
): string {
  const { iso } = parseLooseDate(input ?? null);
  if (!iso) return DASH;
  if (opts.style === 'iso') return iso;
  const [y, m, d] = iso.split('-').map(Number);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

/** CSS variable reference for a status color (pairs with globals.css/tailwind). */
export function statusToColorToken(status: ProjectStatus): string {
  const map: Record<ProjectStatus, string> = {
    'On Track': 'var(--color-status-ontrack)',
    'At Risk': 'var(--color-status-atrisk)',
    'Off Track': 'var(--color-status-offtrack)',
  };
  return map[status];
}
