import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { StarLattice } from '@/components/ui/StarLattice';
import { emailRegistrationConfig } from '@/lib/api/auth';
import { EmailRegisterForm } from './EmailRegisterForm';
import { RegisterForm } from './RegisterForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('registerTitle') };
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string }>;
}) {
  const t = await getTranslations('auth');
  const tNav = await getTranslations('nav');
  const points = t.raw('panelPoints') as string[];
  const viaEmail = (await searchParams).method === 'email';
  const emailEnabled = viaEmail
    ? (await emailRegistrationConfig().catch(() => ({ enabled: false }))).enabled
    : false;

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative isolate overflow-hidden bg-panel px-6 py-7 text-panel-ink sm:px-10 lg:flex lg:flex-col lg:justify-between lg:py-12">
        <StarLattice className="absolute inset-0 -z-10 h-full w-full" />
        <Link href="/" className="inline-flex rounded-xl text-white" aria-label={tNav('brand')}>
          <Logo size="lg" tone="onDark" />
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
          <h1 className="font-display text-3xl font-bold">{t('registerTitle')}</h1>
          <p className="mt-2 text-muted">
            {t(viaEmail ? 'emailRegisterSubtitle' : 'registerSubtitle')}
          </p>
          {viaEmail ? <EmailRegisterForm enabled={emailEnabled} /> : <RegisterForm />}
          <Link
            href={viaEmail ? '/register' : '/register?method=email'}
            className="mt-4 self-center text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            {t(viaEmail ? 'registerWithPhone' : 'registerWithEmail')}
          </Link>
          {viaEmail && (
            <Link
              href="/login"
              className="mt-3 self-center text-sm text-accent underline-offset-4 hover:underline"
            >
              {t('loginLink')}
            </Link>
          )}
          <p className="mt-8 text-sm text-muted lg:hidden">{t('donorHint')}</p>
        </div>
      </main>
    </div>
  );
}
