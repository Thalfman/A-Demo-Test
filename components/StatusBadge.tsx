import type { ProjectStatus } from '@/lib/types';
import { tint } from './tint';

const TINT: Record<ProjectStatus, string> = {
  'On Track': 'var(--status-ontrack)',
  'At Risk': 'var(--status-atrisk)',
  'Off Track': 'var(--status-offtrack)',
};

/** Status pill. Color comes from the status token via the `.tint-chip` color-mix,
 *  so it is theme-aware with no inline hex. Crisp corners; only the dot is round. */
export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className="tint-chip inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-medium"
      style={tint(TINT[status])}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: 'var(--tint)' }}
      />
      {status}
    </span>
  );
}
