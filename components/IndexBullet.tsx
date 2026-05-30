import { formatRatio } from '@/lib/format';

/** Color a CPI/SPI-style index against the conventional EVM thresholds:
 *  >= 1.0 healthy, >= 0.9 watch, < 0.9 trouble. Uses status token classes (not
 *  literal hex) so it stays theme-aware without a client hook. */
function tone(value: number): { text: string; bar: string } {
  if (value >= 1) return { text: 'text-status-ontrack', bar: 'bg-status-ontrack' };
  if (value >= 0.9) return { text: 'text-status-atrisk', bar: 'bg-status-atrisk' };
  return { text: 'text-status-offtrack', bar: 'bg-status-offtrack' };
}

/** Horizontal bullet showing an index value relative to a target (default 1.0),
 *  with a tick marking the target line. Null-safe. */
export function IndexBullet({
  label,
  value,
  target = 1,
}: {
  label: string;
  value: number | null | undefined;
  target?: number;
}) {
  const v = value == null || Number.isNaN(value) ? null : value;
  const t = v == null ? { text: 'text-ink-faint', bar: 'bg-ink-faint' } : tone(v);
  const max = Math.max(target * 1.25, (v ?? 0) * 1.1, 1.25);
  const valuePct = v == null ? 0 : Math.min(100, Math.max(0, (v / max) * 100));
  const targetPct = Math.min(100, Math.max(0, (target / max) * 100));

  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-ink-muted">{label}</span>
        <span className={`font-mono font-semibold tabular-nums ${t.text}`}>
          {formatRatio(v)}
        </span>
      </div>
      <div className="relative mt-1 h-2 rounded-full bg-hairline">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${t.bar}`}
          style={{ width: `${valuePct}%` }}
        />
        <div
          className="absolute inset-y-[-2px] w-px bg-ink"
          style={{ left: `${targetPct}%` }}
          title={`Target ${target.toFixed(2)}`}
        />
      </div>
    </div>
  );
}
