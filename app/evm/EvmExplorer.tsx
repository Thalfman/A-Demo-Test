'use client';

import { useMemo, useState, type ReactNode } from 'react';

import { AIBadge } from '@/components/AIBadge';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { EvmLineChart } from '@/components/EvmLineChart';
import { IndexBullet } from '@/components/IndexBullet';
import { SeverityChip } from '@/components/SeverityChip';
import { StatCard } from '@/components/StatCard';
import { formatCurrency, formatRatio } from '@/lib/format';
import type { EvmProjectEntry, RecommendedAction } from '@/lib/types';

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

  const columns: Column<EvmProjectEntry>[] = [
    {
      key: 'name',
      header: 'Project',
      sortValue: (p) => p.name,
      render: (p) => <span className="font-medium">{p.name}</span>,
    },
    {
      key: 'cpi',
      header: 'CPI',
      align: 'right',
      sortValue: (p) => p.metrics.cpi,
      render: (p) => <Ratio value={p.metrics.cpi} />,
    },
    {
      key: 'spi',
      header: 'SPI',
      align: 'right',
      sortValue: (p) => p.metrics.spi,
      render: (p) => <Ratio value={p.metrics.spi} />,
    },
    {
      key: 'cv',
      header: 'CV',
      align: 'right',
      sortValue: (p) => p.metrics.cv,
      render: (p) => <Money value={p.metrics.cv} />,
    },
    {
      key: 'vac',
      header: 'VAC',
      align: 'right',
      sortValue: (p) => p.metrics.vac,
      render: (p) => <Money value={p.metrics.vac} />,
    },
    {
      key: 'eac',
      header: 'EAC',
      align: 'right',
      sortValue: (p) => p.metrics.eac,
      render: (p) => formatCurrency(p.metrics.eac),
    },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Recommended actions"
        action={<AIBadge generatedAt={generatedAt} />}
      >
        <p className="mb-3 text-sm text-ink-muted">
          AI-generated corrective actions, paired with the variance narrative
          above.
        </p>
        <ul className="space-y-3">
          {actions.map((action, i) => {
            const target = action.projectId
              ? byId.get(action.projectId)
              : undefined;
            const clickable = Boolean(target);
            const content: ReactNode = (
              <div className="flex items-start gap-3">
                <SeverityChip severity={action.severity} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{action.action}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {action.rationale}
                  </p>
                  {target ? (
                    <p className="mt-1 text-xs font-medium text-brand">
                      {selectedId === target.projectId
                        ? `Selected: ${target.name}`
                        : `View ${target.name} →`}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-ink-muted">Portfolio-level</p>
                  )}
                </div>
              </div>
            );
            return (
              <li key={i}>
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => setSelectedId(target!.projectId)}
                    className="w-full rounded-token border border-border p-3 text-left transition-colors hover:border-brand"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="rounded-token border border-border p-3">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Projects by performance" bodyClassName="p-0">
        <DataTable<EvmProjectEntry>
          columns={columns}
          rows={projects}
          getRowKey={(p) => p.projectId}
          initialSort={{ key: 'cpi', dir: 'asc' }}
          onRowClick={(p) => setSelectedId(p.projectId)}
          isRowActive={(p) => p.projectId === selectedId}
        />
      </Card>

      <Card
        title={selected ? `Drill-down — ${selected.name}` : 'Drill-down'}
        action={
          <span className="text-xs text-ink-muted">Select a row to change</span>
        }
      >
        {selected ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <EvmLineChart data={selected.series} height={260} />
            </div>
            <div className="space-y-4">
              <IndexBullet label="CPI (cost)" value={selected.metrics.cpi} />
              <IndexBullet label="SPI (schedule)" value={selected.metrics.spi} />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <StatCard
                  label="CV"
                  value={<Money value={selected.metrics.cv} />}
                />
                <StatCard
                  label="VAC"
                  value={<Money value={selected.metrics.vac} />}
                />
                <StatCard
                  label="EAC"
                  value={formatCurrency(selected.metrics.eac)}
                />
                <StatCard
                  label="BAC"
                  value={formatCurrency(selected.metrics.bac)}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Select a project to inspect.</p>
        )}
      </Card>
    </div>
  );
}
