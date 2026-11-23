import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { buttonClasses } from '@/components/ui/Button';
import { controlClass } from '@/components/ui/Field';
import { searchBeneficiaries } from '@/lib/api/admin-beneficiaries';
import { listStaffCampaigns } from '@/lib/api/admin-campaigns';
import { requireWorkspace } from '@/lib/auth';
import { formatMoney } from '@/shared';
import { NewBeneficiaryForm } from '../campaigns/new/NewBeneficiaryForm';
import { EditBeneficiaryForm, LinkControls, LinkForm } from './BeneficiaryForms';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('adminSetup');
  return { title: t('beneficiaries.title') };
}

// Campaigns that can still take new beneficiaries.
const LINKABLE = ['DRAFT', 'ACTIVE', 'FUNDED'];

/**
 * Staff beneficiary registry (ADMIN, STAFF): public codes with the private record beside them.
 * STAFF register; only ADMIN edits records and links them to campaigns (the API enforces both).
 */
export default async function BeneficiariesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { token, user, allowed } = await requireWorkspace('beneficiaries');
  if (!allowed) return <NotForYourRole />;
  const t = await getTranslations('adminSetup');
  const tAdmin = await getTranslations('adminCampaigns');
  const tKinds = await getTranslations('campaign.kinds');
  const tCommon = await getTranslations('common');
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const q = ((await searchParams).q ?? '').trim().slice(0, 60);
  const isAdmin = user.role === 'ADMIN';
  const [beneficiaries, campaigns] = await Promise.all([
    searchBeneficiaries(token, q || undefined),
    isAdmin ? listStaffCampaigns(token) : Promise.resolve([]),
  ]);
  const linkable = campaigns
    .filter((c) => LINKABLE.includes(c.status))
    .map((c) => ({ id: c.id, title: c.titleAr }));

  return (
    <WorkspacePage
      title={t('beneficiaries.title')}
      intro={t('beneficiaries.intro')}
      testId="beneficiaries-page"
    >
      <form method="get" role="search" className="mb-6 flex max-w-xl gap-2">
        <label htmlFor="b-search" className="sr-only">
          {t('beneficiaries.search')}
        </label>
        <input
          id="b-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t('beneficiaries.search')}
          className={controlClass}
        />
        <button type="submit" className={buttonClasses('secondary')}>
          {tCommon('search')}
        </button>
      </form>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {!isAdmin && <p className="mb-3 text-sm text-muted">{t('beneficiaries.readOnly')}</p>}
          <ul className="space-y-3" data-testid="beneficiary-list">
            {beneficiaries.length === 0 && (
              <li className="text-muted">{t('beneficiaries.empty')}</li>
            )}
            {beneficiaries.map((b) => (
              <li
                key={b.id}
                data-code={b.publicCode}
                data-testid="beneficiary-row"
                className="rounded-2xl border border-border bg-surface p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <span
                    dir="ltr"
                    className="rounded-xl bg-accent-soft px-3 py-2 font-display text-lg font-bold tabular-nums text-accent-strong"
                  >
                    {b.publicCode}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{tKinds(b.kind)}</span>
                      {b.area && <span className="text-sm text-muted">{b.area}</span>}
                      {b.isSuspended && (
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-muted">
                          {t('beneficiaries.suspended')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm">
                      <span className="me-1.5 rounded bg-warning-soft px-1.5 py-0.5 text-xs font-semibold text-warning">
                        {t('beneficiaries.privateNote')}
                      </span>
                      {b.fullName}
                      {b.phone && (
                        <span dir="ltr" className="ms-2 text-muted">
                          {b.phone}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs font-medium text-muted">{t('beneficiaries.campaigns')}</p>
                  {b.campaignLinks.length === 0 ? (
                    <p className="mt-1 text-sm text-muted">{t('beneficiaries.noCampaigns')}</p>
                  ) : (
                    <ul className="mt-2 space-y-2" data-testid="beneficiary-links">
                      {b.campaignLinks.map((l) => (
                        <li
                          key={l.campaign.id}
                          className="rounded-xl bg-surface-muted px-3 py-2"
                          data-slug={l.campaign.slug}
                        >
                          <div className="flex flex-wrap items-baseline gap-2">
                            <Link
                              href={`/campaigns/${l.campaign.slug}`}
                              className="text-sm font-semibold hover:text-accent"
                            >
                              {locale === 'en'
                                ? (l.campaign.titleEn ?? l.campaign.titleAr)
                                : l.campaign.titleAr}
                            </Link>
                            {l.monthlyAmount && (
                              <span className="text-xs tabular-nums text-muted">
                                {formatMoney(l.monthlyAmount, 'SYP', locale)}{' '}
                                {t('beneficiaries.monthly')}
                              </span>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="mt-2">
                              <LinkControls
                                key={l.monthlyAmount ?? 'none'}
                                beneficiaryId={b.id}
                                campaignId={l.campaign.id}
                                slug={l.campaign.slug}
                                monthlyAmount={l.monthlyAmount}
                              />
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-3 flex flex-col gap-2">
                    {!b.isSuspended && (
                      <details>
                        <summary className="cursor-pointer text-sm font-medium text-accent">
                          {t('beneficiaries.link')}
                        </summary>
                        <div className="mt-3">
                          <LinkForm beneficiaryId={b.id} campaigns={linkable} />
                        </div>
                      </details>
                    )}
                    <details>
                      <summary className="cursor-pointer text-sm font-medium text-accent">
                        {t('beneficiaries.edit')}
                      </summary>
                      <div className="mt-3">
                        <EditBeneficiaryForm key={JSON.stringify(b)} beneficiary={b} />
                      </div>
                    </details>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">{tAdmin('newBeneficiary')}</h2>
            <div className="mt-4">
              <NewBeneficiaryForm />
            </div>
          </section>
        </aside>
      </div>
    </WorkspacePage>
  );
}
