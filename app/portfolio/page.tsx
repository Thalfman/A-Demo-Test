import { getEvm, getMeta, getPortfolio } from '@/lib/loaders';
import { normalizePortfolio } from '@/lib/normalize';
import { PortfolioClient } from './PortfolioClient';

export default function PortfolioPage() {
  const { projects: raw, aiBriefing } = getPortfolio();
  const { projects, summary } = normalizePortfolio(raw);
  const { portfolio } = getEvm();
  const { divisions } = getMeta();

  return (
    <PortfolioClient
      projects={projects}
      aiBriefing={aiBriefing}
      portfolioMetrics={portfolio.metrics}
      divisions={divisions}
      flaggedFields={summary.flaggedFields}
    />
  );
}
