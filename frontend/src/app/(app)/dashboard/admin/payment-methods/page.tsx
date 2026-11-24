import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { ActiveBadge, ActiveToggle } from '@/components/admin/ActiveToggle';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { buttonClasses } from '@/components/ui/Button';
import { controlClass, labelClass } from '@/components/ui/Field';
import { setPaymentMethodActiveAction } from '@/lib/actions/payment-methods';
import { listStaffCampaigns } from '@/lib/api/admin-campaigns';
import { listCampaignOverrides, listPaymentMethodConfigs } from '@/lib/api/admin-payment-methods';
import { isUuid } from '@/lib/actions/validation';
import { requireWorkspace } from '@/lib/auth';
import type { PaymentMethodConfigRow } from '@/lib/types/staff';
import { ConfigForm, OverrideForms } from './PaymentForms';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('adminSetup');
  return { title: t('payments.title') };
}

const PUBLIC_STATUSES = ['ACTIVE', 'FUNDED', 'COMPLETED'];

/**
 * ADMIN: the default (fake) receiving accounts per payment method, and per-campaign accounts that
 * replace a default on that campaign's donate page. The campaign is picked with a plain GET form.
 */
export default async function PaymentMethodsPage({
  searchParams,
}: {
  searchParams: Promise<{ campaign?: string }>;
}) {
  const { token, allowed } = await requireWorkspace('paymentMethods');
  if (!allowed) return <NotForYourRole />;
  const t = await getTranslations('adminSetup');
  const tCommon = await getTranslations('common');
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const requested = (await searchParams).campaign;
  const campaignId = isUuid(requested) ? requested : undefined;
  const [configs, campaigns, overrides] = await Promise.all([
    listPaymentMethodConfigs(token),
    listStaffCampaigns(token),
    campaignId ? listCampaignOverrides(token, campaignId) : Promise.resolve([]),
  ]);
  const campaign = campaigns.find((c) => c.id === campaignId);
  const label = (c: PaymentMethodConfigRow) => (locale === 'en' ? c.labelEn : c.labelAr);
  const holder = (c: PaymentMethodConfigRow) =>
    (locale === 'en' ? (c.accountNameEn ?? c.accountName) : c.accountName) ?? '';
  // Only transfer and wallet methods have a receiving account: cash goes to a collection point,
  // cards are a simulated checkout.
  const hasAccount = (c: PaymentMethodConfigRow) => c.kind === 'TRANSFER' || c.kind === 'WALLET';
  const overridable = configs.filter((c) => c.isActive && hasAccount(c));

  return (
    <WorkspacePage title={t('payments.title')} intro={t('payments.intro')} testId="payments-page">
      <section aria-labelledby="defaults-title">
        <h2 id="defaults-title" className="font-display text-lg font-bold">
          {t('payments.defaults')}
        </h2>
        <p className="mt-1 text-xs text-muted">{t('payments.flagsNote')}</p>
        <ul className="mt-4 grid gap-3 lg:grid-cols-2" data-testid="config-list">
          {configs.map((c) => (
            <li
              key={c.method}
              data-method={c.method}
              className={`rounded-2xl border bg-surface p-5 shadow-card ${c.isActive ? 'border-border' : 'border-dashed border-control opacity-80'}`}
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold">{label(c)}</h3>
                    <ActiveBadge isActive={c.isActive} />
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted">
                    {c.kind === 'CASH' && (
                      <li className="rounded-lg border border-border px-2 py-0.5">
                        {t('payments.cash')}
                      </li>
                    )}
                    {c.allowsReceiptUpload && (
                      <li className="rounded-lg border border-border px-2 py-0.5">
                        {t('payments.receipt')}
                      </li>
                    )}
                    {c.allowsDemoCheckout && (
                      <li className="rounded-lg bg-warning-soft px-2 py-0.5 font-semibold text-warning">
                        {t('payments.demo')}
                      </li>
                    )}
                  </ul>
                </div>
                <ActiveToggle
                  action={setPaymentMethodActiveAction}
                  fields={{ method: c.method }}
                  isActive={c.isActive}
                  testId={`config-toggle-${c.method}`}
                />
              </div>
              {hasAccount(c) && (
                <div className="mt-3 rounded-xl bg-surface-muted px-3 py-2">
                  <p className="text-xs text-muted">{holder(c) || '—'}</p>
                  <p dir="ltr" className="text-start font-semibold tabular-nums">
                    {c.accountNumber ?? t('payments.noAccount')}
                  </p>
                </div>
              )}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-accent">
                  {tCommon('edit')}
                </summary>
                <div className="mt-4">
                  <ConfigForm key={JSON.stringify(c)} config={c} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="overrides-title" className="mt-10" data-testid="overrides">
        <h2 id="overrides-title" className="font-display text-lg font-bold">
          {t('payments.overrides')}
        </h2>
        <p className="mt-1 max-w-[70ch] text-sm text-muted">{t('payments.overridesIntro')}</p>
        <form
          method="get"
          className="mt-4 flex flex-wrap items-end gap-3"
          data-testid="campaign-picker"
        >
          <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-md">
            <label htmlFor="pick-campaign" className={labelClass}>
              {t('payments.campaign')}
            </label>
            <select
              id="pick-campaign"
              name="campaign"
              defaultValue={campaignId ?? ''}
              className={controlClass}
            >
              <option value="" disabled>
                {t('payments.pickPrompt')}
              </option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titleAr}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={buttonClasses('secondary')}>
            {t('payments.choose')}
          </button>
        </form>

        {campaign ? (
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-display text-base font-bold">{campaign.titleAr}</h3>
              {PUBLIC_STATUSES.includes(campaign.status) && (
                <Link
                  href={`/campaigns/${campaign.slug}/donate`}
                  className="text-sm font-medium text-accent underline-offset-2 hover:underline"
                >
                  {t('payments.viewDonate')}
                </Link>
              )}
            </div>
            <ul className="mt-4 grid gap-3 lg:grid-cols-2">
              {overridable.map((c) => {
                const own = overrides.find((o) => o.method === c.method);
                return (
                  <li
                    key={c.method}
                    data-testid={`override-${c.method}`}
                    className={`rounded-2xl border bg-surface p-5 shadow-card ${own ? 'border-brand-600' : 'border-border'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold">{label(c)}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${own ? 'bg-accent-soft text-accent-strong' : 'bg-surface-muted text-muted'}`}
                      >
                        {own ? t('payments.fromCampaign') : t('payments.fromDefault')}
                      </span>
                    </div>
                    <div className="mt-3 rounded-xl bg-surface-muted px-3 py-2">
                      <p className="text-xs text-muted">
                        {t('payments.current')}: {own ? own.accountName : holder(c) || '—'}
                      </p>
                      <p
                        dir="ltr"
                        className="text-start font-semibold tabular-nums"
                        data-testid="current-number"
                      >
                        {own ? own.accountNumber : (c.accountNumber ?? t('payments.noAccount'))}
                      </p>
                    </div>
                    <details className="mt-3" open={Boolean(own)}>
                      <summary className="cursor-pointer text-sm font-medium text-accent">
                        {tCommon('edit')}
                      </summary>
                      <div className="mt-4">
                        <OverrideForms
                          key={JSON.stringify(own ?? null)}
                          campaignId={campaign.id}
                          slug={campaign.slug}
                          method={c.method}
                          override={own}
                        />
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-control px-5 py-6 text-sm text-muted">
            {t('payments.pickPrompt')}
          </p>
        )}
      </section>
    </WorkspacePage>
  );
}
