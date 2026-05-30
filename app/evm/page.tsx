import { AICallout } from '@/components/AICallout';
import { Card } from '@/components/Card';
import { EvmLineChart } from '@/components/EvmLineChart';
import { KpiStrip, type KpiItem, type KpiTone } from '@/components/KpiStrip';
import { formatCurrency, formatRatio } from '@/lib/format';
import { getEvm } from '@/lib/loaders';
import { EvmExplorer } from './EvmExplorer';

const ratioTone = (v: number): KpiTone =>
  v >= 1 ? 'positive' : v >= 0.95 ? 'neutral' : 'negative';

export default function EvmPage() {
  const { portfolio, projects, aiNarrative, recommendedActions } = getEvm();
  const m = portfolio.metrics;

  const kpis: KpiItem[] = [
    { label: 'Portfolio CPI', value: formatRatio(m.cpi), tone: ratioTone(m.cpi), hint: 'EV / AC' },
    { label: 'Portfolio SPI', value: formatRatio(m.spi), tone: ratioTone(m.spi), hint: 'EV / PV' },
    {
      label: 'Cost Variance',
      value: formatCurrency(m.cv),
      tone: m.cv < 0 ? 'negative' : 'positive',
      hint: 'EV - AC',
    },
    {
      label: 'VAC',
      value: formatCurrency(m.vac),
      tone: m.vac < 0 ? 'negative' : 'positive',
      hint: 'BAC - EAC',
    },
  ];

  return (
    <div className="space-y-4">
      <KpiStrip items={kpis} />

      <Card title="Portfolio cumulative EVM (trailing 12 months)">
        <EvmLineChart data={portfolio.series} height={360} />
      </Card>

      <AICallout artifact={aiNarrative} />

      <EvmExplorer
        projects={projects}
        actions={recommendedActions}
        generatedAt={aiNarrative.generatedAt}
      />
    </div>
  );
}
