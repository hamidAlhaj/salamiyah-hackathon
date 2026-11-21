import type { Config } from 'tailwindcss';

/** A colour backed by a CSS variable holding "R G B", so opacity modifiers (bg-surface/80) still work. */
const cssVar = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

/**
 * Majlis Fund design tokens (adopted from the Sanad theme, rebranded). Pages use these names,
 * never literal palette colours for neutrals. Per-theme values live in src/app/globals.css.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Salamiyah green: trust and the council. Primary actions, links, active states.
        brand: {
          50: '#eef7f3',
          100: '#d5ece2',
          200: '#acd9c5',
          300: '#79bf9f',
          400: '#46a27a',
          500: '#1f8a5b',
          600: '#18734b',
          700: '#135b3c',
          800: '#114a32',
          900: '#0f3d2a',
          950: '#072318',
        },
        // Harvest saffron: giving. ONLY donate actions and progress toward a funding goal.
        give: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#f6a34a',
          500: '#ef8a2b',
          600: '#d96f1a',
          700: '#b45512',
          800: '#8f4211',
          900: '#733712',
        },
        page: cssVar('--page'),
        surface: { DEFAULT: cssVar('--surface'), muted: cssVar('--surface-muted') },
        border: cssVar('--border'),
        track: cssVar('--track'),
        control: cssVar('--control'),
        ink: cssVar('--text'),
        muted: cssVar('--text-muted'),
        ring: cssVar('--ring'),
        accent: {
          DEFAULT: cssVar('--accent'),
          strong: cssVar('--accent-strong'),
          soft: cssVar('--accent-soft'),
        },
        danger: {
          DEFAULT: cssVar('--danger'),
          soft: cssVar('--danger-soft'),
          line: cssVar('--danger-line'),
        },
        warning: {
          DEFAULT: cssVar('--warning'),
          soft: cssVar('--warning-soft'),
          line: cssVar('--warning-line'),
        },
        info: { DEFAULT: cssVar('--info'), soft: cssVar('--info-soft') },
        // The deep green of the brand panel and the logo tile (same in both themes).
        panel: { DEFAULT: cssVar('--panel'), ink: cssVar('--panel-ink') },
      },
      borderColor: { DEFAULT: cssVar('--border') },
      fontFamily: {
        // IBM Plex Sans Arabic (next/font, self-hosted) covers Arabic and Latin body text.
        sans: ['var(--font-sans)', 'Tahoma', 'Arial', 'sans-serif'],
        // Noto Kufi Arabic: headlines and the wordmark only.
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
      },
      // Arabic reads smaller than Latin at the same size: no Arabic text below 13px,
      // body at 16px / 1.75, headings around 1.3.
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.6' }],
        sm: ['0.9375rem', { lineHeight: '1.7' }],
        base: ['1rem', { lineHeight: '1.75' }],
        lg: ['1.125rem', { lineHeight: '1.7' }],
        xl: ['1.25rem', { lineHeight: '1.5' }],
        '2xl': ['1.5rem', { lineHeight: '1.4' }],
        '3xl': ['1.875rem', { lineHeight: '1.35' }],
        '4xl': ['2.25rem', { lineHeight: '1.3' }],
        '5xl': ['3rem', { lineHeight: '1.25' }],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        grow: { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
      },
      animation: {
        rise: 'rise 350ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        grow: 'grow 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
