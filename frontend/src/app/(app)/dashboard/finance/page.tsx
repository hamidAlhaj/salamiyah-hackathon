import type { Metadata } from 'next';
import Link from 'next/link';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { listVerifications } from '@/lib/api/verifications';
import { requireWorkspace } from '@/lib/auth';
import { DATE_TIME_SHORT } from '@/lib/format';
import type { VerificationItem, VerificationStatusTab } from '@/lib/types/staff';
import { formatMoney } from '@/shared';
import { FinanceActions } from './FinanceActions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('finance');
  return { title: t('title') };
}

const TABS: VerificationStatusTab[] = ['PENDING', 'APPROVED', 'REJECTED'];

type Props = { searchParams: Promise<{ status?: string }> };

/** Where the money came from, as finance reads it. */
function channelKey(v: VerificationItem): 'transfer' | 'point' | 'box' | 'council' {
  if (v.pledge.channel === 'COUNCIL') return 'council';
  if (v.pledge.channel === 'COLLECTOR') return 'box';
  return v.pledge.method === 'CASH' ? 'point' : 'transfer';
}

/**
 * FR-15: the finance verification queue by status. Pending entries (oldest first) show the receipt
 * or where the cash was handed over; approving issues the official receipt for named donations.
 */
export default async function FinancePage({ searchParams }: Props) {
  const { token, allowed } = await requireWorkspace('finance');
  if (!allowed) return <NotForYourRole />;
  const sp = await searchParams;
  const status: VerificationStatusTab = TABS.includes(sp.status as VerificationStatusTab)
    ? (sp.status as VerificationStatusTab)
    : 'PENDING';
  const [items, t, format, locale] = await Promise.all([
    listVerifications(token, status),
    getTranslations('finance'),
    getFormatter(),
    getLocale(),
  ]);
  const lang = locale === 'en' ? 'en' : 'ar';

  return (
    <WorkspacePage title={t('title')} intro={t('intro')} testId="finance-page">
      <nav aria-label={t('tabsLabel')} className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((s) => (
          <Link
            key={s}
            href={s === 'PENDING' ? '/dashboard/finance' : `/dashboard/finance?status=${s}`}
            aria-current={s === status ? 'page' : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              s === status
                ? 'bg-brand-600 text-white dark:bg-brand-600'
                : 'bg-surface-muted text-muted hover:text-ink'
            }`}
            data-testid={`finance-tab-${s}`}
          >
            {t(`tabs.${s}`)}
          </Link>
        ))}
        <span className="ms-auto self-center text-sm text-muted">
          {t('count', { count: items.length })}
        </span>
      </nav>

      {items.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-muted">
          {t(`empty.${status}`)}
        </p>
      ) : (
        <ul className="mt-6 space-y-4" data-testid="finance-queue">
          {items.map((v) => {
            const channel = channelKey(v);
            return (
              <li
                key={v.id}
                className="grid gap-5 rounded-2xl border border-border bg-surface p-5 shadow-card md:grid-cols-[220px_minmax(0,1fr)]"
                data-reference={v.pledge.referenceNo}
                data-channel={channel}
              >
                <div>
                  {v.receipt ? (
                    <a
                      href={`/api/files/receipts/${v.receipt.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {v.receipt.mimeType.startsWith('image/') ? (
                        // Private file through the session proxy: next/image cannot load it.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/files/receipts/${v.receipt.id}`}
                          alt={t('openReceipt')}
                          className="max-h-64 w-full rounded-xl border border-border object-contain"
                        />
                      ) : (
                        <span className="block rounded-xl border border-border p-6 text-center text-sm">
                          PDF — {t('openReceipt')}
                        </span>
                      )}
                    </a>
                  ) : (
                    <div className="rounded-xl bg-surface-muted p-4 text-sm">
                      <p className="font-semibold">{t(`channelTitle.${channel}`)}</p>
                      {v.pledge.collectionPoint ? (
                        <p className="mt-1 text-muted">
                          {v.pledge.collectionPoint.name} (
                          {t(`pointTypes.${v.pledge.collectionPoint.type}`)}،{' '}
                          {v.pledge.collectionPoint.area})
                        </p>
                      ) : (
                        <p className="mt-1 text-muted">{t(`channelHint.${channel}`)}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-display text-2xl font-bold tabular-nums text-accent">
                      {formatMoney(v.pledge.amount, v.pledge.currency, lang)}
                    </p>
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold">
                      {t(`channelTitle.${channel}`)}
                    </span>
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    <dt className="text-muted">{t('pledge')}</dt>
                    <dd dir="ltr" className="text-start font-semibold">
                      {v.pledge.referenceNo}
                    </dd>
                    <dt className="text-muted">{t('campaign')}</dt>
                    <dd>{v.pledge.campaign.titleAr}</dd>
                    <dt className="text-muted">{t('donor')}</dt>
                    <dd>
                      {v.pledge.donorName ?? t('noName')}{' '}
                      {v.pledge.donorPhone && (
                        <span dir="ltr" className="text-muted">
                          {v.pledge.donorPhone}
                        </span>
                      )}
                    </dd>
                    <dt className="text-muted">{t('method')}</dt>
                    <dd>{t(`methods.${v.pledge.method}`)}</dd>
                    {v.pledge.recordedBy && (
                      <>
                        <dt className="text-muted">{t('recordedBy')}</dt>
                        <dd>{v.pledge.recordedBy.fullName}</dd>
                      </>
                    )}
                    {v.receipt?.transferRef && (
                      <>
                        <dt className="text-muted">{t('transferRef')}</dt>
                        <dd dir="ltr" className="text-start">
                          {v.receipt.transferRef}
                        </dd>
                      </>
                    )}
                    <dt className="text-muted">{t('submittedAt')}</dt>
                    <dd>{format.dateTime(new Date(v.createdAt), DATE_TIME_SHORT)}</dd>
                    {v.decidedAt && (
                      <>
                        <dt className="text-muted">{t('decidedAt')}</dt>
                        <dd>
                          {format.dateTime(new Date(v.decidedAt), DATE_TIME_SHORT)}
                          {v.reviewer && <span className="text-muted"> — {v.reviewer}</span>}
                        </dd>
                      </>
                    )}
                  </dl>
                  <div className="border-t border-border pt-4">
                    {status === 'PENDING' ? (
                      <FinanceActions
                        id={v.id}
                        reference={v.pledge.referenceNo}
                        ownEntry={v.ownEntry}
                      />
                    ) : status === 'APPROVED' ? (
                      v.pledge.officialReceiptNo ? (
                        <Link
                          href={`/receipts/${v.pledge.officialReceiptNo}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
                          data-testid="official-receipt-link"
                        >
                          {t('officialReceipt')} <span dir="ltr">{v.pledge.officialReceiptNo}</span>
                        </Link>
                      ) : (
                        <p className="text-sm text-muted">{t('noOfficialReceipt')}</p>
                      )
                    ) : (
                      <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
                        {t('rejectedBecause', { reason: v.reason ?? '' })}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </WorkspacePage>
  );
}
