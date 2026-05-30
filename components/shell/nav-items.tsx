import type { ComponentType } from 'react';

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

// Single source of truth for the app's routes — consumed by the rail nav and
// the top-bar breadcrumb. (Replaces the old TabNav TABS array.)
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Overview', icon: GridIcon },
  { href: '/portfolio', label: 'Portfolio Health', icon: BarsIcon },
  { href: '/evm', label: 'EVM & Variance', icon: TrendIcon },
  { href: '/reconciliation', label: 'Reconciliation', icon: SwapIcon },
  { href: '/documents', label: 'Status & SOPs', icon: DocIcon },
];

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  );
}

function BarsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 13V7M8 13V3M13 13V9" />
    </svg>
  );
}

function TrendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 11l3.5-4 3 2.5L14 4" />
      <path d="M14 7V4h-3" />
    </svg>
  );
}

function SwapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h9l-2.5-2.5M13 11H4l2.5 2.5" />
    </svg>
  );
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2h5l3 3v9H4z" />
      <path d="M9 2v3h3M6 8.5h4M6 11h4" />
    </svg>
  );
}
