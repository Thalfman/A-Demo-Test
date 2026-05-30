import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

// Colors reference the CSS variables defined in app/globals.css (the design-token
// source of truth). lib/tokens.ts mirrors the same hex values for Recharts.
// Existing color NAMES (brand/surface/border/ink/status) are retained and now
// resolve to the new "Instrument" tokens, so pre-overhaul classes keep working
// during migration; the new canonical names are added alongside.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // legacy names (retained for compile-safety; resolve to new tokens)
        brand: 'var(--color-brand)',
        'brand-muted': 'var(--color-brand-muted)',
        surface: 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        border: 'var(--color-border)',
        ink: 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        status: {
          ontrack: 'var(--status-ontrack)',
          atrisk: 'var(--status-atrisk)',
          offtrack: 'var(--status-offtrack)',
        },
        // new canonical Instrument tokens
        bg: 'var(--bg)',
        chrome: 'var(--chrome)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        hairline: 'var(--hairline)',
        'hairline-strong': 'var(--hairline-strong)',
        'ink-faint': 'var(--ink-faint)',
        ai: 'var(--ai)',
        'ai-tint': 'var(--ai-tint)',
        mismatch: 'var(--mismatch)',
        'chart-1': 'var(--chart-1)',
        'chart-2': 'var(--chart-2)',
        'chart-grid': 'var(--chart-grid)',
      },
      borderRadius: {
        token: 'var(--radius)',
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
      },
      boxShadow: {
        elev: 'var(--elev-inset)',
        pop: 'var(--shadow-pop)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
      transitionTimingFunction: {
        instrument: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      transitionDuration: {
        state: '140ms',
        layout: '200ms',
      },
    },
  },
  plugins: [],
};

export default config;
