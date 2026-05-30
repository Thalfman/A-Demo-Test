import { AICallout } from '@/components/AICallout';
import { KpiStrip, type KpiItem } from '@/components/KpiStrip';
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

  const kpis: KpiItem[] = [
    { label: 'Discrepancies', countTo: discrepancies.length },
    {
      label: 'High severity',
      countTo: highSeverity,
      tone: highSeverity > 0 ? 'negative' : 'positive',
    },
    {
      label: 'Missing records',
      countTo: missingRecords,
      tone: missingRecords > 0 ? 'negative' : 'positive',
      hint: 'present on only one side',
    },
    {
      label: 'Duplicates',
      countTo: duplicates,
      tone: duplicates > 0 ? 'negative' : 'positive',
    },
  ];

  return (
    <div className="space-y-4">
      <AICallout artifact={aiSummary} />

      <KpiStrip items={kpis} />

      <ReconClient
        discrepancies={discrepancies}
        financeExport={financeExport}
        pmoExport={pmoExport}
      />
    </div>
  );
}
