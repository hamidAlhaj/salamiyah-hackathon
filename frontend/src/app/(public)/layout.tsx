import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { HeaderBell } from '@/components/layout/HeaderBell';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { GENERAL_FUND_SLUG } from '@/shared';

const footerLink =
  'text-footer-muted transition-colors duration-150 hover:text-white hover:underline underline-offset-4';
const photo = 'https://commons.wikimedia.org/wiki/File:View_from_Shmemis_Castle.jpg';
const license = 'https://creativecommons.org/licenses/by-sa/3.0/';
const links = [
  { key: 'campaigns', href: '/#campaigns' },
  { key: 'transparency', href: '/transparency' },
  { key: 'fund', href: `/campaigns/${GENERAL_FUND_SLUG}` },
  { key: 'track', href: '/track' },
] as const;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [t, nav, footer] = await Promise.all([
    getTranslations('common'),
    getTranslations('nav'),
    getTranslations('footer'),
  ]);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader bell={<HeaderBell />} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="bg-footer text-footer-ink [--ring:107_207_165] print:hidden">
        <div className="mx-auto max-w-content px-4 pb-6 pt-10 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <p className="font-display text-base font-bold">{t('council')}</p>
            <nav aria-label={t('council')} className="sm:col-span-2">
              <ul className="grid grid-cols-2 gap-x-5 text-sm">
                {links.map(({ key, href }) => (
                  <li key={key}>
                    <Link href={href} className={`${footerLink} inline-flex min-h-11 items-center`}>
                      {nav(key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/15 pt-4 text-xs">
            <Link
              href="/transparency"
              className={`${footerLink} inline-flex min-h-11 items-center`}
            >
              {nav('transparency')}
            </Link>
            <p className="text-footer-muted">
              {footer.rich('photoCredit', {
                photo: (label) => (
                  <a href={photo} className={`${footerLink} underline`}>
                    {label}
                  </a>
                ),
                license: (label) => (
                  <a href={license} className={`${footerLink} underline`}>
                    {label}
                  </a>
                ),
              })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
