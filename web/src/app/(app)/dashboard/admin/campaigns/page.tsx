import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { CategoryIcon } from '@/components/campaigns/CategoryIcon';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { buttonClasses } from '@/components/ui/Button';
import { listStaffCampaigns } from '@/lib/api/admin-campaigns';
import { requireWorkspace } from '@/lib/auth';
import { formatMoney, formatNumber } from '@/shared';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('adminCampaigns');
  return { title: t('title') };
}

export default async function CampaignsAdminPage() {
  const { token, allowed } = await requireWorkspace('campaigns');
  if (!allowed) return <NotForYourRole />;
  const t = await getTranslations('adminCampaigns');
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const rows = await listStaffCampaigns(token);

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
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-muted text-start text-xs text-muted">
            <tr>
              <th className="p-3 text-start font-medium">{t('table.campaign')}</th>
              <th className="p-3 text-start font-medium">{t('table.category')}</th>
              <th className="p-3 text-start font-medium">{t('table.status')}</th>
              <th className="p-3 text-start font-medium">{t('table.progress')}</th>
              <th className="p-3 text-start font-medium">{t('table.beneficiaries')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border" data-slug={c.slug}>
                <td className="p-3">
                  <Link href={`/campaigns/${c.slug}`} className="font-semibold hover:text-accent">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WorkspacePage>
  );
}
