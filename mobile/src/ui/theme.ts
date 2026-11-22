import { useColorScheme } from 'react-native';

/**
 * The web design tokens (web/src/app/globals.css + tailwind.config.ts) as React Native colours:
 * Salamiyah green for the brand, saffron (`give`) only for donate actions and funding progress.
 * Light and dark follow the phone's setting.
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
  /** Cover illustration shades (web CampaignCover). */
  coverSky: string;
  coverInk: string;
  coverMid: string;
  coverSoft: string;
}

const light: Palette = {
  page: '#eef2ef',
  surface: '#f9fbf9',
  surfaceMuted: '#e4eae5',
  border: '#d3dcd5',
  track: '#cbd5cd',
  control: '#7b8a80',
  ink: '#16231d',
  muted: '#4f5f56',
  accent: '#135b3c',
  accentStrong: '#114a32',
  accentSoft: '#dceee5',
  danger: '#a3271c',
  dangerSoft: '#f5ded6',
  warning: '#85460b',
  warningSoft: '#f4e3c1',
  panel: '#0f3d2a',
  panelInk: '#e4f2eb',
  give: '#d96f1a',
  giveInk: '#ffffff',
  givePending: '#fdba74',
  demo: '#9aa59f',
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
  accent: '#79bf9f',
  accentStrong: '#acd9c5',
  accentSoft: '#163628',
  danger: '#fca5a5',
  dangerSoft: '#3d1b19',
  warning: '#fcd34d',
  warningSoft: '#3d2d10',
  panel: '#0a291d',
  panelInk: '#d6ece1',
  give: '#ef8a2b',
  giveInk: '#1a0f05',
  givePending: '#b45512',
  demo: '#5d6b64',
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
