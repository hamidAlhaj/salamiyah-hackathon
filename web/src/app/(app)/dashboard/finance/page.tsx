import type { Metadata } from 'next';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { ActionForm } from '@/components/forms/ActionForm';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { Field } from '@/components/ui/Field';
import { approveVerificationAction, rejectVerificationAction } from '@/lib/actions/verifications';
import { listPendingVerifications } from '@/lib/api/verifications';
import { requireWorkspace } from '@/lib/auth';
import { DATE_TIME_SHORT } from '@/lib/format';
import { formatMoney } from '@/shared';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('finance');
  return { title: t('title') };
}

/** FR-15: the finance verification queue, oldest first, receipt next to the pledge. */
export default async function FinancePage() {
  const { token, allowed } = await requireWorkspace('finance');
  if (!allowed) return <NotForYourRole />;
  const t = await getTranslations('finance');
  const tCommon = await getTranslations('common');
  const format = await getFormatter();
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const queue = await listPendingVerifications(token);

  return (
    <WorkspacePage
      title={t('title')}
      intro={t('intro')}
      testId="finance-page"
      actions={
        <p className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold">
          {t('count', { count: queue.length })}
        </p>
      }
    >
      {queue.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
          {t('empty')}
        </p>
      ) : (
        <ul className="space-y-4" data-testid="finance-queue">
          {queue.map((v) => (
            <li
              key={v.id}
              className="grid gap-5 rounded-2xl border border-border bg-surface p-5 shadow-card md:grid-cols-[220px_minmax(0,1fr)]"
              data-reference={v.pledge.referenceNo}
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
                  <p className="rounded-xl bg-warning-soft p-4 text-sm text-warning">
                    {t('noReceipt')}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-2xl font-bold tabular-nums text-accent">
                    {formatMoney(v.pledge.amount, v.pledge.currency, locale)}
                  </p>
                  <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium">
                    {t(`channel.${v.pledge.channel}`)}
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
                  <dd dir="ltr" className="text-start">
                    {v.pledge.method}
                  </dd>
                  {v.pledge.collectionPoint && (
                    <>
                      <dt className="text-muted">{t('point')}</dt>
                      <dd>{v.pledge.collectionPoint.name}</dd>
                    </>
                  )}
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
                </dl>
                <div className="flex flex-wrap items-start gap-4 border-t border-border pt-4">
                  <ActionForm
                    action={approveVerificationAction}
                    submitLabel={t('approve')}
                    pendingLabel={tCommon('saving')}
                    testId={`approve-${v.pledge.referenceNo}`}
                  >
                    <input type="hidden" name="id" value={v.id} />
                  </ActionForm>
                  <ActionForm
                    action={rejectVerificationAction}
                    submitLabel={t('reject')}
                    pendingLabel={tCommon('saving')}
                    variant="danger"
                    className="min-w-[14rem] flex-1"
                  >
                    <input type="hidden" name="id" value={v.id} />
                    <Field
                      id={`reason-${v.id}`}
                      label={t('reason')}
                      name="reason"
                      required
                      minLength={5}
                    />
                  </ActionForm>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WorkspacePage>
  );
}
