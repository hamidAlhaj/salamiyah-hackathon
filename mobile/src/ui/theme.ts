import { useColorScheme } from 'react-native';

/**
 * Exact web design tokens from frontend/src/app/globals.css and tailwind.config.ts, adapted to React
 * Native colours. Light and dark follow the phone's setting; `give` is reserved for donations and
 * funding progress.
 */
export interface Palette {
  page: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  track: string;
  control: string;
  ink: string;
  muted: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  panel: string;
  panelInk: string;
  /** Donate button and the verified funding segment. */
  give: string;
  giveInk: string;
  /** Received, pending verification. */
  givePending: string;
  /** Simulated «Demo» money (stripes on the web). */
  demo: string;
  /** Transparency chart series (web --series-spent): money spent. Remaining uses `give`. */
  seriesSpent: string;
  /** Cover illustration shades (web CampaignCover). */
  coverSky: string;
  coverInk: string;
  coverMid: string;
  coverSoft: string;
}

const light: Palette = {
  page: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#EBF2EE',
  border: '#E3EAE5',
  track: '#DDE7E1',
  control: '#6E8278',
  ink: '#182420',
  muted: '#4A5A54',
  accent: '#0F6B2F',
  accentStrong: '#0B5224',
  accentSoft: '#E6F2EC',
  danger: '#a3271c',
  dangerSoft: '#f5ded6',
  warning: '#85460b',
  warningSoft: '#f4e3c1',
  panel: '#0B3D2A',
  panelInk: '#E6F2EC',
  give: '#B45512',
  giveInk: '#FFFFFF',
  givePending: '#FED7AA',
  demo: '#9aa59f',
  seriesSpent: '#0F6B2F',
  coverSky: '#dceee5',
  coverInk: '#135b3c',
  coverMid: '#1f8a5b',
  coverSoft: '#acd9c5',
};

const dark: Palette = {
  page: '#0e1512',
  surface: '#16201b',
  surfaceMuted: '#111a16',
  border: '#2c3a33',
  track: '#3a4a42',
  control: '#71837a',
  ink: '#ecf2ee',
  muted: '#a0b0a7',
  accent: '#6BCFA5',
  accentStrong: '#ACD9C5',
  accentSoft: '#163628',
  danger: '#fca5a5',
  dangerSoft: '#3d1b19',
  warning: '#fcd34d',
  warningSoft: '#3d2d10',
  panel: '#0a291d',
  panelInk: '#d6ece1',
  give: '#F6A34A',
  giveInk: '#1a0f05',
  givePending: '#8F4211',
  demo: '#5d6b64',
  seriesSpent: '#6BCFA5',
  coverSky: '#163628',
  coverInk: '#79bf9f',
  coverMid: '#1f8a5b',
  coverSoft: '#114a32',
};

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Font family names registered in the root layout (expo-font + @expo-google-fonts). */
export const fonts = {
  body: 'IBMPlexSansArabic_400Regular',
  bodyMedium: 'IBMPlexSansArabic_500Medium',
  bodyBold: 'IBMPlexSansArabic_700Bold',
  display: 'NotoKufiArabic_700Bold',
} as const;

/** Arabic text never goes below 13px (CLAUDE.md UI rules). */
export const type = {
  xs: 13,
  sm: 15,
  base: 16,
  lg: 18,
  xl: 21,
  xxl: 25,
} as const;

export const radius = { sm: 10, md: 14, lg: 18, pill: 999 } as const;
