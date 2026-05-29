import { AICallout } from '@/components/AICallout';
import { Card } from '@/components/Card';
import { EvmLineChart } from '@/components/EvmLineChart';
import { StatCard, type StatTone } from '@/components/StatCard';
import { formatCurrency, formatRatio } from '@/lib/format';
import { getEvm } from '@/lib/loaders';
import { EvmExplorer } from './EvmExplorer';

const ratioTone = (v: number): StatTone =>
  v >= 1 ? 'positive' : v >= 0.95 ? 'neutral' : 'negative';

export default function EvmPage() {
  const { portfolio, projects, aiNarrative, recommendedActions } = getEvm();
  const m = portfolio.metrics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Portfolio CPI"
          value={formatRatio(m.cpi)}
          tone={ratioTone(m.cpi)}
          hint="EV / AC"
        />
        <StatCard
          label="Portfolio SPI"
          value={formatRatio(m.spi)}
          tone={ratioTone(m.spi)}
          hint="EV / PV"
        />
        <StatCard
          label="Cost Variance"
          value={formatCurrency(m.cv)}
          tone={m.cv < 0 ? 'negative' : 'positive'}
          hint="EV - AC"
        />
        <StatCard
          label="VAC"
          value={formatCurrency(m.vac)}
          tone={m.vac < 0 ? 'negative' : 'positive'}
          hint="BAC - EAC"
        />
      </div>

      <Card title="Portfolio cumulative EVM (trailing 12 months)">
        <EvmLineChart data={portfolio.series} height={300} />
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
