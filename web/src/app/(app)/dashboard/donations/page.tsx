import type { Metadata } from 'next';
import Link from 'next/link';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { DemoBadge } from '@/components/campaigns/DemoBadge';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { buttonClasses } from '@/components/ui/Button';
import { myPledges } from '@/lib/api/pledges';
import { requireWorkspace } from '@/lib/auth';
import { DATE_MEDIUM } from '@/lib/format';
import { formatMoney, type PledgeStatus, type PledgeView } from '@/shared';
import { PendingReceipt } from './PendingReceipt';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('myDonations');
  return { title: t('title') };
}

const TONE: Record<PledgeStatus, string> = {
  PLEDGED: 'bg-warning-soft text-warning',
  RECEIPT_UPLOADED: 'bg-warning-soft text-warning',
  COLLECTED: 'bg-warning-soft text-warning',
  VERIFIED: 'bg-accent-soft text-accent-strong',
  DEMO_CONFIRMED: 'bg-surface-muted text-muted',
  REJECTED: 'bg-danger-soft text-danger',
  CANCELLED: 'bg-surface-muted text-muted',
};

/** A transfer pledge still waiting for its receipt (or rejected): the donor can upload it here. */
const needsReceipt = (p: PledgeView) =>
  !p.isDemo &&
  p.method !== 'CASH' &&
  p.channel === 'PLATFORM' &&
  (p.status === 'PLEDGED' || p.status === 'REJECTED');

/** «تبرعاتي» on the web: every pledge of the donor with its status, reference and receipt. */
export default async function MyDonationsPage() {
  const { token, allowed } = await requireWorkspace('donations');
  if (!allowed) return <NotForYourRole />;
  const [pledges, t, format, locale] = await Promise.all([
    myPledges(token),
    getTranslations('myDonations'),
    getFormatter(),
    getLocale(),
  ]);
  const lang = locale === 'en' ? 'en' : 'ar';

  return (
    <WorkspacePage title={t('title')} intro={t('intro')} testId="my-donations">
      {pledges.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-muted">{t('empty')}</p>
          <Link href="/#campaigns" className={buttonClasses('primary', 'md', 'mt-4')}>
            {t('browse')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3" data-testid="pledge-list">
          {pledges.map((p) => {
            const statusKey =
              p.status === 'PLEDGED' && p.method === 'CASH' ? 'PLEDGED_CASH' : p.status;
            return (
              <li
                key={p.id}
                className="rounded-2xl border border-border bg-surface p-5 shadow-card"
                data-reference={p.referenceNo}
                data-status={p.status}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/campaigns/${p.campaignSlug}`}
                      className="font-semibold hover:text-accent"
                    >
                      {p.campaignTitle}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      <span dir="ltr">{p.referenceNo}</span>
                      {' — '}
                      <time dateTime={p.createdAt}>
                        {format.dateTime(new Date(p.createdAt), DATE_MEDIUM)}
                      </time>
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-display text-lg font-bold tabular-nums">
                      {formatMoney(p.amount, p.currency, lang)}
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[p.status]}`}
                    >
                      {t(`status.${statusKey}`)}
                      {p.isDemo && <DemoBadge />}
                    </span>
                  </div>
                </div>
                {p.collectionPoint && (
                  <p className="mt-3 text-sm text-muted">
                    {t('point', { name: p.collectionPoint.name, area: p.collectionPoint.area })}
                  </p>
                )}
                {p.isDemo && <p className="mt-3 text-xs text-muted">{t('demo')}</p>}
                {p.rejectionReason && (
                  <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
                    {t('rejection', { reason: p.rejectionReason })}
                  </p>
                )}
                {p.officialReceiptNo && !p.isDemo && (
                  <Link
                    href={`/receipts/${p.officialReceiptNo}`}
                    className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
                  >
                    {t('official')}
                  </Link>
                )}
                {needsReceipt(p) && (
                  <PendingReceipt
                    pledgeId={p.id}
                    campaignSlug={p.campaignSlug}
                    label={t('uploadTitle')}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </WorkspacePage>
  );
}
