'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { logoutAction } from '@/lib/actions/auth';
import { useAppSelector } from '@/store/hooks';
import { buttonClasses } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitch } from './LanguageSwitch';
import { ThemeToggle } from './ThemeToggle';

/** One header for every page. The signed-in user comes from Redux (hydrated by the root layout). */
export function SiteHeader() {
  const t = useTranslations('nav');
  const tRoles = useTranslations('roles');
  const user = useAppSelector((state) => state.currentUser.user);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
      >
        {t('skip')}
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link href="/" className="rounded-xl text-ink" aria-label={t('brand')}>
          {/* Phones show only the mark; the link keeps the brand name as its accessible name. */}
          <Logo wordmarkClassName="hidden sm:inline" />
        </Link>

        <nav aria-label={t('main')} className="ms-4 hidden items-center gap-1 md:flex">
          <Link
            href="/#cases"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-muted hover:text-ink"
          >
            {t('campaigns')}
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-muted hover:text-ink"
            >
              {t('dashboard')}
            </Link>
          )}
        </nav>

        <div className="ms-auto flex items-center gap-1">
          <LanguageSwitch />
          <ThemeToggle />
          {user ? (
            <div className="ms-1 flex items-center gap-3 border-s border-border ps-2 sm:ms-2 sm:ps-3">
              <div className="hidden text-end leading-tight sm:block">
                <p className="text-sm font-semibold" data-testid="header-user-name">
                  {user.fullName}
                </p>
                <p className="text-xs text-muted" data-testid="header-user-role">
                  {tRoles(user.role)}
                </p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className={buttonClasses('secondary', 'sm', 'whitespace-nowrap')}
                  data-testid="logout"
                >
                  {t('logout')}
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className={buttonClasses('primary', 'sm', 'ms-1 whitespace-nowrap sm:ms-2')}
            >
              {t('login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
