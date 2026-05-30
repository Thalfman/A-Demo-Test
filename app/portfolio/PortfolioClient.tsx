'use client';

import { useMemo, useState } from 'react';

import { AICallout } from '@/components/AICallout';
import { CategoryBarChart } from '@/components/CategoryBarChart';
import { Card } from '@/components/Card';
import { DataQualityChip } from '@/components/DataQualityChip';
import { DataTable, type Column } from '@/components/DataTable';
import { FilterBar, type FilterDef } from '@/components/FilterBar';
import { KpiStrip, type KpiItem, type KpiTone } from '@/components/KpiStrip';
import { ProjectLink } from '@/components/project-drawer/ProjectLink';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StatusBadge } from '@/components/StatusBadge';
import { Trackbar } from '@/components/Trackbar';
import { useTheme } from '@/components/theme/ThemeProvider';
import { formatCurrency, formatRatio } from '@/lib/format';
import { selectPortfolioView } from '@/lib/portfolioView';
import { getChartColors } from '@/lib/tokens';
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

const ratioTone = (v: number): KpiTone =>
  v >= 1 ? 'positive' : v >= 0.95 ? 'neutral' : 'negative';

/** Off-nominal coloring for an index in a table cell: ink when healthy, status
 *  tint only when it crosses the conventional thresholds. */
function ratioClass(v: number): string | undefined {
  if (v >= 1) return undefined;
  if (v >= 0.9) return 'text-status-atrisk';
  return 'text-status-offtrack';
}

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
  const { theme } = useTheme();
  const chart = getChartColors(theme);

  const [filters, setFilters] = useState<Record<string, string>>({
    division: '',
    status: '',
    phase: '',
  });

  const onChange = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const { projects: filtered, total, totalBac, offTrack, isFiltered, statusData, divisionData } =
    useMemo(
      () => selectPortfolioView(projects, filters, divisions),
      [projects, filters, divisions],
    );

  const ofAll = isFiltered ? `of ${total}` : undefined;
  const statusColorsByCell = PROJECT_STATUSES.map((s) => chart.statusColors[s]);

  const kpis: KpiItem[] = [
    { label: 'Projects', countTo: filtered.length, hint: ofAll },
    {
      label: 'Total BAC',
      value: formatCurrency(totalBac, { compact: true }),
      hint: 'budget at completion',
    },
    {
      label: 'Off Track',
      countTo: offTrack,
      tone: offTrack > 0 ? 'negative' : 'positive',
    },
    {
      label: 'Portfolio CPI',
      value: formatRatio(portfolioMetrics.cpi),
      tone: ratioTone(portfolioMetrics.cpi),
      hint: 'portfolio-wide',
    },
    {
      label: 'Portfolio SPI',
      value: formatRatio(portfolioMetrics.spi),
      tone: ratioTone(portfolioMetrics.spi),
      hint: 'portfolio-wide',
    },
  ];

  const divisionPhaseFilters: FilterDef[] = [
    {
      key: 'division',
      label: 'Division',
      options: divisions.map((d) => ({ value: d.id, label: d.name })),
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
        <span className="relative flex items-center">
          {p.flags.length > 0 ? (
            <span
              aria-hidden
              className="absolute -left-3 h-4 w-0.5 rounded-full bg-ink-faint"
              title={`${p.flags.length} data-quality flag${p.flags.length > 1 ? 's' : ''}`}
            />
          ) : null}
          <span className="font-medium">
            <ProjectLink id={p.id}>{p.name}</ProjectLink>
            {p.isStale ? (
              <span className="ml-2 font-mono text-[11px] font-normal text-ink-muted">
                stale
              </span>
            ) : null}
          </span>
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
      render: (p) => <Trackbar value={p.percentComplete} />,
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
      render: (p) => <span className={ratioClass(p.evm.cpi)}>{formatRatio(p.evm.cpi)}</span>,
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
    <div className="space-y-4">
      <AICallout artifact={aiBriefing} />

      <KpiStrip items={kpis} />

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

      <section className="rounded-md border border-hairline bg-panel shadow-elev">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3 border-b border-hairline px-4 py-3">
          <h3 className="mr-1 self-center text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">
            Projects
          </h3>
          <div className="flex flex-col gap-1 self-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
              Status
            </span>
            <SegmentedControl
              ariaLabel="Filter by status"
              value={filters.status}
              onChange={(v) => onChange('status', v)}
              allOption={{ value: '', label: 'All' }}
              options={PROJECT_STATUSES.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <FilterBar
            filters={divisionPhaseFilters}
            values={filters}
            onChange={onChange}
          />
          <span className="ml-auto self-center font-mono text-xs text-ink-muted">
            {filtered.length} of {projects.length}
            <span className="ml-3 text-ink-faint">{flaggedFields} flags normalized</span>
          </span>
        </div>
        <DataTable<Project>
          columns={columns}
          rows={filtered}
          getRowKey={(p) => p.id}
          initialSort={{ key: 'status', dir: 'desc' }}
          emptyMessage="No projects match these filters."
        />
      </section>
    </div>
  );
}
