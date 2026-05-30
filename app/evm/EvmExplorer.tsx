'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';

import { AIBadge } from '@/components/AIBadge';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { EvmLineChart } from '@/components/EvmLineChart';
import { IndexBullet } from '@/components/IndexBullet';
import { ProjectLink } from '@/components/project-drawer/ProjectLink';
import { SeverityChip } from '@/components/SeverityChip';
import { StatCard } from '@/components/StatCard';
import { formatCurrency, formatRatio } from '@/lib/format';
import type { EvmProjectEntry, RecommendedAction, Severity } from '@/lib/types';

const SEVERITY_BORDER: Record<Severity, string> = {
  high: 'border-l-status-offtrack',
  medium: 'border-l-status-atrisk',
  low: 'border-l-ink-faint',
};

/** Negative money reads as a problem — color it. */
function Money({ value }: { value: number }) {
  return (
    <span className={value < 0 ? 'text-status-offtrack' : undefined}>
      {formatCurrency(value)}
    </span>
  );
}

function Ratio({ value }: { value: number }) {
  const cls =
    value >= 1
      ? 'text-status-ontrack'
      : value >= 0.9
        ? 'text-status-atrisk'
        : 'text-status-offtrack';
  return <span className={cls}>{formatRatio(value)}</span>;
}

export function EvmExplorer({
  projects,
  actions,
  generatedAt,
}: {
  projects: EvmProjectEntry[];
  actions: RecommendedAction[];
  generatedAt: string;
}) {
  const byId = useMemo(
    () => new Map(projects.map((p) => [p.projectId, p])),
    [projects],
  );

  // Default to the worst-CPI project so the drill-down is populated on load.
  const worstId = useMemo(
    () =>
      projects.reduce(
        (worst, p) => (p.metrics.cpi < byId.get(worst)!.metrics.cpi ? p.projectId : worst),
        projects[0]?.projectId ?? '',
      ),
    [projects, byId],
  );

  const [selectedId, setSelectedId] = useState<string>(worstId);
  const selected = byId.get(selectedId);
  const drillRef = useRef<HTMLDivElement>(null);

  const selectFromAction = (id: string) => {
    setSelectedId(id);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    drillRef.current?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'nearest',
    });
  };

  const columns: Column<EvmProjectEntry>[] = [
    {
      key: 'name',
      header: 'Project',
      sortValue: (p) => p.name,
      render: (p) => (
        <span className="font-medium">
          <ProjectLink id={p.projectId}>{p.name}</ProjectLink>
        </span>
      ),
    },
    { key: 'cpi', header: 'CPI', align: 'right', sortValue: (p) => p.metrics.cpi, render: (p) => <Ratio value={p.metrics.cpi} /> },
    { key: 'spi', header: 'SPI', align: 'right', sortValue: (p) => p.metrics.spi, render: (p) => <Ratio value={p.metrics.spi} /> },
    { key: 'cv', header: 'CV', align: 'right', sortValue: (p) => p.metrics.cv, render: (p) => <Money value={p.metrics.cv} /> },
    { key: 'vac', header: 'VAC', align: 'right', sortValue: (p) => p.metrics.vac, render: (p) => <Money value={p.metrics.vac} /> },
    { key: 'eac', header: 'EAC', align: 'right', sortValue: (p) => p.metrics.eac, render: (p) => formatCurrency(p.metrics.eac) },
  ];

  return (
    <div className="space-y-4">
      <Card
        variant="ai"
        title="Recommended actions"
        action={<AIBadge generatedAt={generatedAt} />}
      >
        <p className="mb-3 text-sm text-ink-muted">
          AI-generated corrective actions, paired with the variance narrative
          above. Select one to inspect its project.
        </p>
        <ul className="space-y-2">
          {actions.map((action, i) => {
            const target = action.projectId ? byId.get(action.projectId) : undefined;
            const content: ReactNode = (
              <div className="flex items-start gap-3">
                <SeverityChip severity={action.severity} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{action.action}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">{action.rationale}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {action.projectId ? (
                      <span className="font-mono text-[11px] text-ink-faint">
                        {action.projectId}
                      </span>
                    ) : null}
                    {target ? (
                      <span className="font-mono text-[11px] font-medium text-ai">
                        {selectedId === target.projectId ? 'selected: ' : 'open '}
                        <ProjectLink id={target.projectId}>
                          {target.name}
                        </ProjectLink>
                      </span>
                    ) : (
                      <span className="text-[11px] text-ink-muted">Portfolio-level</span>
                    )}
                  </div>
                </div>
              </div>
            );
            return (
              <li key={i}>
                {target ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => selectFromAction(target.projectId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectFromAction(target.projectId);
                      }
                    }}
                    className={`w-full cursor-pointer rounded-sm border border-l-[3px] border-hairline ${SEVERITY_BORDER[action.severity]} bg-panel p-3 text-left transition-colors duration-state ease-instrument hover:bg-panel-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ai`}
                  >
                    {content}
                  </div>
                ) : (
                  <div
                    className={`rounded-sm border border-l-[3px] border-hairline ${SEVERITY_BORDER[action.severity]} bg-panel p-3`}
                  >
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="self-start overflow-hidden rounded-md border border-hairline bg-panel shadow-elev">
          <div className="border-b border-hairline px-4 py-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">
              Projects by performance
            </h3>
          </div>
          <DataTable<EvmProjectEntry>
            columns={columns}
            rows={projects}
            getRowKey={(p) => p.projectId}
            initialSort={{ key: 'cpi', dir: 'asc' }}
            onRowClick={(p) => setSelectedId(p.projectId)}
            isRowActive={(p) => p.projectId === selectedId}
            pulseRowKey={selectedId}
          />
        </section>

        <section
          ref={drillRef}
          className="self-start rounded-md border border-hairline bg-panel shadow-pop lg:sticky lg:top-16"
        >
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
            <h3 className="truncate text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">
              {selected ? `Drill-down · ${selected.name}` : 'Drill-down'}
            </h3>
            <span className="shrink-0 text-[11px] text-ink-muted">Select a row</span>
          </div>
          <div className="p-4">
            {selected ? (
              <div className="space-y-4">
                <EvmLineChart data={selected.series} height={200} />
                <div className="space-y-3">
                  <IndexBullet label="CPI (cost)" value={selected.metrics.cpi} />
                  <IndexBullet label="SPI (schedule)" value={selected.metrics.spi} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="CV" value={<Money value={selected.metrics.cv} />} />
                  <StatCard label="VAC" value={<Money value={selected.metrics.vac} />} />
                  <StatCard label="EAC" value={formatCurrency(selected.metrics.eac)} />
                  <StatCard label="BAC" value={formatCurrency(selected.metrics.bac)} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Select a project to inspect.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
