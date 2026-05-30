import Link from 'next/link';

import {
  getDocuments,
  getEvm,
  getMeta,
  getPortfolio,
  getReconciliation,
} from '@/lib/loaders';
import { formatRatio } from '@/lib/format';
import { normalizePortfolio } from '@/lib/normalize';

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

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-hairline bg-panel p-6 shadow-elev">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ai">
          PM / Ops AI · Proof of Concept
        </p>
        <h2 className="mt-2 text-[22px] font-semibold leading-tight">
          One synthetic portfolio. Four workflows. The AI value, made obvious.
        </h2>
        <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-ink-muted">
          A static proof of concept demonstrating AI-generated value across four
          PM/Ops workflows, driven by one synthetic portfolio of{' '}
          {meta.counts.projects} projects. Every AI output is precomputed and
          clearly labeled — wherever you see the blue analyst rail, a machine
          wrote it.
        </p>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-ink-muted">
          <span>
            seed <span className="text-ink">{meta.seed}</span>
          </span>
          <span>
            as of <span className="text-ink">{meta.generatedAt}</span>
          </span>
          <span>
            <span className="text-ink">{meta.dataQuality.flaggedFields}</span>{' '}
            data-quality flags across {meta.counts.projects} projects
          </span>
        </dl>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {meta.modules.map((module) => (
          <Link
            key={module.id}
            href={module.route}
            className="group rounded-md border border-hairline bg-panel p-5 shadow-elev transition-colors duration-state ease-instrument hover:border-ai focus:outline-none focus-visible:ring-2 focus-visible:ring-ai"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium">{module.title}</h3>
              <span
                aria-hidden
                className="text-ink-faint transition-transform duration-state group-hover:translate-x-0.5 group-hover:text-ai"
              >
                →
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{module.summary}</p>
            <p className="mt-3 font-mono text-xs text-ink-muted">
              {reads[module.id] ?? ''}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
