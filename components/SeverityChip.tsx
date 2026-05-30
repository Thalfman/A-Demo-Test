import type { Severity } from '@/lib/types';
import { tint } from './tint';

const SEVERITY: Record<Severity, { label: string; token: string }> = {
  high: { label: 'High', token: 'var(--status-offtrack)' },
  medium: { label: 'Medium', token: 'var(--status-atrisk)' },
  low: { label: 'Low', token: 'var(--ink-muted)' },
};

export function SeverityChip({ severity }: { severity: Severity }) {
  const { label, token } = SEVERITY[severity];
  return (
    <span
      className="tint-chip inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-medium"
      style={tint(token)}
    >
      {label}
    </span>
  );
}
