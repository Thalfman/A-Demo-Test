'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type { Theme } from '@/lib/tokens';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const themeFromAttr = (attr: string | null): Theme =>
  attr === 'dark' ? 'dark' : attr === 'light' ? 'light' : 'dim';

/**
 * Owns the active theme. Dim is the server-rendered default (no attribute); the
 * pre-hydration inline script in app/layout.tsx applies `data-theme='dark'` or
 * `'light'` from localStorage before paint so CSS-variable colors never flash.
 * We initialize state to 'dim' (matching SSR) and read the real attribute in an
 * effect so React-rendered literal colors (Recharts) reconcile without a
 * hydration mismatch.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dim');

  useEffect(() => {
    setThemeState(themeFromAttr(document.documentElement.getAttribute('data-theme')));
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode / storage disabled — theme still applies for the session */
    }
    const el = document.documentElement;
    if (next === 'dim') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
