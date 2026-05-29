'use client';

import { useMemo, useState, type ReactNode } from 'react';

import { DASH } from '@/lib/format';

export type Align = 'left' | 'right' | 'center';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Sort key extractor. Omit to make the column unsortable. */
  sortValue?: (row: T) => string | number | null | undefined;
  /** Cell renderer. Falls back to the sort value (or DASH) when omitted. */
  render?: (row: T) => ReactNode;
  align?: Align;
  headerClassName?: string;
  cellClassName?: string;
}

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

const alignClass: Record<Align, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/** Compare two present (non-missing) values. Missing handling is applied by the
 *  caller so it stays independent of sort direction. */
function compareValues(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

function defaultCell<T>(col: Column<T>, row: T): ReactNode {
  if (col.render) return col.render(row);
  if (col.sortValue) {
    const v = col.sortValue(row);
    return v == null || v === '' ? DASH : String(v);
  }
  return DASH;
}

/** Generic, sortable, null-safe table. Clicking a sortable header toggles
 *  asc/desc; missing values always sort last and render as an em dash. */
export function DataTable<T>({
  columns,
  rows,
  initialSort,
  getRowKey,
  onRowClick,
  isRowActive,
  emptyMessage = 'No matching rows.',
}: {
  columns: Column<T>[];
  rows: T[];
  initialSort?: SortState;
  getRowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  isRowActive?: (row: T) => boolean;
  emptyMessage?: string;
}) {
  const [sort, setSort] = useState<SortState | undefined>(initialSort);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((ra, rb) => {
      const a = col.sortValue!(ra);
      const b = col.sortValue!(rb);
      const aMissing = a == null || a === '';
      const bMissing = b == null || b === '';
      // Missing values always sort last, independent of direction.
      if (aMissing || bMissing) {
        if (aMissing && bMissing) return 0;
        return aMissing ? 1 : -1;
      }
      return compareValues(a, b) * dir;
    });
  }, [rows, sort, columns]);

  const toggleSort = (col: Column<T>) => {
    if (!col.sortValue) return;
    setSort((prev) =>
      prev?.key === col.key
        ? { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: col.key, dir: 'asc' },
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => {
              const sortable = Boolean(col.sortValue);
              const active = sort?.key === col.key;
              const indicator = active
                ? sort?.dir === 'asc'
                  ? '▲'
                  : '▼'
                : '↕';
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    active
                      ? sort?.dir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                  className={`whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted ${
                    alignClass[col.align ?? 'left']
                  } ${col.headerClassName ?? ''}`}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className="inline-flex items-center gap-1 select-none rounded text-inherit hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                    >
                      {col.header}
                      <span className="text-[0.65rem] text-ink-muted">
                        {indicator}
                      </span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-6 text-center text-ink-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedRows.map((row, index) => {
              const active = isRowActive?.(row) ?? false;
              const clickable = Boolean(onRowClick);
              return (
                <tr
                  key={getRowKey ? getRowKey(row, index) : index}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={clickable ? 0 : undefined}
                  aria-selected={clickable ? active : undefined}
                  className={`border-b border-border last:border-0 ${
                    clickable
                      ? 'cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-brand'
                      : ''
                  } ${active ? 'bg-surface' : clickable ? 'hover:bg-surface' : ''}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 align-middle ${
                        alignClass[col.align ?? 'left']
                      } ${col.cellClassName ?? ''}`}
                    >
                      {defaultCell(col, row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
