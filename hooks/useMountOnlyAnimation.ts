'use client';

import { useEffect, useRef } from 'react';

/**
 * Returns true for the first render only, then false — so a Recharts chart plays
 * its draw animation on initial mount but NOT when it re-renders to recolor on a
 * theme flip. Returns false immediately under prefers-reduced-motion.
 */
export function useMountOnlyAnimation(): boolean {
  const ref = useRef(
    typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const animate = ref.current;
  useEffect(() => {
    ref.current = false;
  }, []);
  return animate;
}
