'use client';

import { useCallback, useState } from 'react';

/**
 * Tracks which chart series/bars are toggled off via a clickable legend. Returns
 * the hidden-key set and a stable toggle. Shared by the line and bar charts so
 * the visibility semantics live in one place (not copy-pasted per chart).
 */
export function useSeriesToggle(): {
  hidden: ReadonlySet<string>;
  toggle: (key: string) => void;
} {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());

  const toggle = useCallback((key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return { hidden, toggle };
}
