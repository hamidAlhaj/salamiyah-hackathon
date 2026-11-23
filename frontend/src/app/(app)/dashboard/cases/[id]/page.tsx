import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { AuditHistory } from '@/components/admin/AuditHistory';
import { CampaignCover } from '@/components/campaigns/CampaignCover';
import { ActionForm } from '@/components/forms/ActionForm';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { Field } from '@/components/ui/Field';
import { changeHospitalAction, publishCaseAction, reviewCaseAction } from '@/lib/actions/cases';
import { caseHistory } from '@/lib/api/audit';
import { orNotFound } from '@/lib/api/client';
import { getCase, listHospitals } from '@/lib/api/staff-cases';
import { requireWorkspace } from '@/lib/auth';
import { CASE_ROUTES, COVER_KEYS, formatMoney, PRIORITIES } from '@/shared';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REVIEWABLE = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFO'];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cases');
  return { title: t('details') };
}

/** Case detail for staff: review (CASE_OFFICER), publish as a medical campaign, hospital/amount change. */
export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { token, user, allowed } = await requireWorkspace('cases');
  if (!allowed) return <NotForYourRole />;
  const isAdmin = user.role === 'ADMIN';
  const [c, hospitals, history] = await Promise.all([
    orNotFound(getCase(token, id)),
    listHospitals(token),
    // The history panel is ADMIN-only (the API refuses every other role).
    isAdmin ? caseHistory(token, id) : Promise.resolve(null),
  ]);
  const t = await getTranslations('cases');
  const tPriority = await getTranslations('priority');
  const tCategory = await getTranslations('category');
  const tCommon = await getTranslations('common');
  const tIntake = await getTranslations('intake');
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const money = (v: string) => formatMoney(v, c.currency, locale);

  const isOfficer = user.role === 'CASE_OFFICER';
  const canReview = isOfficer && REVIEWABLE.includes(c.status);
  const canPublish =
    isOfficer && c.status === 'APPROVED' && c.route === 'CROWDFUNDING' && !c.campaign;
  const canChange = (isOfficer || isAdmin) && ['APPROVED', 'PUBLISHED'].includes(c.status);
  const hospitalOptions = hospitals.map((h) => (
    <option key={h.id} value={h.id}>
      {h.nameAr}
    </option>
  ));
  const row = 'grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 py-2';

  return (
    <WorkspacePage title={`${t('details')} — ${tCategory(c.category)}`} testId="case-page">
      <p className="-mt-4 mb-6 text-sm" dir="ltr">
        <span className="font-display font-bold text-accent-strong">{c.trackingNo}</span>
      </p>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className="rounded-full bg-surface-muted px-3 py-1 font-semibold"
              data-testid="case-status"
            >
              {t(`statuses.${c.status}`)}
            </span>
            {c.priority && (
              <span className="rounded-full bg-danger-soft px-3 py-1 font-semibold text-danger">
                {tPriority(c.priority)}
              </span>
            )}
            {c.campaign && (
              <Link
                href={`/campaigns/${c.campaign.slug}`}
                className="font-semibold text-accent underline"
                data-testid="case-campaign-link"
              >
                {t('openCampaign')}: /campaigns/{c.campaign.slug}
              </Link>
            )}
          </div>
          {c.campaign && !c.campaign.acceptsPledges && (
            <p
              className="rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
              data-testid="pledges-paused"
            >
              {t('pledgesPaused')}
            </p>
          )}
          {c.rejectionReason && (
            <p className="rounded-xl border border-warning-line bg-warning-soft px-4 py-3 text-sm text-warning">
              {c.rejectionReason}
            </p>
          )}

          <dl className="divide-y divide-border rounded-2xl border border-border bg-surface px-5 text-sm shadow-card">
            <div className={row}>
              <dt className="text-muted">{t('beneficiary')}</dt>
              <dd>
                {c.beneficiary.fullName} — <span dir="ltr">{c.beneficiary.phone}</span> — ID ****
                {c.beneficiary.nationalIdLast4}
              </dd>
            </div>
            <div className={row}>
              <dt className="text-muted">{t('beneficiaryCode')}</dt>
              <dd dir="ltr" className="text-start font-semibold">
                {c.beneficiary.publicCode}
              </dd>
            </div>
            <div className={row}>
              <dt className="text-muted">{tIntake('council')}</dt>
              <dd>{c.beneficiary.localCouncil}</dd>
            </div>
            <div className={row}>
              <dt className="text-muted">{t('requested')}</dt>
              <dd className="tabular-nums">{money(c.requestedAmount)}</dd>
            </div>
            {c.approvedAmount && (
              <div className={row}>
                <dt className="text-muted">{t('approvedAmount')}</dt>
                <dd className="font-semibold tabular-nums">{money(c.approvedAmount)}</dd>
              </div>
            )}
            {c.hospital && (
              <div className={row}>
                <dt className="text-muted">{t('hospital')}</dt>
                <dd data-testid="case-hospital">
                  {c.hospital.nameAr}
                  {c.doctorName ? ` — ${c.doctorName}` : ''}
                </dd>
              </div>
            )}
            <div className={row}>
              <dt className="text-muted">{t('otherPrograms')}</dt>
              <dd>
                {c.beneficiary.otherPrograms.length
                  ? c.beneficiary.otherPrograms.join('، ')
                  : t('none')}
              </dd>
            </div>
          </dl>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <h2 className="font-display font-bold">{t('description')}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{c.description}</p>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <h2 className="font-display font-bold">{t('documents')}</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {c.documents.map((d) => (
                <li key={d.id}>
                  <a
                    href={`/api/files/documents/${d.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline"
                  >
                    {d.kind} — {d.originalName}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {c.beneficiaryHistory.length > 0 && (
            <section className="rounded-2xl border border-warning-line bg-warning-soft p-5 text-sm">
              <h2 className="font-display font-bold text-warning">{t('history')}</h2>
              <ul className="mt-2 space-y-1">
                {c.beneficiaryHistory.map((h) => (
                  <li key={h.id}>
                    <Link
                      href={`/dashboard/cases/${h.id}`}
                      dir="ltr"
                      className="font-semibold underline"
                    >
                      {h.trackingNo}
                    </Link>{' '}
                    — {t(`statuses.${h.status}`)}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {canReview && (
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <h2 className="font-display text-lg font-bold">{t('review')}</h2>
              <ActionForm
                action={reviewCaseAction}
                submitLabel={t('submit')}
                pendingLabel={tCommon('saving')}
                className="mt-4"
                testId="review-form"
              >
                <input type="hidden" name="id" value={c.id} />
                <Field
                  as="select"
                  id="rv-decision"
                  label={t('decision')}
                  name="decision"
                  defaultValue="approve"
                >
                  <option value="approve">{t('approve')}</option>
                  <option value="needs_info">{t('needsInfo')}</option>
                  <option value="reject">{t('rejectDecision')}</option>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    as="select"
                    id="rv-priority"
                    label={t('priority')}
                    name="priority"
                    defaultValue={c.priority ?? 'URGENT'}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {tPriority(p)}
                      </option>
                    ))}
                  </Field>
                  <Field
                    as="select"
                    id="rv-route"
                    label={t('route')}
                    name="route"
                    defaultValue="CROWDFUNDING"
                  >
                    {CASE_ROUTES.map((r) => (
                      <option key={r} value={r}>
                        {t(`routes.${r}`)}
                      </option>
                    ))}
                  </Field>
                </div>
                <Field
                  as="select"
                  id="rv-hospital"
                  label={t('hospital')}
                  name="hospitalId"
                  defaultValue={c.hospital?.id ?? hospitals[0]?.id}
                >
                  {hospitalOptions}
                </Field>
                <Field
                  id="rv-doctor"
                  label={t('doctor')}
                  name="doctorName"
                  defaultValue={c.doctorName ?? ''}
                />
                <Field
                  id="rv-amount"
                  label={t('approvedAmount')}
                  name="approvedAmount"
                  inputMode="decimal"
                  dir="ltr"
                  defaultValue={c.approvedAmount ?? c.requestedAmount}
                />
                <Field as="textarea" id="rv-reason" label={t('reason')} name="reason" rows={2} />
              </ActionForm>
            </section>
          )}

          {canPublish && (
            <section className="rounded-2xl border border-brand-200 bg-surface p-5 shadow-card dark:border-brand-800">
              <h2 className="font-display text-lg font-bold">{t('publish')}</h2>
              <ActionForm
                action={publishCaseAction}
                submitLabel={t('publishSubmit')}
                pendingLabel={tCommon('saving')}
                className="mt-4"
                testId="publish-form"
              >
                <input type="hidden" name="id" value={c.id} />
                <Field
                  id="pb-titleAr"
                  label={t('titleAr')}
                  name="titleAr"
                  required
                  minLength={5}
                  maxLength={160}
                />
                <Field
                  id="pb-titleEn"
                  label={t('titleEn')}
                  name="titleEn"
                  dir="ltr"
                  minLength={5}
                  maxLength={160}
                />
                <Field
                  as="textarea"
                  id="pb-summary"
                  label={t('redactedSummary')}
                  name="redactedSummary"
                  required
                  minLength={20}
                  rows={4}
                />
                <Field
                  as="textarea"
                  id="pb-summaryEn"
                  label={t('summaryEn')}
                  name="summaryEn"
                  dir="ltr"
                  minLength={20}
                  rows={3}
                />
                <Field id="pb-area" label={t('area')} name="area" maxLength={60} />
                <fieldset>
                  <legend className="text-sm font-medium">{t('cover')}</legend>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {COVER_KEYS.map((key) => (
                      <label key={key} className="cursor-pointer">
                        <input
                          type="radio"
                          name="coverKey"
                          value={key}
                          defaultChecked={key === 'medical-1'}
                          className="peer sr-only"
                        />
                        <span className="block h-12 overflow-hidden rounded-lg border-2 border-transparent ring-1 ring-border peer-checked:border-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                          <CampaignCover coverKey={key} />
                        </span>
                        <span className="sr-only">{key}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isAnonymous"
                    defaultChecked
                    className="h-4 w-4 accent-brand-600"
                  />
                  {t('isAnonymous')}
                </label>
              </ActionForm>
            </section>
          )}

          {canChange && (
            <section className="rounded-2xl border border-danger-line bg-surface p-5 shadow-card">
              <h2 className="font-display text-lg font-bold">{t('lock')}</h2>
              <p className="mt-1 text-xs text-muted">{t('lockNote')}</p>
              <ActionForm
                action={changeHospitalAction}
                submitLabel={t('lockSubmit')}
                pendingLabel={tCommon('saving')}
                variant="danger"
                className="mt-4"
                testId="change-hospital-form"
              >
                <input type="hidden" name="id" value={c.id} />
                <Field
                  as="select"
                  id="ch-hospital"
                  label={t('hospital')}
                  name="hospitalId"
                  defaultValue={c.hospital?.id}
                >
                  {hospitalOptions}
                </Field>
                <Field
                  id="ch-amount"
                  label={t('newAmount')}
                  name="approvedAmount"
                  inputMode="decimal"
                  dir="ltr"
                  placeholder={c.approvedAmount ?? ''}
                />
                <Field id="ch-reason" label={t('reason')} name="reason" required minLength={5} />
              </ActionForm>
            </section>
          )}
        </aside>
      </div>
      {history && (
        <div className="mt-8">
          <AuditHistory items={history} />
        </div>
      )}
    </WorkspacePage>
  );
}
