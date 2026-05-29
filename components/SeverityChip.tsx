import { colors, statusColors } from '@/lib/tokens';
import type { Severity } from '@/lib/types';

const SEVERITY: Record<Severity, { label: string; color: string }> = {
  high: { label: 'High', color: statusColors['Off Track'] },
  medium: { label: 'Medium', color: statusColors['At Risk'] },
  low: { label: 'Low', color: colors.inkMuted },
};

export function SeverityChip({ severity }: { severity: Severity }) {
  const { label, color } = SEVERITY[severity];
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        color,
        backgroundColor: `${color}1a`,
        border: `1px solid ${color}33`,
      }}
    >
      {label}
    </span>
  );
}
