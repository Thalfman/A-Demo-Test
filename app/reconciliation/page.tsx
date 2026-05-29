import { AICallout } from '@/components/AICallout';
import { StatCard } from '@/components/StatCard';
import { getReconciliation } from '@/lib/loaders';
import { ReconClient } from './ReconClient';

export default function ReconciliationPage() {
  const { financeExport, pmoExport, discrepancies, aiSummary } =
    getReconciliation();

  const highSeverity = discrepancies.filter((d) => d.severity === 'high').length;
  const missingRecords = discrepancies.filter(
    (d) => d.type === 'missing_in_finance' || d.type === 'missing_in_pmo',
  ).length;
  const duplicates = discrepancies.filter((d) => d.type === 'duplicate').length;

  return (
    <div className="space-y-6">
      <AICallout artifact={aiSummary} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Discrepancies" value={discrepancies.length} />
        <StatCard
          label="High severity"
          value={highSeverity}
          tone={highSeverity > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          label="Missing records"
          value={missingRecords}
          tone={missingRecords > 0 ? 'negative' : 'positive'}
          hint="present on only one side"
        />
        <StatCard
          label="Duplicates"
          value={duplicates}
          tone={duplicates > 0 ? 'negative' : 'positive'}
        />
      </div>

      <ReconClient
        discrepancies={discrepancies}
        financeExport={financeExport}
        pmoExport={pmoExport}
      />
    </div>
  );
}
