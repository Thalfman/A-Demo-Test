'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { AIBadge } from '@/components/AIBadge';
import { DataQualityChip } from '@/components/DataQualityChip';
import { EvmLineChart } from '@/components/EvmLineChart';
import { IndexBullet } from '@/components/IndexBullet';
import { SeverityChip } from '@/components/SeverityChip';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { fieldValue, formatCurrency, formatPercent } from '@/lib/format';
import { getProjectDossier } from '@/lib/projectGraphData';
import type { ProjectDossier } from '@/lib/projectGraph';

const FOCUSABLE =
  'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

/**
 * The Project Spine slide-over: one Project told across all four modules. Purely
 * presentational — it renders a dossier from `getProjectDossier` by composing the
 * existing module components. It adds no business logic; every connection shown
 * is a real link already in the frozen data (ADR-0001).
 *
 * Accessibility: Escape closes, focus is trapped while open and restored to the
 * trigger on close, and the slide animation is neutralized by the global
 * `prefers-reduced-motion` rule in app/globals.css.
 */
export function ProjectDrawer({
  projectId,
  onClose,
}: {
  projectId: string | null;
  onClose: () => void;
}) {
  const open = projectId !== null;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [entered, setEntered] = useState(false);

  // Compose the dossier once per Project id, not on every render while open.
  const dossier = useMemo(
    () => (projectId === null ? null : getProjectDossier(projectId)),
    [projectId],
  );

  // Slide-in: mount at translate-x-full, then flip on the next frame so the
  // transition runs. Reduced motion collapses the duration globally.
  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Focus management + key handling + scroll lock while open.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open || projectId === null) return null;

  const dossier = getProjectDossier(projectId);

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close project drawer"
        onClick={onClose}
        className={`absolute inset-0 cursor-default bg-black/50 transition-opacity duration-layout ease-instrument ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={dossier ? `${dossier.project.name} — cross-module view` : 'Project'}
        className={`absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-hairline-strong bg-bg shadow-pop transition-transform duration-layout ease-instrument ${
          entered ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {dossier ? (
          <DossierBody dossier={dossier} onClose={onClose} closeRef={closeRef} />
        ) : (
          <UnknownProject onClose={onClose} closeRef={closeRef} />
        )}
      </div>
    </div>
  );
}

function DossierBody({
  dossier,
  onClose,
  closeRef,
}: {
  dossier: ProjectDossier;
  onClose: () => void;
  closeRef: React.RefObject<HTMLButtonElement>;
}) {
  const { project, evm, discrepancies, actions, documents } = dossier;
  const { flags } = project;
  const meta = [project.divisionName, project.owner ?? 'Unassigned', project.phase]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      {/* Header */}
      <header className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            {project.isStale ? (
              <span className="font-mono text-[11px] text-ink-muted">stale</span>
            ) : null}
            {flags.length > 0 ? <DataQualityChip flags={flags} /> : null}
          </div>
          <h2 className="mt-2 truncate text-lg font-semibold text-ink">
            {project.name}
          </h2>
          <p className="mt-0.5 truncate text-[13px] text-ink-muted">{meta}</p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="-mr-1 rounded-sm px-2 py-1 text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai"
          aria-label="Close"
        >
          <span aria-hidden className="text-lg leading-none">
            ×
          </span>
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <dl className="mb-5 grid grid-cols-3 gap-3">
          <StatCard
            label="Budget (BAC)"
            value={formatCurrency(project.evm.bac, { compact: true })}
          />
          <StatCard label="% Complete" value={formatPercent(project.percentComplete)} />
          <StatCard
            label="Forecast EAC"
            value={formatCurrency(project.evm.eac, { compact: true })}
          />
        </dl>

        <Section title="Earned value">
          {evm ? (
            <div className="space-y-3">
              <EvmLineChart data={evm.series} height={180} />
              <div className="space-y-2">
                <IndexBullet label="CPI (cost)" value={evm.metrics.cpi} />
                <IndexBullet label="SPI (schedule)" value={evm.metrics.spi} />
              </div>
            </div>
          ) : (
            <Empty>No EVM record.</Empty>
          )}
        </Section>

        <Section title={`Discrepancies (${discrepancies.length})`}>
          {discrepancies.length > 0 ? (
            <ul className="space-y-2">
              {discrepancies.map((d, i) => (
                <li
                  key={`${d.projectId}-${d.field}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-hairline bg-panel px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">{d.field}</p>
                    <p className="truncate font-mono text-[11px] text-ink-muted">
                      finance {fieldValue(d.field, d.financeValue)} · pmo{' '}
                      {fieldValue(d.field, d.pmoValue)}
                    </p>
                  </div>
                  <SeverityChip severity={d.severity} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>None.</Empty>
          )}
        </Section>

        <Section title={`Recommended actions (${actions.length})`}>
          {actions.length > 0 ? (
            <ul className="space-y-2">
              {actions.map((a, i) => (
                <li
                  key={`${a.action}-${i}`}
                  className="rounded-md border border-hairline bg-panel px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-medium text-ink">{a.action}</p>
                    <SeverityChip severity={a.severity} />
                  </div>
                  <p className="mt-1 text-[12px] text-ink-muted">{a.rationale}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>None.</Empty>
          )}
        </Section>

        <Section title={`AI artifacts (${documents.length})`}>
          {documents.length > 0 ? (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="rounded-md border border-hairline bg-panel px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {doc.title}
                    </p>
                    <AIBadge generatedAt={doc.generatedAt} />
                  </div>
                  <p className="mt-1 text-[12px] text-ink-muted">{doc.summary}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>None.</Empty>
          )}
        </Section>
      </div>
    </>
  );
}

function UnknownProject({
  onClose,
  closeRef,
}: {
  onClose: () => void;
  closeRef: React.RefObject<HTMLButtonElement>;
}) {
  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
        <h2 className="text-lg font-semibold text-ink">Project not found</h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="-mr-1 rounded-sm px-2 py-1 text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai"
          aria-label="Close"
        >
          <span aria-hidden className="text-lg leading-none">
            ×
          </span>
        </button>
      </header>
      <div className="flex-1 px-5 py-4">
        <Empty>No Project carries this id.</Empty>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-[12px] italic text-ink-faint">{children}</p>;
}
