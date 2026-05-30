import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';

import { ProjectDrawerProvider } from '@/components/project-drawer/ProjectDrawerContext';
import { AppShell } from '@/components/shell/AppShell';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { getPortfolioPulse } from '@/lib/portfolioPulse';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PM/Ops AI — Proof of Concept',
  description:
    'AI-generated value across project-management and operations workflows. Synthetic data; precomputed AI outputs.',
};

// Pre-hydration: apply the saved theme before first paint so CSS-variable colors
// never flash. Dim is the default (no attribute); only 'dark'/'light' are set.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-bg font-sans text-ink antialiased">
        <ThemeProvider>
          <ProjectDrawerProvider>
            <AppShell pulse={getPortfolioPulse()}>{children}</AppShell>
          </ProjectDrawerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
