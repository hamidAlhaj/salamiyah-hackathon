'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// b4f contract (`useTheme()` → { theme, toggleTheme }) with Sanad's no-flash init script and
// cross-fade. A visitor who never chose follows the device setting.

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'majlis-fund-theme';
const SWITCH_CLASS = 'theme-switching';

/**
 * Runs in <head> before the body is parsed, so the first paint already has the right theme.
 * Kept as a plain string because it must run before React hydrates.
 */
export const themeInitScript = `(function(){var d=document.documentElement,k=false;try{var s=localStorage.getItem("${STORAGE_KEY}");k=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches}catch(e){}d.classList.toggle("dark",k)})();`;

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // Adopt what the init script applied.
  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    const root = document.documentElement;
    root.classList.add(SWITCH_CLASS);
    window.setTimeout(() => root.classList.remove(SWITCH_CLASS), 300);
    root.classList.toggle('dark', next === 'dark');
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this visit.
    }
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
