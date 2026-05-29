import { colors, statusColors } from '@/lib/tokens';
import { formatRatio } from '@/lib/format';

/** Color a CPI/SPI-style index against the conventional EVM thresholds:
 *  >= 1.0 healthy, >= 0.9 watch, < 0.9 trouble. */
function indexColor(value: number): string {
  if (value >= 1) return statusColors['On Track'];
  if (value >= 0.9) return statusColors['At Risk'];
  return statusColors['Off Track'];
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
  const color = v == null ? colors.inkMuted : indexColor(v);
  const max = Math.max(target * 1.25, (v ?? 0) * 1.1, 1.25);
  const valuePct = v == null ? 0 : Math.min(100, Math.max(0, (v / max) * 100));
  const targetPct = Math.min(100, Math.max(0, (target / max) * 100));

  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-ink-muted">{label}</span>
        <span className="font-semibold tabular-nums" style={{ color }}>
          {formatRatio(v)}
        </span>
      </div>
      <div className="relative mt-1 h-2 rounded-full bg-border">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${valuePct}%`, backgroundColor: color }}
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
