import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { CategoryIcon } from '@/components/campaigns/CategoryIcon';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { buttonClasses } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { listStaffCampaigns } from '@/lib/api/admin-campaigns';
import { requireWorkspace } from '@/lib/auth';
import type { StaffCampaignRow } from '@/lib/types/staff';
import { formatMoney, formatNumber } from '@/shared';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('adminCampaigns');
  return { title: t('title') };
}

/** Status tabs. "paused" = published but not taking donations right now. */
const TABS = ['all', 'ACTIVE', 'paused', 'DRAFT', 'FUNDED', 'COMPLETED', 'CLOSED'] as const;
type Tab = (typeof TABS)[number];

function inTab(c: StaffCampaignRow, tab: Tab): boolean {
  if (tab === 'all') return true;
  if (tab === 'paused') return c.status === 'ACTIVE' && !c.acceptsPledges;
  return c.status === tab;
}

export default async function CampaignsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { token, allowed } = await requireWorkspace('campaigns');
  if (!allowed) return <NotForYourRole />;
  const t = await getTranslations('adminCampaigns');
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const requested = (await searchParams).status;
  const tab: Tab = TABS.find((x) => x === requested) ?? 'all';
  const all = await listStaffCampaigns(token);
  const rows = all.filter((c) => inTab(c, tab));

  return (
    <WorkspacePage
      title={t('title')}
      intro={t('intro')}
      testId="campaigns-admin-page"
      actions={
        <Link href="/dashboard/admin/campaigns/new" className={buttonClasses('primary')}>
          {t('new')}
        </Link>
      }
    >
      <Tabs
        label={t('tabsLabel')}
        className="mb-4"
        items={TABS.map((x) => ({
          href:
            x === 'all' ? '/dashboard/admin/campaigns' : `/dashboard/admin/campaigns?status=${x}`,
          label: `${t(`tabs.${x}`)} (${formatNumber(all.filter((c) => inTab(c, x)).length, locale)})`,
          current: x === tab,
        }))}
      />
      {/* relative: the visually hidden link labels stay inside the scroller (no sideways page
          scroll at 375 px). */}
      <div className="relative overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface-muted text-start text-xs text-muted">
            <tr>
              <th className="p-3 text-start font-medium">{t('table.campaign')}</th>
              <th className="p-3 text-start font-medium">{t('table.category')}</th>
              <th className="p-3 text-start font-medium">{t('table.status')}</th>
              <th className="p-3 text-start font-medium">{t('table.progress')}</th>
              <th className="p-3 text-start font-medium">{t('table.beneficiaries')}</th>
              <th className="p-3">
                <span className="sr-only">{t('manageLink')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted">
                  {t('emptyTab')}
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border" data-slug={c.slug}>
                <td className="p-3">
                  <Link
                    href={`/dashboard/admin/campaigns/${c.id}`}
                    className="font-semibold hover:text-accent"
                  >
                    {c.titleAr}
                  </Link>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1.5">
                    <CategoryIcon icon={c.category.icon} className="h-4 w-4 text-accent" />
                    {c.category.nameAr}
                  </span>
                </td>
                <td className="p-3">
                  {t(`statuses.${c.status}`)}
                  {!c.acceptsPledges && c.status === 'ACTIVE' && (
                    <span className="mt-0.5 block text-xs font-semibold text-danger">
                      {t('paused')}
                    </span>
                  )}
                </td>
                <td className="p-3 tabular-nums">
                  {formatMoney(c.verifiedAmount, c.currency, locale)}
                  <span className="text-muted">
                    {' '}
                    / {formatMoney(c.targetAmount, c.currency, locale)}
                  </span>
                </td>
                <td className="p-3 tabular-nums">{formatNumber(c._count.beneficiaries, locale)}</td>
                <td className="p-3 text-end">
                  <Link
                    href={`/dashboard/admin/campaigns/${c.id}`}
                    className={buttonClasses('secondary', 'sm')}
                    data-testid="manage-campaign"
                  >
                    {t('manageLink')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WorkspacePage>
  );
}
