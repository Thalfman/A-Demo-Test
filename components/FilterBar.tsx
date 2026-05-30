'use client';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
  /** Label for the "no filter" option (defaults to "All"). */
  allLabel?: string;
}

/** Row of labeled <select> filters. The empty string ('') is the "all" value.
 *  Stateless — the parent owns `values` and reacts to `onChange`. */
export function FilterBar({
  filters,
  values,
  onChange,
}: {
  filters: FilterDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {filters.map((filter) => (
        <label key={filter.key} className="flex flex-col gap-1 text-[11px]">
          <span className="font-medium uppercase tracking-[0.08em] text-ink-muted">
            {filter.label}
          </span>
          <select
            value={values[filter.key] ?? ''}
            onChange={(e) => onChange(filter.key, e.target.value)}
            className="min-w-[9rem] rounded-sm border border-hairline bg-panel px-2 py-1.5 text-sm text-ink transition-colors duration-state focus:border-ai focus:outline-none focus-visible:ring-2 focus-visible:ring-ai"
          >
            <option value="">{filter.allLabel ?? 'All'}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
