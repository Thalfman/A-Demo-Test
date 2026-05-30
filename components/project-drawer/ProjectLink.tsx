'use client';

import type { ReactNode } from 'react';

import { useProjectDrawer } from './ProjectDrawerContext';

/**
 * A clickable Project name that opens the cross-module drawer. Thin wrapper, no
 * business logic — it only calls `open(id)`. Rendered as a real button so it is
 * keyboard-operable and obviously interactive (dotted affordance + focus ring).
 *
 * Click is stopped from propagating so wrapping it inside an already-clickable
 * row (e.g. the EVM drill-down rows) opens the drawer instead of selecting the
 * row.
 */
export function ProjectLink({
  id,
  children,
  className = '',
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const { open } = useProjectDrawer();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        open(id);
      }}
      className={`rounded-sm text-left underline decoration-dotted decoration-ink-faint underline-offset-2 transition-colors hover:text-ai hover:decoration-ai focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai ${className}`}
    >
      {children}
    </button>
  );
}
