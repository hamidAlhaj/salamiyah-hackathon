'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from '@/context/ThemeContext';

/**
 * Light/dark switch. The visible icon is chosen by CSS from the `dark` class on <html>
 * (set before paint), so it is right even before hydration.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations('theme');
  const label = theme === 'dark' ? t('toLight') : t('toDark');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      data-testid="theme-toggle"
      className="rounded-xl p-2 text-ink transition duration-150 hover:bg-surface-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Shown in light mode: a moon (switch to dark). */}
      <svg
        className="block h-5 w-5 dark:hidden"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinejoin="round" />
      </svg>
      {/* Shown in dark mode: a sun (switch to light). */}
      <svg
        className="hidden h-5 w-5 dark:block"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.5" />
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
