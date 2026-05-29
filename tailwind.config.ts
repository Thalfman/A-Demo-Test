import type { Config } from 'tailwindcss';

// Colors reference the CSS variables defined in app/globals.css (the design-token
// source of truth). lib/tokens.ts mirrors the same hex values for Recharts.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: 'var(--color-brand)',
        'brand-muted': 'var(--color-brand-muted)',
        surface: 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        border: 'var(--color-border)',
        ink: 'var(--color-ink)',
        'ink-muted': 'var(--color-ink-muted)',
        status: {
          ontrack: 'var(--color-status-ontrack)',
          atrisk: 'var(--color-status-atrisk)',
          offtrack: 'var(--color-status-offtrack)',
        },
      },
      borderRadius: {
        token: 'var(--radius)',
      },
    },
  },
  plugins: [],
};

export default config;
