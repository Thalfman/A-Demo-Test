'use client';

export interface SegmentOption {
  value: string;
  label: string;
}

/** Accessible radiogroup segmented control. Used for the portfolio status
 *  filter, the documents type filter, and as the basis of the theme toggle. */
export function SegmentedControl({
  options,
  value,
  onChange,
  ariaLabel,
  allOption,
}: {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  /** Optional leading "all" segment (empty string is the conventional value). */
  allOption?: SegmentOption;
}) {
  const items = allOption ? [allOption, ...options] : options;
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-md border border-hairline bg-panel-2 p-0.5"
    >
      {items.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium transition-colors duration-state ease-instrument focus:outline-none focus-visible:ring-2 focus-visible:ring-ai ${
              active
                ? 'bg-panel text-ink shadow-elev'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
