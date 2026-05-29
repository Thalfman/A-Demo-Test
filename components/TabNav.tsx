'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// App-shell navigation only. Module/presentational components are built later
// by EXECUTION_PROMPT.md; this just wires the routes together.
const TABS = [
  { href: '/', label: 'Overview' },
  { href: '/portfolio', label: 'Portfolio Health' },
  { href: '/evm', label: 'EVM & Variance' },
  { href: '/reconciliation', label: 'Reconciliation' },
  { href: '/documents', label: 'Status & SOPs' },
] as const;

const strip = (p: string): string =>
  p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p;

export function TabNav() {
  const pathname = strip(usePathname() || '/');
  return (
    <nav className="mx-auto max-w-6xl px-6">
      <ul className="flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`inline-block whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'border-brand font-medium text-brand'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
