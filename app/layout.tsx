import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { TabNav } from '@/components/TabNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'PM/Ops AI — Proof of Concept',
  description:
    'AI-generated value across project-management and operations workflows. Synthetic data; precomputed AI outputs.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-ink antialiased">
        <header className="border-b border-border bg-surface-raised">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <h1 className="text-lg font-semibold">PM/Ops AI — Proof of Concept</h1>
            <p className="text-sm text-ink-muted">
              Synthetic portfolio · precomputed AI outputs · static demo
            </p>
          </div>
          <TabNav />
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
