import { getDocuments, getEvm, getMeta, getReconciliation } from '@/lib/loaders';
import { formatRatio } from '@/lib/format';
import { getPortfolioPulse, type PortfolioPulse } from '@/lib/portfolioPulse';
import { LandingHero, type LandingModule } from './LandingHero';

/** One-line live readout per module, computed from the synthetic data so the
 *  home page demonstrates value rather than just linking. Off-track and the
 *  CPI/SPI come from the shared `pulse` so the cards, the hero band, and the
 *  header all agree (§16). (Derived data, not an AI artifact — rendered in
 *  neutral mono, never the reserved AI accent.) */
function readouts(pulse: PortfolioPulse): Record<string, string> {
  const meta = getMeta();
  const recon = getReconciliation();
  const docs = getDocuments();

  const highSeverity = recon.discrepancies.filter((d) => d.severity === 'high').length;

  return {
    portfolio: `${meta.counts.projects} projects · ${pulse.offTrack} off-track`,
    evm: `CPI ${formatRatio(pulse.cpi)} ${pulse.cpi < 1 ? '▼' : '▲'} · SPI ${formatRatio(pulse.spi)}`,
    reconciliation: `${recon.discrepancies.length} discrepancies · ${highSeverity} high`,
    documents: `${
      docs.statusReports.length +
      docs.sops.length +
      docs.meetingNotes.length +
      docs.decisionLogs.length
    } documents · 4 types`,
  };
}

export default function HomePage() {
  const meta = getMeta();
  const pulse = getPortfolioPulse();
  const reads = readouts(pulse);
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
