import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { AuditHistory } from '@/components/admin/AuditHistory';
import { CampaignCover } from '@/components/campaigns/CampaignCover';
import { CategoryIcon } from '@/components/campaigns/CategoryIcon';
import { NotForYourRole } from '@/components/layout/WorkspacePage';
import { isUuid } from '@/lib/actions/validation';
import { getStaffCampaign } from '@/lib/api/admin-campaigns';
import { campaignHistory } from '@/lib/api/audit';
import { ApiError } from '@/lib/api/client';
import { requireWorkspace } from '@/lib/auth';
import { DATE_TIME_SHORT } from '@/lib/format';
import type { StaffCampaignDetail } from '@/lib/types/staff';
import { formatMoney } from '@/shared';
import { CloseCampaign, EditCampaignForm, LifecycleButton, PostUpdateForm } from './ManageForms';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('adminCampaigns');
  return { title: t('title') };
}

/** The ordered stages of a public campaign; CLOSED sits outside this path. */
const STAGES = ['DRAFT', 'ACTIVE', 'FUNDED', 'COMPLETED'] as const;
const PUBLIC = ['ACTIVE', 'FUNDED', 'COMPLETED'];

async function load(token: string, id: string): Promise<StaffCampaignDetail> {
  try {
    return await getStaffCampaign(token, id);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) notFound();
    throw err;
  }
}

/**
 * ADMIN manages one campaign: its stage (publish, pause / resume donations, completed, close), its
 * public presentation (titles, anonymised summaries, cover illustration) and its public updates.
 */
export default async function ManageCampaignPage({ params }: Props) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { token, user, allowed } = await requireWorkspace('campaigns');
  if (!allowed) return <NotForYourRole />;
  const [c, history, t, format, locale] = await Promise.all([
    load(token, id),
    user.role === 'ADMIN' ? campaignHistory(token, id) : Promise.resolve(null),
    getTranslations('adminCampaigns'),
    getFormatter(),
    getLocale(),
  ]);
  const lang = locale === 'en' ? 'en' : 'ar';
  const money = (v: string) => formatMoney(v, c.currency, lang);
  const closed = c.status === 'CLOSED';
  const final = closed || c.status === 'COMPLETED';
  const canClose = Number(c.verifiedAmount) === 0 && c.openPledges === 0;
  const reviewPending = c.case !== null && c.case.status !== 'PUBLISHED' && !c.acceptsPledges;
  const stageIndex = STAGES.findIndex((s) => s === c.status);
  const hidden = { id: c.id, slug: c.slug };

  return (
    <div
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6"
      data-testid="campaign-manage-page"
      data-status={c.status}
      data-accepts={String(c.acceptsPledges)}
    >
      <Link
        href="/dashboard/admin/campaigns"
        className="text-sm font-medium text-muted hover:text-accent"
      >
        {t('manage.back')}
      </Link>

      <header className="mt-3 flex flex-wrap items-start gap-5">
        <div className="hidden h-24 w-36 shrink-0 overflow-hidden rounded-2xl ring-1 ring-border sm:block">
          <CampaignCover coverKey={c.coverKey} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CategoryIcon icon={c.category.icon} className="h-4 w-4 text-accent" />
              {lang === 'en' ? c.category.nameEn : c.category.nameAr}
            </span>
            {c.case && <span>{t('manage.caseFile', { trackingNo: c.case.trackingNo })}</span>}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
            {lang === 'en' && c.titleEn ? c.titleEn : c.titleAr}
          </h1>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {(
              [
                ['verified', c.verifiedAmount],
                ['spent', c.spentAmount],
                ['target', c.targetAmount],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="flex gap-1.5">
                <dt className="text-muted">{t(`manage.${key}`)}</dt>
                <dd className="font-semibold tabular-nums">{money(value)}</dd>
              </div>
            ))}
            <div className="text-muted" data-testid="open-pledges">
              {t('manage.openPledges', { count: c.openPledges })}
            </div>
          </dl>
        </div>
        {PUBLIC.includes(c.status) && (
          <Link
            href={`/campaigns/${c.slug}`}
            className="text-sm font-semibold text-accent hover:underline"
          >
            {t('openPublic')}
          </Link>
        )}
      </header>

      {/* The lifecycle band: where the campaign stands, and only the moves allowed from there. */}
      <section
        aria-labelledby="lifecycle-title"
        className="mt-8 rounded-2xl border border-border bg-surface shadow-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id="lifecycle-title" className="font-display text-lg font-bold">
            {t('manage.lifecycle')}
          </h2>
          {c.status === 'ACTIVE' && (
            <span
              data-testid="donations-state"
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                c.acceptsPledges
                  ? 'bg-accent-soft text-accent-strong'
                  : 'bg-danger-soft text-danger'
              }`}
            >
              <span
                aria-hidden
                className={`h-2 w-2 rounded-full ${c.acceptsPledges ? 'bg-accent' : 'bg-danger'}`}
              />
              {c.acceptsPledges ? t('manage.donationsOpen') : t('manage.donationsPaused')}
            </span>
          )}
        </div>

        <ol
          aria-label={t('manage.lifecycleLabel')}
          className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4"
        >
          {STAGES.map((stage, i) => {
            const current = stage === c.status;
            const passed = !closed && stageIndex > i;
            return (
              <li
                key={stage}
                aria-current={current ? 'step' : undefined}
                className={`flex items-center gap-3 px-5 py-4 text-sm ${
                  current ? 'bg-accent-soft' : 'bg-surface'
                }`}
              >
                <span
                  aria-hidden
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums ${
                    current
                      ? 'bg-brand-700 text-white dark:bg-brand-600'
                      : passed
                        ? 'bg-brand-200 text-brand-800 dark:bg-brand-800 dark:text-brand-100'
                        : 'bg-surface-muted text-muted ring-1 ring-inset ring-border'
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={current ? 'font-bold text-accent-strong' : passed ? '' : 'text-muted'}
                >
                  {t(`statuses.${stage}`)}
                </span>
              </li>
            );
          })}
        </ol>
        {closed && (
          <p className="border-t border-border bg-surface-muted px-5 py-3 text-sm font-semibold text-muted">
            {t('manage.closedStep')}
          </p>
        )}

        <div className="space-y-4 border-t border-border px-5 py-5" data-testid="lifecycle-actions">
          {final ? (
            <p className="text-sm text-muted">{t('manage.finalNote')}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {c.status === 'DRAFT' && (
                <LifecycleButton
                  {...hidden}
                  op="publish"
                  label={t('manage.publish')}
                  hint={t('manage.publishHint')}
                />
              )}
              {c.status === 'ACTIVE' &&
                (c.acceptsPledges ? (
                  <LifecycleButton
                    {...hidden}
                    op="pause"
                    label={t('manage.pause')}
                    hint={t('manage.pauseHint')}
                    variant="secondary"
                  />
                ) : reviewPending ? (
                  <p className="rounded-xl bg-warning-soft p-4 text-sm text-warning">
                    {t('manage.reviewPending')}
                  </p>
                ) : (
                  <LifecycleButton
                    {...hidden}
                    op="resume"
                    label={t('manage.resume')}
                    hint={t('manage.resumeHint')}
                  />
                ))}
              {(c.status === 'ACTIVE' || c.status === 'FUNDED') && (
                <LifecycleButton
                  {...hidden}
                  op="complete"
                  label={t('manage.complete')}
                  hint={t('manage.completeHint')}
                  variant="secondary"
                />
              )}
              {canClose ? (
                <CloseCampaign {...hidden} />
              ) : (
                <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
                  {t('manage.closeBlocked')}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <h2 className="font-display text-lg font-bold">{t('manage.edit')}</h2>
          <p className="mb-5 mt-1 text-sm text-muted">{t('manage.editHint')}</p>
          {closed ? (
            <p className="text-sm text-muted">{t('manage.readOnly')}</p>
          ) : (
            <EditCampaignForm
              key={JSON.stringify([
                c.titleAr,
                c.titleEn,
                c.summaryAr,
                c.summaryEn,
                c.coverKey,
                c.area,
                c.priority,
              ])}
              campaign={c}
            />
          )}
        </section>

        <section className="space-y-5" aria-labelledby="updates-title">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
            <h2 id="updates-title" className="font-display text-lg font-bold">
              {t('manage.updates')}
            </h2>
            <p className="mb-4 mt-1 text-sm text-muted">{t('manage.updatesHint')}</p>
            {!closed && <PostUpdateForm {...hidden} />}
          </div>
          {c.updates.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
              {t('manage.noUpdates')}
            </p>
          ) : (
            <ol className="space-y-3" data-testid="campaign-updates">
              {c.updates.map((u) => (
                <li
                  key={u.id}
                  className="border-s-2 border-brand-600 ps-4"
                  data-testid="campaign-update"
                >
                  <p className="text-xs text-muted">
                    <time dateTime={u.createdAt}>
                      {format.dateTime(new Date(u.createdAt), DATE_TIME_SHORT)}
                    </time>{' '}
                    {t('manage.by', { name: u.author.fullName })}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm">
                    {lang === 'en' && u.bodyEn ? u.bodyEn : u.bodyAr}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {history && (
        <div className="mt-8">
          <AuditHistory items={history} />
        </div>
      )}
    </div>
  );
}
