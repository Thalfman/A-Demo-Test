'use client';

import Link from 'next/link';

import { HeroKpiBand, type HeroKpiItem } from '@/components/HeroKpiBand';
import { MiniEvmChart } from '@/components/MiniEvmChart';
import { formatNumber, formatRatio } from '@/lib/format';
import type { PortfolioPulse } from '@/lib/portfolioPulse';
import type { EvmSeriesPoint, ModuleInfo } from '@/lib/types';

export interface LandingModule extends ModuleInfo {
  readout: string;
}

/** The hero KPIs, derived from the same pulse the header shows (§16). Built here
 *  (client) rather than upstream so the count-up format functions never have to
 *  cross the server→client boundary. */
function heroKpis(pulse: PortfolioPulse): HeroKpiItem[] {
  // The count-up hook feeds fractional in-between values; integer KPIs round so
  // they never flicker a decimal mid-animation. Ratios keep two decimals (a CPI
  // counting up through 0.xx reads correctly).
  const int = (n: number) => formatNumber(Math.round(n));
  return [
    { label: 'Projects', value: pulse.projects, format: int },
    {
      label: 'Portfolio CPI',
      value: pulse.cpi,
      format: (n) => formatRatio(n),
      hint: 'EV / AC',
      tone: pulse.cpi >= 1 ? 'positive' : 'negative',
    },
    {
      label: 'Portfolio SPI',
      value: pulse.spi,
      format: (n) => formatRatio(n),
      hint: 'EV / PV',
      tone: pulse.spi >= 1 ? 'positive' : 'negative',
    },
    {
      label: 'Off-track',
      value: pulse.offTrack,
      format: int,
      tone: pulse.offTrack > 0 ? 'negative' : 'neutral',
    },
  ];
}

/**
 * Landing showcase cover (PRD #9). The landing route is exempt from the
 * motion-reserve rule (ADR-0002), so it earns deliberate motion the modules
 * don't: the KPI band counts up, the EVM sparkline draws in, and the four module
 * cards reveal in a brief stagger. All of it routes through reduced-motion-aware
 * primitives (`useCountUp`, `useMountOnlyAnimation`, the `.landing-reveal`
 * utility) so it resolves instantly for opted-out viewers (§5).
 */
export function LandingHero({
  headline,
  subcopy,
  meta,
  pulse,
  series,
  modules,
}: {
  headline: string;
  subcopy: string;
  meta: { seed: number; generatedAt: string; flaggedFields: number; projects: number };
  pulse: PortfolioPulse;
  series: EvmSeriesPoint[];
  modules: LandingModule[];
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-md border border-hairline bg-panel p-6 shadow-elev">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ai">
          PM / Ops AI · Proof of Concept
        </p>
        <h2 className="mt-2 max-w-[20ch] text-[26px] font-semibold leading-tight sm:text-[30px]">
          {headline}
        </h2>
        <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-ink-muted">
          {subcopy}
        </p>

        <div className="mt-5">
          <HeroKpiBand items={heroKpis(pulse)} />
        </div>

        <figure className="mt-4 rounded-md border border-hairline bg-panel-2 p-4">
          <figcaption className="mb-1 flex items-baseline justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
              Portfolio EVM · trailing 12 months
            </span>
            <span className="font-mono text-[11px] text-ink-faint">PV · EV · AC</span>
          </figcaption>
          <MiniEvmChart data={series} />
        </figure>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-ink-muted">
          <span>
            seed <span className="text-ink">{meta.seed}</span>
          </span>
          <span>
            as of <span className="text-ink">{meta.generatedAt}</span>
          </span>
          <span>
            <span className="text-ink">{meta.flaggedFields}</span> data-quality
            flags across {meta.projects} projects
          </span>
        </dl>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {modules.map((module, i) => (
          <Link
            key={module.id}
            href={module.route}
            style={{ animationDelay: `${i * 90}ms` }}
            className="landing-reveal group rounded-md border border-hairline bg-panel p-5 shadow-elev transition-colors duration-state ease-instrument hover:border-ai focus:outline-none focus-visible:ring-2 focus-visible:ring-ai"
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
            <p className="mt-3 font-mono text-xs text-ink-muted">{module.readout}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
