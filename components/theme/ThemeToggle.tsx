'use client';

import type { Theme } from '@/lib/tokens';
import { useTheme } from './ThemeProvider';

const OPTIONS: { value: Theme; label: string; icon: () => JSX.Element }[] = [
  { value: 'dark', label: 'Dark theme', icon: MoonIcon },
  { value: 'dim', label: 'Dim theme', icon: DimIcon },
  { value: 'light', label: 'Light theme', icon: SunIcon },
];

/** Three-way theme switch: Dark · Dim · Light. Lives in the top bar. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex items-center gap-0.5 rounded-full border border-hairline bg-panel-2 p-0.5"
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-pressed={active}
            aria-label={opt.label}
            title={opt.label}
            className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-state ease-instrument focus:outline-none focus-visible:ring-2 focus-visible:ring-ai ${
              active ? 'bg-bg text-ai' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="8" r="3" />
      <path strokeLinecap="round" d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1M12.95 3.05l-1.06 1.06M4.11 11.89l-1.06 1.06M12.95 12.95l-1.06-1.06M4.11 4.11L3.05 3.05" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
      <path d="M6.2 1.6a6.4 6.4 0 108.2 8.2A5 5 0 016.2 1.6z" />
    </svg>
  );
}

function DimIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="8" r="5.2" />
      <path fill="currentColor" stroke="none" d="M8 2.8a5.2 5.2 0 010 10.4z" />
    </svg>
  );
}
