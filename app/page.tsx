import {
  getDocuments,
  getEvm,
  getMeta,
  getPortfolio,
  getReconciliation,
} from '@/lib/loaders';
import { formatRatio } from '@/lib/format';
import { normalizePortfolio } from '@/lib/normalize';
import { getPortfolioPulse } from '@/lib/portfolioPulse';
import { LandingHero, type LandingModule } from './LandingHero';

/** One-line live readout per module, computed from the synthetic data so the
 *  home page demonstrates value rather than just linking. (Derived data, not an
 *  AI artifact — rendered in neutral mono, never the reserved AI accent.) */
function readouts(): Record<string, string> {
  const meta = getMeta();
  const { metrics } = getEvm().portfolio;
  const { projects } = normalizePortfolio(getPortfolio().projects);
  const recon = getReconciliation();
  const docs = getDocuments();

  const offTrack = projects.filter((p) => p.status === 'Off Track').length;
  const highSeverity = recon.discrepancies.filter((d) => d.severity === 'high').length;

  return {
    portfolio: `${meta.counts.projects} projects · ${offTrack} off-track`,
    evm: `CPI ${formatRatio(metrics.cpi)} ${metrics.cpi < 1 ? '▼' : '▲'} · SPI ${formatRatio(metrics.spi)}`,
    reconciliation: `${recon.discrepancies.length} discrepancies · ${highSeverity} high`,
    documents: `${docs.statusReports.length} reports · ${docs.sops.length} SOPs`,
  };
}

export default function HomePage() {
  const meta = getMeta();
  const reads = readouts();
  const pulse = getPortfolioPulse();
  const modules: LandingModule[] = meta.modules.map((m) => ({
    ...m,
    readout: reads[m.id] ?? '',
  }));

  return (
    <LandingHero
      headline="One synthetic portfolio. Four workflows. The AI value, made obvious."
      subcopy={`A static proof of concept demonstrating AI-generated value across four PM/Ops workflows, driven by one synthetic portfolio of ${meta.counts.projects} projects. Every AI output is precomputed and clearly labeled — wherever you see the blue analyst rail, a machine wrote it.`}
      meta={{
        seed: meta.seed,
        generatedAt: meta.generatedAt,
        flaggedFields: meta.dataQuality.flaggedFields,
        projects: meta.counts.projects,
      }}
      pulse={pulse}
      series={getEvm().portfolio.series}
      modules={modules}
    />
  );
}
