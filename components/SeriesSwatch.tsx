/**
 * The series color chip shared by the chart legend and the chart tooltip, so a
 * curve looks the same in both: a solid block, or a dashed rule for dashed
 * series (e.g. the AC curve). Colors come from each series' own token — never
 * the reserved AI accent. `dimmed` fades a toggled-off legend entry.
 */
export function SeriesSwatch({
  color,
  dashed = false,
  dimmed = false,
}: {
  color: string;
  dashed?: boolean;
  dimmed?: boolean;
}) {
  return (
    <span
      aria-hidden
      className="inline-block h-2 w-3 shrink-0"
      style={{
        backgroundColor: dashed ? 'transparent' : color,
        borderTop: dashed ? `2px dashed ${color}` : undefined,
        borderRadius: dashed ? 0 : 2,
        opacity: dimmed ? 0.4 : 1,
      }}
    />
  );
}
