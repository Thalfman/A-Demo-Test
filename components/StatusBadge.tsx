import { statusColors } from '@/lib/tokens';
import type { ProjectStatus } from '@/lib/types';

/** Status pill colored from the design tokens. Inline styles (not Tailwind
 *  opacity utilities) are used for the translucent tint because the palette is
 *  exposed as CSS-variable hex, not raw channels. */
export function StatusBadge({ status }: { status: ProjectStatus }) {
  const color = statusColors[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        color,
        backgroundColor: `${color}1a`,
        border: `1px solid ${color}33`,
      }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {status}
    </span>
  );
}
