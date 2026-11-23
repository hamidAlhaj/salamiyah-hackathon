import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { GoogleNotice, GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { StarLattice } from '@/components/ui/StarLattice';
import * as authApi from '@/lib/api/auth';
import { isGoogleLoginNotice, showGoogleButton } from '@/lib/google-signin';
import { safeNextPath } from '@/lib/next-path';
import type { GoogleSignInConfig } from '@/shared';
import { LoginForm } from './LoginForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('title') };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; google?: string | string[] }>;
}) {
  const { next, google } = await searchParams;
  const t = await getTranslations('auth');
  const points = t.raw('panelPoints') as string[];
  const safeNext = typeof next === 'string' ? safeNextPath(next) : undefined;
  // Sign in with Google appears only when backend/.env configures it (and on the callback host).
  const [config, host] = await Promise.all([
    authApi.googleConfig().catch((): GoogleSignInConfig | null => null),
    headers().then((h) => h.get('host')),
  ]);
  const withGoogle = showGoogleButton(config, host);

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel: compact band on phones, full height beside the form on wide screens. */}
      <aside className="relative isolate overflow-hidden bg-panel px-6 py-7 text-panel-ink sm:px-10 lg:flex lg:flex-col lg:justify-between lg:py-12">
        <StarLattice className="absolute inset-0 -z-10 h-full w-full" />
        <Link href="/" className="inline-flex rounded-xl text-white">
          <Logo size="lg" />
        </Link>
        <div className="mt-6 hidden max-w-md lg:block">
          <h2 className="font-display text-3xl font-bold leading-snug text-white">
            {t('panelTitle')}
          </h2>
          <p className="mt-4 text-panel-ink/85">{t('panelBody')}</p>
          <ul className="mt-8 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm text-white">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-brand-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-6 hidden text-sm text-panel-ink/70 lg:block">{t('donorHint')}</p>
      </aside>

      <main id="main" className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex justify-end gap-1">
          <LanguageSwitch />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-muted">{t('subtitle')}</p>
          {isGoogleLoginNotice(google) && <GoogleNotice notice={google} />}
          <LoginForm next={safeNext} />
          {withGoogle && <GoogleSignIn next={safeNext} />}
          <p className="mt-8 text-sm text-muted lg:hidden">{t('donorHint')}</p>
        </div>
      </main>
    </div>
  );
}
