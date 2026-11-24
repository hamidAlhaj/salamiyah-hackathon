import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { CategoryIcon } from '@/components/campaigns/CategoryIcon';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { listAllCampaigns } from '@/lib/api/campaigns';
import { requireWorkspace } from '@/lib/auth';
import { formatMoney } from '@/shared';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('spending');
  return { title: t('title') };
}

/** Every public campaign with its balance: verified, spent and what is left to spend. */
export default async function SpendingListPage() {
  const { allowed } = await requireWorkspace('spending');
  if (!allowed) return <NotForYourRole />;
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const [campaigns, t, tc] = await Promise.all([
    listAllCampaigns(locale),
    getTranslations('spending'),
    getTranslations('campaign'),
  ]);

  return (
    <WorkspacePage title={t('title')} intro={t('intro')} testId="spending-list">
      <ul className="grid gap-3 md:grid-cols-2">
        {campaigns.map((c) => {
          const remaining = Number(c.verifiedAmount) - Number(c.spentAmount);
          const m = (v: string | number) => formatMoney(v, c.currency, locale);
          return (
            <li key={c.id}>
              <Link
                href={`/dashboard/spending/${c.id}`}
                className="block h-full rounded-2xl border border-border bg-surface p-5 shadow-card transition hover:border-brand-600"
                data-slug={c.slug}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold leading-snug">{c.title}</p>
                  {c.status === 'COMPLETED' && (
                    <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-strong">
                      {tc('completed')}
                    </span>
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <CategoryIcon icon={c.category.icon} className="h-3.5 w-3.5" />
                  {c.category.name}
                </p>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-surface-muted px-2 py-2">
                    <dt className="text-muted">{tc('verified')}</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{m(c.verifiedAmount)}</dd>
                  </div>
                  <div className="rounded-xl bg-surface-muted px-2 py-2">
                    <dt className="text-muted">{tc('spent')}</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{m(c.spentAmount)}</dd>
                  </div>
                  <div className="rounded-xl bg-accent-soft px-2 py-2">
                    <dt className="text-accent-strong">{tc('remaining')}</dt>
                    <dd className="mt-0.5 font-bold tabular-nums text-accent-strong">
                      {m(remaining)}
                    </dd>
                  </div>
                </dl>
              </Link>
            </li>
          );
        })}
      </ul>
    </WorkspacePage>
  );
}
