'use client';

import { useEffect, useRef, useState } from 'react';

import { statusColors } from '@/lib/tokens';
import type { DataQualityFlag } from '@/lib/types';

const ACCENT = statusColors['At Risk'];
const PANEL_WIDTH = 288; // matches w-72

const codeLabel = (code: string): string => code.replace(/_/g, ' ');

const cellText = (v: string | number | null): string =>
  v == null || v === '' ? '∅' : String(v);

/** Flag count for a project's data-quality issues, with a popover listing each
 *  flag. The popover is position:fixed and anchored to the trigger so it escapes
 *  the surrounding table's overflow-scroll box (no clipping). The trigger is a
 *  real <button>, so it is keyboard-operable. */
export function DataQualityChip({ flags }: { flags: DataQualityFlag[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onReflow = () => setOpen(false); // position is anchored; close on scroll/resize
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    };
  }, [open]);

  if (!flags || flags.length === 0) {
    return <span className="text-xs text-ink-muted">Clean</span>;
  }

  const title = flags.map((f) => `${f.field}: ${codeLabel(f.code)}`).join('\n');

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const left = Math.max(
        8,
        Math.min(r.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8),
      );
      setPos({ top: r.bottom + 4, left });
    }
    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title={title}
        className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-brand"
        style={{
          color: ACCENT,
          backgroundColor: `${ACCENT}1a`,
          border: `1px solid ${ACCENT}33`,
        }}
      >
        {flags.length} flag{flags.length > 1 ? 's' : ''}
      </button>
      {open && pos ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Data-quality flags"
          className="fixed z-50 w-72 rounded-token border border-border bg-surface-raised p-3 text-left shadow-lg"
          style={{ top: pos.top, left: pos.left }}
        >
          <ul className="space-y-2">
            {flags.map((f, i) => (
              <li key={i} className="text-xs">
                <div>
                  <span className="font-medium">{f.field}</span>
                  <span className="ml-1 text-ink-muted">· {codeLabel(f.code)}</span>
                </div>
                <div className="text-ink-muted">
                  <span className="line-through">{cellText(f.original)}</span>
                  <span className="mx-1">→</span>
                  <span>{cellText(f.normalized)}</span>
                </div>
                {f.note ? (
                  <div className="italic text-ink-muted">{f.note}</div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
