'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { formatRatio } from '@/lib/format';
import type { PortfolioPulse } from '@/lib/portfolioPulse';
import { NAV_ITEMS } from './nav-items';

/** The header strip renders the same pulse the landing hero shows. */
export type Pulse = PortfolioPulse;

const strip = (p: string): string =>
  p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p;

export function AppShell({
  pulse,
  children,
}: {
  pulse: Pulse;
  children: ReactNode;
}) {
  const pathname = strip(usePathname() || '/');
  const [collapsed, setCollapsed] = useState(false);
  const active =
    NAV_ITEMS.find((i) => i.href === pathname) ?? NAV_ITEMS[0];

  return (
    <div className="flex min-h-screen">
      <aside
        className={`sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-hairline bg-bg transition-[width] duration-layout ease-instrument ${
          collapsed ? 'w-14' : 'w-14 lg:w-[220px]'
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-hairline px-3">
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ai-tint font-mono text-sm font-semibold text-ai"
          >
            ▣
          </span>
          <span className={`font-semibold ${collapsed ? 'hidden' : 'hidden lg:inline'}`}>
            PM/Ops AI
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === pathname;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                title={item.label}
                className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-state ease-instrument focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ai ${
                  isActive
                    ? 'bg-panel-2 font-medium text-ai'
                    : 'text-ink-muted hover:bg-panel-2 hover:text-ink'
                }`}
              >
                <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute -left-3 h-5 w-0.5 rounded-full bg-ai"
                    />
                  ) : null}
                  <Icon className="h-4 w-4" />
                </span>
                <span className={collapsed ? 'hidden' : 'hidden lg:inline'}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="m-2 hidden h-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-state hover:bg-panel-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ai lg:flex"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={collapsed ? '' : 'rotate-180'}>
            <path d="M6 3l5 5-5 5" />
          </svg>
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-hairline bg-chrome px-4 backdrop-blur-md md:px-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
            <span className="text-ink-muted">PM/Ops AI</span>
            <span aria-hidden className="text-ink-faint">/</span>
            <span className="font-medium text-ink">{active.label}</span>
          </nav>
          <div className="ml-auto flex items-center gap-3 md:gap-5">
            <PulseStrip pulse={pulse} />
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-4 px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function PulseStrip({ pulse }: { pulse: Pulse }) {
  return (
    <div className="hidden items-center gap-3 font-mono text-xs text-ink-muted sm:flex">
      <span>
        <span className="text-ink">{pulse.projects}</span> proj
      </span>
      <Readout label="CPI" value={pulse.cpi} />
      <Readout label="SPI" value={pulse.spi} />
      <span className="rounded-sm bg-panel-2 px-1.5 py-0.5 text-status-offtrack">
        {pulse.offTrack} off-track
      </span>
    </div>
  );
}

function Readout({ label, value }: { label: string; value: number }) {
  const down = value < 1;
  return (
    <span>
      {label}{' '}
      <span className={down ? 'text-status-offtrack' : 'text-status-ontrack'}>
        {formatRatio(value)} {down ? '▼' : '▲'}
      </span>
    </span>
  );
}
