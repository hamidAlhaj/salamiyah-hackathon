import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { ActionForm } from '@/components/forms/ActionForm';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { markCompletedAction } from '@/lib/actions/expenditures';
import { isUuid } from '@/lib/actions/validation';
import { listExpenditures, spendingContext } from '@/lib/api/expenditures';
import { requireWorkspace } from '@/lib/auth';
import { DATE_MEDIUM } from '@/lib/format';
import { formatMoney } from '@/shared';
import { ExpenditureForm } from './ExpenditureForm';
import { MonthlyRunForm } from './MonthlyRunForm';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('spending');
  return { title: t('title') };
}

/** Damascus calendar day and month for the form defaults (Western digits). */
function todayInDamascus(): { day: string; month: string } {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Damascus' }).format(new Date());
  return { day, month: day.slice(0, 7) };
}

/**
 * A campaign's spending for staff. FINANCE_VERIFIER records expenditures and monthly sponsorship;
 * ADMIN sees everything and can mark an ongoing programme «تم الإنجاز»; nobody else gets here.
 */
export default async function CampaignSpendingPage({ params }: Props) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { token, user, allowed } = await requireWorkspace('spending');
  if (!allowed) return <NotForYourRole />;
  const [ctx, rows, t, tc, format, locale] = await Promise.all([
    spendingContext(token, id),
    listExpenditures(token, id),
    getTranslations('spending'),
    getTranslations('campaign'),
    getFormatter(),
    getLocale(),
  ]);
  const lang = locale === 'en' ? 'en' : 'ar';
  const { campaign } = ctx;
  const money = (v: string) => formatMoney(v, campaign.currency, lang);
  const canSpend =
    user.role === 'FINANCE_VERIFIER' &&
    (campaign.status === 'ACTIVE' || campaign.status === 'FUNDED');
  const completed = campaign.status === 'COMPLETED';
  const { day, month } = todayInDamascus();

  return (
    <WorkspacePage
      title={campaign.title}
      intro={t('pageIntro')}
      testId="spending-page"
      actions={
        <Link
          href={`/campaigns/${campaign.slug}`}
          className="text-sm font-semibold text-accent hover:underline"
        >
          {t('publicPage')}
        </Link>
      }
    >
      <section
        aria-label={tc('account')}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        data-testid="spending-ledger"
        data-remaining={campaign.remainingAmount}
        data-spent={campaign.spentAmount}
      >
        {(
          [
            ['target', campaign.targetAmount],
            ['verified', campaign.verifiedAmount],
            ['spent', campaign.spentAmount],
            ['remaining', campaign.remainingAmount],
          ] as const
        ).map(([key, value]) => (
          <div
            key={key}
            className={`rounded-2xl border p-4 shadow-card ${
              key === 'remaining'
                ? 'border-brand-200 bg-accent-soft dark:border-brand-800'
                : 'border-border bg-surface'
            }`}
          >
            <p className="text-xs text-muted">{tc(key)}</p>
            <p className="mt-1 font-display text-lg font-bold tabular-nums">{money(value)}</p>
          </div>
        ))}
      </section>

      {completed && (
        <p
          className="mt-5 rounded-2xl bg-panel px-5 py-4 font-display text-lg font-bold text-white"
          data-testid="spending-completed"
        >
          {tc('completed')} — {t('completedNote')}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          {canSpend ? (
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <h2 className="font-display text-lg font-bold">{t('formTitle')}</h2>
              <p className="mb-4 mt-1 text-sm text-muted">{t('formIntro')}</p>
              <ExpenditureForm ctx={ctx} today={day} />
            </section>
          ) : (
            !completed && (
              <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
                {t('viewOnly')}
              </p>
            )
          )}
          {canSpend && campaign.category.supportsMonthlySponsorship && (
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <h2 className="font-display text-lg font-bold">{t('monthlyTitle')}</h2>
              <p className="mb-4 mt-1 text-sm text-muted">{t('monthlyIntro')}</p>
              <MonthlyRunForm ctx={ctx} month={month} />
            </section>
          )}
          {user.role === 'ADMIN' && campaign.isOngoing && !completed && (
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <h2 className="font-display text-lg font-bold">{t('markTitle')}</h2>
              <p className="mb-4 mt-1 text-sm text-muted">{t('markIntro')}</p>
              <ActionForm
                action={markCompletedAction}
                submitLabel={t('markButton')}
                pendingLabel={t('saving')}
              >
                <input type="hidden" name="campaignId" value={campaign.id} />
                <input type="hidden" name="slug" value={campaign.slug} />
              </ActionForm>
            </section>
          )}
        </div>

        <section aria-labelledby="rows-title">
          <h2 id="rows-title" className="font-display text-lg font-bold">
            {t('listTitle')}
          </h2>
          {rows.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              {t('listEmpty')}
            </p>
          ) : (
            <ol
              className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface shadow-card"
              data-testid="staff-expenditures"
            >
              {rows.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start justify-between gap-3 px-4 py-3"
                  data-payee={e.payeeType}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {e.beneficiaryCode ? <span dir="ltr">{e.beneficiaryCode}</span> : e.payee}
                      <span className="font-normal text-muted">
                        {' '}
                        — {t(`payeeTypes.${e.payeeType}`)}
                      </span>
                    </p>
                    <p className="text-xs text-muted">
                      {format.dateTime(new Date(e.paidAt), DATE_MEDIUM)} — {e.recordedBy}
                    </p>
                    <p className="mt-1 text-sm">{e.description}</p>
                    {e.proofDocumentId && (
                      <a
                        href={`/api/files/documents/${e.proofDocumentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
                      >
                        {t('openProof')}
                        <span
                          className={`rounded-full px-2 py-0.5 ${e.proofPublic ? 'bg-accent-soft text-accent-strong' : 'bg-surface-muted text-muted'}`}
                        >
                          {e.proofPublic ? t('proofIsPublic') : t('proofIsPrivate')}
                        </span>
                      </a>
                    )}
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">
                    {formatMoney(e.amount, e.currency, lang)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </WorkspacePage>
  );
}
