import { statusColors } from '@/lib/tokens';
import type { DataQualityFlag } from '@/lib/types';

const ACCENT = statusColors['At Risk'];

const codeLabel = (code: string): string => code.replace(/_/g, ' ');

const cellText = (v: string | number | null): string =>
  v == null || v === '' ? '∅' : String(v);

/** Flag count for a project's data-quality issues, with a native <details>
 *  disclosure listing each flag. Uses <details> (not React state) so it works
 *  in the static export with zero client JS. */
export function DataQualityChip({ flags }: { flags: DataQualityFlag[] }) {
  if (!flags || flags.length === 0) {
    return <span className="text-xs text-ink-muted">Clean</span>;
  }

  const title = flags
    .map((f) => `${f.field}: ${codeLabel(f.code)}`)
    .join('\n');

  return (
    <details className="relative inline-block">
      <summary
        title={title}
        className="inline-flex cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium [&::-webkit-details-marker]:hidden"
        style={{
          color: ACCENT,
          backgroundColor: `${ACCENT}1a`,
          border: `1px solid ${ACCENT}33`,
        }}
      >
        {flags.length} flag{flags.length > 1 ? 's' : ''}
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-72 rounded-token border border-border bg-surface-raised p-3 text-left shadow-lg">
        <ul className="space-y-2">
          {flags.map((f, i) => (
            <li key={i} className="text-xs">
              <div>
                <span className="font-medium">{f.field}</span>
                <span className="ml-1 text-ink-muted">· {codeLabel(f.code)}</span>
              </div>
              <div className="text-ink-muted">
                <span className="line-through">{cellText(f.original)}</span>
                <span className="mx-1">→</span>
                <span>{cellText(f.normalized)}</span>
              </div>
              {f.note ? (
                <div className="italic text-ink-muted">{f.note}</div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
