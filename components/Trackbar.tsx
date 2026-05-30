import { formatPercent } from '@/lib/format';

/** A thin inline progress track that sits BEHIND a right-aligned mono percent,
 *  keeping the "% complete" column to a single cell width. Null-safe. */
export function Trackbar({ value }: { value: number | null | undefined }) {
  const v =
    value == null || Number.isNaN(value)
      ? null
      : Math.min(1, Math.max(0, value));
  const pct = v == null ? 0 : v * 100;
  return (
    <span className="relative ml-auto inline-flex h-5 w-[6.5rem] items-center justify-end overflow-hidden rounded-sm bg-panel-2">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-hairline-strong"
        style={{ width: `${pct}%` }}
      />
      <span className="relative px-1.5 font-mono text-[13px] text-ink">
        {formatPercent(v)}
      </span>
    </span>
  );
}
