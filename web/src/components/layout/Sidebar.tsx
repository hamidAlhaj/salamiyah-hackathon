'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Role } from '@/shared';
import { linksFor, type WorkspaceKey } from '@/lib/workspace';

const ICONS: Record<WorkspaceKey, React.ReactNode> = {
  home: <path d="M4 11 12 4l8 7M6 10v10h12V10" />,
  donations: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  categories: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  campaigns: <path d="M5 20V5l12 4-12 4M5 13h0" />,
  newCampaign: <path d="M12 5v14M5 12h14" />,
  intake: <path d="M7 4h7l4 4v12H7zM14 4v4h4M10 13h5M10 16h5" />,
  cases: <path d="M5 6h14M5 12h14M5 18h9" />,
  finance: <path d="M4 7h16v10H4zM4 10h16M8 14h3" />,
  collector: <path d="M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 10v4M18 10v4" />,
  imports: <path d="M12 4v11M8 11l4 4 4-4M5 19h14" />,
  spending: <path d="M4 20h16M6 16V9M10 16V5M14 16v-4M18 16V8" />,
  outbox: <path d="M4 5h16v11H8l-4 4zM8 9h8M8 12h5" />,
  notifications: <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />,
  beneficiaries: (
    <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M3 20a6 6 0 0 1 12 0M16 4h5M16 8h5M17 12h4" />
  ),
  users: (
    <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M18 20a6 6 0 0 0-3-5.2" />
  ),
  collectionPoints: (
    <path d="M12 21s-6-5.4-6-11a6 6 0 1 1 12 0c0 5.6-6 11-6 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
  ),
  hospitals: <path d="M4 20V6h10v14M14 10h6v10M2 20h20M8 9v4M6 11h4M17 14v2" />,
  paymentMethods: <path d="M3 6h18v12H3zM3 10h18M7 15h4M16 15h1" />,
};

/** Role-based workspace navigation: a column on wide screens, a scrolling strip on phones. */
export function Sidebar({ role }: { role: Role }) {
  const t = useTranslations('workspace');
  const pathname = usePathname();
  const links = linksFor(role);
  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  // The longest matching link wins ("new campaign" over "campaigns").
  const active = links
    .filter((l) => isActive(l.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.key;

  return (
    <nav
      aria-label={t('label')}
      data-testid="workspace-nav"
      className="border-b border-border bg-surface lg:min-h-[calc(100vh-4rem)] lg:w-60 lg:flex-shrink-0 lg:border-b-0 lg:border-e"
    >
      <p className="hidden px-5 pb-2 pt-6 text-xs font-semibold text-muted lg:block">
        {t('label')}
      </p>
      <ul className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:overflow-visible lg:px-3 lg:py-0">
        {links.map((l, i) => {
          const on = active === l.key;
          // The ADMIN setup screens get their own heading (wide screens; phones keep one strip).
          const startsSetup =
            'section' in l && l.section === 'setup' && !(i > 0 && 'section' in links[i - 1]);
          return (
            <li key={l.key} className={startsSetup ? 'lg:mt-4' : undefined}>
              {startsSetup && (
                <p className="hidden px-2 pb-2 text-xs font-semibold text-muted lg:block">
                  {t('setup')}
                </p>
              )}
              <Link
                href={l.href}
                aria-current={on ? 'page' : undefined}
                className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition duration-150 ${
                  on
                    ? 'bg-accent-soft text-accent-strong'
                    : 'text-muted hover:bg-surface-muted hover:text-ink'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-[18px] w-[18px] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {ICONS[l.key]}
                </svg>
                {t(l.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
