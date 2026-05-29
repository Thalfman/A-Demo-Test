'use client';

import { useMemo, useState, type ReactNode } from 'react';

import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { SeverityChip } from '@/components/SeverityChip';
import { DASH, formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { statusColors } from '@/lib/tokens';
import type {
  Discrepancy,
  ReconExport,
  ReconRecord,
  Severity,
} from '@/lib/types';

const MISMATCH_TINT = `${statusColors['At Risk']}1a`;
const ROW_TINT = `${statusColors['Off Track']}14`;

const SEVERITY_RANK: Record<Severity, number> = { high: 2, medium: 1, low: 0 };

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

/** Display a discrepancy value or export cell, picking currency/date/number
 *  formatting by field. Null/blank renders as an em dash. */
function valueLabel(
  field: keyof ReconRecord | string,
  v: string | number | null,
  opts: { money?: boolean; date?: boolean } = {},
): ReactNode {
  if (v == null || v === '') return DASH;
  if ((opts.date || field === 'endDate') && typeof v === 'string') {
    return formatDate(v);
  }
  if (typeof v === 'number') {
    return opts.money || field === 'budget' || field === 'actualCost'
      ? formatCurrency(v)
      : formatNumber(v);
  }
  return v;
}

function CountTag({ children }: { children: ReactNode }) {
  return (
    <span className="ml-2 rounded-full bg-surface px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-ink-muted">
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
    <div className="rounded-token border border-border">
      <div className="border-b border-border px-4 py-2">
        <p className="text-sm font-semibold">{exportData.source}</p>
        <p className="text-xs text-ink-muted">
          exported {formatDate(exportData.exportedAt)} · {exportData.records.length}{' '}
          records
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Project
              </th>
              {EXPORT_FIELDS.map((f) => (
                <th
                  key={f.key}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted ${
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
                  className="border-b border-border last:border-0"
                  style={onlyHere ? { backgroundColor: ROW_TINT } : undefined}
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="font-medium">{rec.name}</span>
                    {onlyHere ? <CountTag>{missingLabel}</CountTag> : null}
                    {dup ? <CountTag>duplicate</CountTag> : null}
                  </td>
                  {EXPORT_FIELDS.map((f) => {
                    const mm = mismatch.has(`${rec.projectId}:${String(f.key)}`);
                    return (
                      <td
                        key={String(f.key)}
                        className={`px-3 py-2 ${f.align === 'right' ? 'text-right' : 'text-left'} ${
                          mm ? 'font-semibold' : ''
                        }`}
                        style={mm ? { backgroundColor: MISMATCH_TINT } : undefined}
                      >
                        {valueLabel(f.key, rec[f.key], {
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

  const { mismatch, financeIds, pmoIds, financeDups, pmoDups } = useMemo(() => {
    const mismatch = new Set<string>();
    for (const d of discrepancies) {
      if (d.field && d.field !== 'record') {
        mismatch.add(`${d.projectId}:${d.field}`);
      }
    }
    const countIds = (recs: ReconRecord[]) => {
      const counts = new Map<string, number>();
      recs.forEach((r) =>
        counts.set(r.projectId, (counts.get(r.projectId) ?? 0) + 1),
      );
      return counts;
    };
    const fCounts = countIds(financeExport.records);
    const pCounts = countIds(pmoExport.records);
    const dupsOf = (counts: Map<string, number>) =>
      new Set([...counts].filter(([, n]) => n > 1).map(([id]) => id));
    return {
      mismatch,
      financeIds: new Set(fCounts.keys()),
      pmoIds: new Set(pCounts.keys()),
      financeDups: dupsOf(fCounts),
      pmoDups: dupsOf(pCounts),
    };
  }, [discrepancies, financeExport.records, pmoExport.records]);

  const columns: Column<Discrepancy>[] = [
    {
      key: 'name',
      header: 'Project',
      sortValue: (d) => d.name,
      render: (d) => <span className="font-medium">{d.name}</span>,
    },
    { key: 'field', header: 'Field', sortValue: (d) => d.field },
    {
      key: 'type',
      header: 'Type',
      sortValue: (d) => d.type,
      render: (d) => (
        <span className="whitespace-nowrap text-ink-muted">
          {titleCase(d.type)}
        </span>
      ),
    },
    {
      key: 'finance',
      header: 'Finance value',
      align: 'right',
      sortValue: (d) => d.financeValue,
      render: (d) => valueLabel(d.field, d.financeValue),
    },
    {
      key: 'pmo',
      header: 'PMO value',
      align: 'right',
      sortValue: (d) => d.pmoValue,
      render: (d) => valueLabel(d.field, d.pmoValue),
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
    <div className="space-y-6">
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
            className="text-xs font-medium text-brand hover:underline"
          >
            {showExports ? 'Hide' : 'Show'} side-by-side
          </button>
        }
      >
        {showExports ? (
          <>
            <p className="mb-3 text-xs text-ink-muted">
              Mismatched cells are tinted; rows present on only one side are
              shaded. The PMO tracker is 2 days staler than Finance.
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
