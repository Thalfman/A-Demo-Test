'use client';

export interface LegendSeries {
  key: string;
  name: string;
  color: string;
  /** Render the swatch as a dashed rule (matches the AC curve). */
  dashed?: boolean;
}

/**
 * Clickable chart legend. Each entry toggles its series' visibility via local
 * chart state (PRD #9 §8) so a viewer can isolate a single curve. Hidden entries
 * dim and strike through; the focus ring uses the reserved AI accent (the one
 * place outside the artifact layer it is allowed). Swatches take each series'
 * own token — never the accent — preserving the single-accent rule.
 */
export function ChartLegend({
  series,
  hidden,
  onToggle,
}: {
  series: LegendSeries[];
  hidden: ReadonlySet<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
      {series.map((s) => {
        const off = hidden.has(s.key);
        return (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => onToggle(s.key)}
              aria-pressed={!off}
              className={`flex items-center gap-1.5 rounded-sm px-1 py-0.5 font-mono text-[11px] transition-colors duration-state ease-instrument focus:outline-none focus-visible:ring-2 focus-visible:ring-ai ${
                off ? 'text-ink-faint line-through' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span
                aria-hidden
                className="inline-block h-2 w-3"
                style={{
                  backgroundColor: s.dashed ? 'transparent' : s.color,
                  borderTop: s.dashed ? `2px dashed ${s.color}` : undefined,
                  borderRadius: s.dashed ? 0 : 2,
                  opacity: off ? 0.4 : 1,
                }}
              />
              {s.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
