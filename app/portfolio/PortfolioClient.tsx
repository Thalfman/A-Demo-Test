'use client';

import { useMemo, useState } from 'react';

import { AICallout } from '@/components/AICallout';
import { CategoryBarChart } from '@/components/CategoryBarChart';
import { Card } from '@/components/Card';
import { DataQualityChip } from '@/components/DataQualityChip';
import { DataTable, type Column } from '@/components/DataTable';
import { FilterBar, type FilterDef } from '@/components/FilterBar';
import { StatCard, type StatTone } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatPercent, formatRatio } from '@/lib/format';
import { statusColors } from '@/lib/tokens';
import {
  PROJECT_PHASES,
  PROJECT_STATUSES,
  type AiArtifact,
  type Division,
  type EvmMetrics,
  type Project,
} from '@/lib/types';

const STATUS_RANK: Record<Project['status'], number> = {
  'Off Track': 2,
  'At Risk': 1,
  'On Track': 0,
};

const ratioTone = (v: number): StatTone =>
  v >= 1 ? 'positive' : v >= 0.95 ? 'neutral' : 'negative';

export function PortfolioClient({
  projects,
  aiBriefing,
  portfolioMetrics,
  divisions,
  flaggedFields,
}: {
  projects: Project[];
  aiBriefing: AiArtifact;
  portfolioMetrics: EvmMetrics;
  divisions: Division[];
  flaggedFields: number;
}) {
  const [filters, setFilters] = useState<Record<string, string>>({
    division: '',
    status: '',
    phase: '',
  });

  const onChange = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (!filters.division || p.division === filters.division) &&
          (!filters.status || p.status === filters.status) &&
          (!filters.phase || p.phase === filters.phase),
      ),
    [projects, filters],
  );

  const totalBac = filtered.reduce((sum, p) => sum + p.evm.bac, 0);
  const offTrack = filtered.filter((p) => p.status === 'Off Track').length;
  const isFiltered = filtered.length !== projects.length;
  const ofAll = isFiltered ? `of ${projects.length}` : undefined;

  const statusData = PROJECT_STATUSES.map((status) => ({
    status,
    count: filtered.filter((p) => p.status === status).length,
  }));
  const statusColorsByCell = PROJECT_STATUSES.map((s) => statusColors[s]);

  const divisionData = divisions.map((d) => ({
    division: d.name,
    bac: filtered
      .filter((p) => p.division === d.id)
      .reduce((sum, p) => sum + p.evm.bac, 0),
  }));

  const filterDefs: FilterDef[] = [
    {
      key: 'division',
      label: 'Division',
      options: divisions.map((d) => ({ value: d.id, label: d.name })),
    },
    {
      key: 'status',
      label: 'Status',
      options: PROJECT_STATUSES.map((s) => ({ value: s, label: s })),
    },
    {
      key: 'phase',
      label: 'Phase',
      options: PROJECT_PHASES.map((p) => ({ value: p, label: p })),
    },
  ];

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Project',
      sortValue: (p) => p.name,
      render: (p) => (
        <span className="font-medium">
          {p.name}
          {p.isStale ? (
            <span className="ml-2 text-xs font-normal text-ink-muted">stale</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'division',
      header: 'Division',
      sortValue: (p) => p.divisionName,
      render: (p) => p.divisionName,
    },
    { key: 'owner', header: 'Owner', sortValue: (p) => p.owner },
    { key: 'phase', header: 'Phase', sortValue: (p) => p.phase },
    {
      key: 'status',
      header: 'Status',
      sortValue: (p) => STATUS_RANK[p.status],
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'percentComplete',
      header: '% Complete',
      align: 'right',
      sortValue: (p) => p.percentComplete,
      render: (p) => formatPercent(p.percentComplete),
    },
    {
      key: 'bac',
      header: 'BAC',
      align: 'right',
      sortValue: (p) => p.evm.bac,
      render: (p) => formatCurrency(p.evm.bac),
    },
    {
      key: 'cpi',
      header: 'CPI',
      align: 'right',
      sortValue: (p) => p.evm.cpi,
      render: (p) => formatRatio(p.evm.cpi),
    },
    {
      key: 'dataQuality',
      header: 'Data quality',
      align: 'right',
      sortValue: (p) => p.flags.length,
      render: (p) => <DataQualityChip flags={p.flags} />,
    },
  ];

  return (
    <div className="space-y-6">
      <AICallout artifact={aiBriefing} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Projects" value={filtered.length} hint={ofAll} />
        <StatCard
          label="Total BAC"
          value={formatCurrency(totalBac, { compact: true })}
          hint="budget at completion"
        />
        <StatCard
          label="Off Track"
          value={offTrack}
          tone={offTrack > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          label="Portfolio CPI"
          value={formatRatio(portfolioMetrics.cpi)}
          tone={ratioTone(portfolioMetrics.cpi)}
          hint="portfolio-wide"
        />
        <StatCard
          label="Portfolio SPI"
          value={formatRatio(portfolioMetrics.spi)}
          tone={ratioTone(portfolioMetrics.spi)}
          hint="portfolio-wide"
        />
      </div>

      <Card>
        <FilterBar filters={filterDefs} values={filters} onChange={onChange} />
        <p className="mt-3 text-xs text-ink-muted">
          {flaggedFields} data-quality flags normalized on load across{' '}
          {projects.length} projects. Per-row detail in the Data quality column.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Status distribution">
          <CategoryBarChart
            data={statusData}
            xKey="status"
            height={240}
            bars={[{ key: 'count', name: 'Projects', cellColors: statusColorsByCell }]}
          />
        </Card>
        <Card title="Budget by division">
          <CategoryBarChart
            data={divisionData}
            xKey="division"
            height={240}
            yTickFormatter={(v) => formatCurrency(v, { compact: true })}
            valueFormatter={(v) => formatCurrency(v)}
            bars={[{ key: 'bac', name: 'BAC' }]}
          />
        </Card>
      </div>

      <Card title={`Projects (${filtered.length})`} bodyClassName="p-0">
        <DataTable<Project>
          columns={columns}
          rows={filtered}
          getRowKey={(p) => p.id}
          initialSort={{ key: 'status', dir: 'desc' }}
          emptyMessage="No projects match these filters."
        />
      </Card>
    </div>
  );
}
