import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { listCases } from '@/lib/api/staff-cases';
import { requireWorkspace } from '@/lib/auth';
import { formatMoney } from '@/shared';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cases');
  return { title: t('title') };
}

/** Cases, overdue first (SLA). Staff-only: shows private beneficiary names. */
export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token, allowed } = await requireWorkspace('cases');
  if (!allowed) return <NotForYourRole />;
  const overdue = (await searchParams).overdue === '1';
  const t = await getTranslations('cases');
  const tPriority = await getTranslations('priority');
  const tCategory = await getTranslations('category');
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const rows = await listCases(token, { overdue });
  // Shown on the "overdue only" tab while the full list is open.
  const overdueCount = rows.filter((r) => r.isOverdue).length;
  const chip = 'rounded-full border px-4 py-1.5 text-sm font-medium';

  return (
    <WorkspacePage
      title={t('title')}
      testId="cases-page"
      actions={
        <nav className="flex gap-2" aria-label={t('status')}>
          <Link
            href="/dashboard/cases"
            aria-current={!overdue ? 'page' : undefined}
            className={`${chip} ${!overdue ? 'border-brand-700 bg-brand-700 text-white dark:bg-brand-600' : 'border-border bg-surface'}`}
          >
            {t('filterAll')}
          </Link>
          <Link
            href="/dashboard/cases?overdue=1"
            aria-current={overdue ? 'page' : undefined}
            className={`${chip} ${overdue ? 'border-danger bg-danger-soft text-danger' : 'border-border bg-surface'}`}
          >
            {overdue ? t('filterOverdue') : t('filterOverdueCount', { count: overdueCount })}
          </Link>
        </nav>
      }
    >
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
          {t('emptyList')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
          <table className="w-full min-w-[720px] text-sm" data-testid="cases-table">
            <thead className="bg-surface-muted text-xs text-muted">
              <tr>
                <th className="p-3 text-start font-medium">{t('tracking')}</th>
                <th className="p-3 text-start font-medium">{t('beneficiary')}</th>
                <th className="p-3 text-start font-medium">{t('status')}</th>
                <th className="p-3 text-start font-medium">{t('priority')}</th>
                <th className="p-3 text-start font-medium">{t('requested')}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className={`border-t border-border ${c.isOverdue ? 'bg-danger-soft/40' : ''}`}
                  data-tracking={c.trackingNo}
                >
                  <td className="p-3 font-semibold" dir="ltr">
                    {c.trackingNo}
                    <span className="block text-xs font-normal text-muted">
                      {tCategory(c.category)}
                    </span>
                  </td>
                  <td className="p-3">
                    {c.beneficiaryName}
                    <span className="block text-xs text-muted">{c.localCouncil}</span>
                  </td>
                  <td className="p-3">
                    {t(`statuses.${c.status}`)}
                    {c.isOverdue && (
                      <span className="ms-2 rounded bg-danger-soft px-1.5 text-xs font-semibold text-danger">
                        {t('overdue')}
                      </span>
                    )}
                    {c.campaign && !c.campaign.acceptsPledges && (
                      <span className="block text-xs font-semibold text-danger">
                        {t('pledgesPaused')}
                      </span>
                    )}
                  </td>
                  <td className="p-3">{c.priority ? tPriority(c.priority) : '—'}</td>
                  <td className="p-3 tabular-nums">
                    {formatMoney(c.approvedAmount ?? c.requestedAmount, c.currency, locale)}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/dashboard/cases/${c.id}`}
                      className="font-semibold text-accent hover:underline"
                    >
                      {t('open')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WorkspacePage>
  );
}
