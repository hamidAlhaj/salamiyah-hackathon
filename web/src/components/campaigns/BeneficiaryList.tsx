import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { formatMoney, type Currency, type PublicBeneficiary } from '@/shared';

/** Anonymised beneficiaries: code, kind, area, monthly amount. Never a name, phone or national ID. */
export function BeneficiaryList({
  beneficiaries,
  currency,
}: {
  beneficiaries: PublicBeneficiary[];
  currency: Currency;
}) {
  const t = useTranslations('campaign');
  const format = useFormatter();
  const locale = useLocale() === 'en' ? 'en' : 'ar';

  return (
    <section aria-labelledby="beneficiaries-title" data-testid="beneficiaries">
      <h2 id="beneficiaries-title" className="font-display text-xl font-bold">
        {t('beneficiariesTitle')}{' '}
        <span className="text-base font-normal text-muted">
          ({t('beneficiaries', { count: beneficiaries.length })})
        </span>
      </h2>
      <p className="mt-1 text-sm text-muted">{t('beneficiariesNote')}</p>
      {beneficiaries.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t('beneficiariesEmpty')}</p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {beneficiaries.map((b) => (
            <li
              key={b.code}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <div>
                <p dir="ltr" className="text-start font-display font-bold text-accent-strong">
                  {b.code}
                </p>
                <p className="text-xs text-muted">
                  {t(`kinds.${b.kind}`)}
                  {b.area ? ` — ${b.area}` : ''}
                </p>
              </div>
              <div className="text-end text-xs text-muted">
                {b.monthlyAmount && (
                  <p className="font-semibold text-ink">
                    {t('monthly', { amount: formatMoney(b.monthlyAmount, currency, locale) })}
                  </p>
                )}
                <p>
                  {t('since', {
                    date: format.dateTime(new Date(b.since), { dateStyle: 'medium' }),
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
