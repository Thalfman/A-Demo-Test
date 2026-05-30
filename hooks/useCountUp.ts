'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animate a number from 0 to `target` once, on the first mount only. After that
 * the returned value tracks `target` directly (so live updates — e.g. filtering
 * — apply instantly without re-animating). Returns `target` on the server and
 * under prefers-reduced-motion, so there is no hydration mismatch and no motion
 * for users who opt out. Callers format the returned number themselves.
 */
export function useCountUp(target: number, durationMs = 300): number {
  const [value, setValue] = useState(target);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current) {
      setValue(target);
      return;
    }
    animated.current = true;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !Number.isFinite(target)) {
      setValue(target);
      return;
    }

    let raf = 0;
    const start = performance.now();
    setValue(0);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
