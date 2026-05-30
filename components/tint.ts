import type { CSSProperties } from 'react';

/**
 * Build an inline style that sets the `--tint` custom property consumed by the
 * `.tint-chip` class in globals.css. Pass a token reference, e.g.
 * `tint('var(--status-offtrack)')`. Keeps translucent status/AI tints theme-aware
 * with zero JS — no inline hex+alpha, no theme hook, no hydration mismatch.
 */
export function tint(token: string): CSSProperties {
  return { '--tint': token } as unknown as CSSProperties;
}
