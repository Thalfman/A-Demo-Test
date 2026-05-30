'use client';

import { useEffect, useRef, useState } from 'react';

import type { DataQualityFlag } from '@/lib/types';
import { tint } from './tint';

const PANEL_WIDTH = 288; // matches w-72

const codeLabel = (code: string): string => code.replace(/_/g, ' ');

const cellText = (v: string | number | null): string =>
  v == null || v === '' ? '∅' : String(v);

/** Flag count for a project's data-quality issues, with a popover listing each
 *  flag. The popover is position:fixed and anchored to the trigger so it escapes
 *  the surrounding table's overflow-scroll box (no clipping). The trigger is a
 *  real <button>, so it is keyboard-operable. The chip stays off the AI accent —
 *  it is data provenance, not the analyst layer. */
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
    return <span className="font-mono text-[11px] text-ink-faint">clean</span>;
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
        className="tint-chip inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-sm px-2 py-0.5 font-mono text-[11px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ai"
        style={tint('var(--status-atrisk)')}
      >
        {flags.length} flag{flags.length > 1 ? 's' : ''}
      </button>
      {open && pos ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Data-quality flags"
          className="fixed z-50 w-72 rounded-md border border-hairline bg-panel p-3 text-left shadow-pop"
          style={{ top: pos.top, left: pos.left }}
        >
          <ul className="space-y-2">
            {flags.map((f, i) => (
              <li key={i} className="text-xs">
                <div>
                  <span className="font-medium">{f.field}</span>
                  <span className="ml-1 text-ink-muted">· {codeLabel(f.code)}</span>
                </div>
                <div className="font-mono text-ink-muted">
                  <span className="line-through">{cellText(f.original)}</span>
                  <span className="mx-1">→</span>
                  <span className="text-ink">{cellText(f.normalized)}</span>
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
