import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, Noto_Kufi_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { ToastViewport } from '@/components/ui/ToastViewport';
import { ThemeProvider, themeInitScript } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { dirFor, toLocale } from '@/i18n/locale';
import * as authApi from '@/lib/api/auth';
import { getSessionToken } from '@/lib/session';
import type { CurrentUser } from '@/shared';
import { StoreProvider } from '@/store/StoreProvider';
import './globals.css';

// Downloaded once at build time and self-hosted by Next.js: no request to Google at runtime.
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-sans',
});

// Display face for headlines and the wordmark only.
const kufi = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-display',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return {
    title: { default: t('title'), template: `%s · ${t('title')}` },
    description: t('description'),
  };
}

/**
 * The current user for the header (Redux). Any failure — no API, a stale token — renders the
 * page signed out; protected pages enforce the session themselves in (app)/layout.tsx.
 */
async function loadCurrentUser(): Promise<CurrentUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    return await authApi.me(token);
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = toLocale(await getLocale());
  const currentUser = await loadCurrentUser();

  return (
    // suppressHydrationWarning: the init script may add the "dark" class before hydration.
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${plexArabic.variable} ${kufi.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen">
        <NextIntlClientProvider>
          <ThemeProvider>
            <ToastProvider>
              <StoreProvider initialUser={currentUser}>{children}</StoreProvider>
              <ToastViewport />
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
