'use client';

import { useMemo, useState, type ReactNode } from 'react';

import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { ProjectLink } from '@/components/project-drawer/ProjectLink';
import { SeverityChip } from '@/components/SeverityChip';
import { DASH, fieldValue, formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { analyzeReconciliation } from '@/lib/reconcile';
import type {
  Discrepancy,
  ReconExport,
  ReconRecord,
  Severity,
} from '@/lib/types';

const SEVERITY_RANK: Record<Severity, number> = { high: 2, medium: 1, low: 0 };

const SEVERITY_COLOR: Record<Severity, string> = {
  high: 'var(--status-offtrack)',
  medium: 'var(--status-atrisk)',
  low: 'var(--ink-faint)',
};

const EXPORT_FIELDS: {
  key: keyof ReconRecord;
  label: string;
  money?: boolean;
  date?: boolean;
  align?: 'left' | 'right';
}[] = [
  { key: 'status', label: 'Status' },
  { key: 'budget', label: 'Budget', money: true, align: 'right' },
  { key: 'actualCost', label: 'Actual', money: true, align: 'right' },
  { key: 'owner', label: 'Owner' },
  { key: 'endDate', label: 'End date', date: true },
];

const titleCase = (s: string): string =>
  s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const isMoneyField = (field: string) =>
  field === 'budget' || field === 'actualCost';

/** PMO − Finance, only when both sides are numeric. */
function discrepancyDelta(d: Discrepancy): number | null {
  if (typeof d.financeValue === 'number' && typeof d.pmoValue === 'number') {
    return d.pmoValue - d.financeValue;
  }
  return null;
}

function DeltaCell({ d }: { d: Discrepancy }) {
  const delta = discrepancyDelta(d);
  if (delta == null) return <span className="text-ink-faint">{DASH}</span>;
  const abs = Math.abs(delta);
  const formatted = isMoneyField(d.field) ? formatCurrency(abs) : formatNumber(abs);
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  const cls =
    delta < 0 ? 'text-status-offtrack' : delta > 0 ? 'text-status-ontrack' : 'text-ink-muted';
  return (
    <span className={cls}>
      {sign}
      {formatted}
    </span>
  );
}

function CountTag({ children }: { children: ReactNode }) {
  return (
    <span className="ml-2 rounded-sm bg-panel-2 px-1.5 py-0.5 font-mono text-[0.65rem] font-medium uppercase tracking-wide text-ink-muted">
      {children}
    </span>
  );
}

function ExportTable({
  exportData,
  mismatch,
  counterpartIds,
  dupIds,
  missingLabel,
}: {
  exportData: ReconExport;
  mismatch: Set<string>;
  counterpartIds: Set<string>;
  dupIds: Set<string>;
  missingLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-hairline">
      <div className="border-b border-hairline bg-panel-2 px-4 py-2">
        <p className="text-sm font-semibold">{exportData.source}</p>
        <p className="font-mono text-xs text-ink-muted">
          exported {formatDate(exportData.exportedAt)} · {exportData.records.length}{' '}
          records
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline-strong bg-panel-2">
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Project
              </th>
              {EXPORT_FIELDS.map((f) => (
                <th
                  key={f.key}
                  className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted ${
                    f.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exportData.records.map((rec, i) => {
              const onlyHere = !counterpartIds.has(rec.projectId);
              const dup = dupIds.has(rec.projectId);
              return (
                <tr
                  key={`${rec.projectId}-${i}`}
                  className={`border-b border-hairline last:border-0 ${
                    onlyHere ? 'bg-panel-2' : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="font-medium">
                      <ProjectLink id={rec.projectId}>{rec.name}</ProjectLink>
                    </span>
                    {onlyHere ? <CountTag>{missingLabel}</CountTag> : null}
                    {dup ? <CountTag>duplicate</CountTag> : null}
                  </td>
                  {EXPORT_FIELDS.map((f) => {
                    const mm = mismatch.has(`${rec.projectId}:${String(f.key)}`);
                    return (
                      <td
                        key={String(f.key)}
                        className={`px-3 py-2 ${f.align === 'right' ? 'text-right font-mono tabular-nums' : ''} ${
                          mm
                            ? 'border-l-2 border-l-status-offtrack bg-mismatch font-semibold text-ink'
                            : ''
                        }`}
                      >
                        {fieldValue(f.key, rec[f.key], {
                          money: f.money,
                          date: f.date,
                        })}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ReconClient({
  discrepancies,
  financeExport,
  pmoExport,
}: {
  discrepancies: Discrepancy[];
  financeExport: ReconExport;
  pmoExport: ReconExport;
}) {
  const [showExports, setShowExports] = useState(false);

  const { mismatch, financeIds, pmoIds, financeDups, pmoDups } = useMemo(
    () =>
      analyzeReconciliation(
        discrepancies,
        financeExport.records,
        pmoExport.records,
      ),
    [discrepancies, financeExport.records, pmoExport.records],
  );

  const columns: Column<Discrepancy>[] = [
    {
      key: 'name',
      header: 'Project',
      sortValue: (d) => d.name,
      render: (d) => (
        <span className="relative flex items-center">
          <span
            aria-hidden
            className="absolute -left-3 h-4 w-[3px] rounded-full"
            style={{ backgroundColor: SEVERITY_COLOR[d.severity] }}
          />
          <span className="font-medium">
            <ProjectLink id={d.projectId}>{d.name}</ProjectLink>
          </span>
        </span>
      ),
    },
    { key: 'field', header: 'Field', sortValue: (d) => d.field },
    {
      key: 'type',
      header: 'Type',
      sortValue: (d) => d.type,
      render: (d) => (
        <span className="whitespace-nowrap text-ink-muted">{titleCase(d.type)}</span>
      ),
    },
    {
      key: 'finance',
      header: 'Finance value',
      align: 'right',
      sortValue: (d) => d.financeValue,
      render: (d) => fieldValue(d.field, d.financeValue),
    },
    {
      key: 'pmo',
      header: 'PMO value',
      align: 'right',
      sortValue: (d) => d.pmoValue,
      render: (d) => fieldValue(d.field, d.pmoValue),
    },
    {
      key: 'delta',
      header: 'Δ PMO−Fin',
      align: 'right',
      sortValue: (d) => discrepancyDelta(d),
      render: (d) => <DeltaCell d={d} />,
    },
    {
      key: 'severity',
      header: 'Severity',
      align: 'right',
      sortValue: (d) => SEVERITY_RANK[d.severity],
      render: (d) => <SeverityChip severity={d.severity} />,
    },
  ];

  return (
    <div className="space-y-4">
      <Card title={`Discrepancies (${discrepancies.length})`} bodyClassName="p-0">
        <DataTable<Discrepancy>
          columns={columns}
          rows={discrepancies}
          getRowKey={(d, i) => `${d.projectId}-${d.field}-${i}`}
          initialSort={{ key: 'severity', dir: 'desc' }}
        />
      </Card>

      <Card
        title="Source exports"
        action={
          <button
            type="button"
            onClick={() => setShowExports((s) => !s)}
            className="rounded-sm font-mono text-xs font-medium text-ai transition-colors duration-state hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ai"
          >
            {showExports ? 'Hide' : 'Show'} side-by-side
          </button>
        }
      >
        {showExports ? (
          <>
            <p className="mb-3 text-xs text-ink-muted">
              Mismatched cells are tinted with a red left marker; rows present on
              only one side are shaded. The PMO tracker is 2 days staler than
              Finance.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <ExportTable
                exportData={financeExport}
                mismatch={mismatch}
                counterpartIds={pmoIds}
                dupIds={financeDups}
                missingLabel="missing in PMO"
              />
              <ExportTable
                exportData={pmoExport}
                mismatch={mismatch}
                counterpartIds={financeIds}
                dupIds={pmoDups}
                missingLabel="missing in Finance"
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            Compare the raw {financeExport.source} and {pmoExport.source} records
            with mismatches highlighted.
          </p>
        )}
      </Card>
    </div>
  );
}
