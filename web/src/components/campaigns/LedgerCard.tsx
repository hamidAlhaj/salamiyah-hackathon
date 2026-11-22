import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { formatMoney, type CampaignLedger } from '@/shared';
import { buttonClasses } from '@/components/ui/Button';
import { DemoBadge } from './DemoBadge';
import { FundingBar } from './FundingBar';

/**
 * The campaign account as a statement: collected (verified), pending, demo (separate, «Demo»),
 * spent and remaining = verified − spent. Values come straight from GET /campaigns/:id/ledger.
 */
export function LedgerCard({
  ledger,
  donateHref,
  acceptsPledges,
}: {
  ledger: CampaignLedger;
  donateHref: string;
  acceptsPledges: boolean;
}) {
  const t = useTranslations('campaign');
  const locale = useLocale() === 'en' ? 'en' : 'ar';
  const money = (v: string) => formatMoney(v, ledger.currency, locale);
  const row = 'flex items-baseline justify-between gap-4 py-2.5';

  return (
    <section
      aria-labelledby="ledger-title"
      className="rounded-2xl border border-border bg-surface p-6 shadow-card"
      data-testid="campaign-ledger"
    >
      <h2 id="ledger-title" className="font-display text-lg font-bold">
        {t('account')}
      </h2>
      <div className="mt-4">
        <FundingBar
          target={ledger.targetAmount}
          verified={ledger.verifiedAmount}
          pending={ledger.pendingAmount}
          demo={ledger.demoAmount}
          label={t('progressLabel')}
          legend={{ verified: t('verified'), pending: t('pending'), demo: t('demo') }}
        />
      </div>
      <dl className="mt-4 divide-y divide-border text-sm">
        <div className={row}>
          <dt className="text-muted">{t('target')}</dt>
          <dd className="tabular-nums" data-ledger="target" data-value={ledger.targetAmount}>
            {money(ledger.targetAmount)}
          </dd>
        </div>
        <div className={row}>
          <dt>{t('verified')}</dt>
          <dd
            className="font-semibold tabular-nums"
            data-ledger="verified"
            data-value={ledger.verifiedAmount}
          >
            {money(ledger.verifiedAmount)}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-muted">{t('pending')}</dt>
          <dd className="tabular-nums" data-ledger="pending" data-value={ledger.pendingAmount}>
            {money(ledger.pendingAmount)}
          </dd>
        </div>
        <div className={row}>
          <dt className="flex items-center gap-2 text-muted">
            {t('demo')} <DemoBadge label={t('demoBadge')} />
          </dt>
          <dd className="tabular-nums text-muted" data-ledger="demo" data-value={ledger.demoAmount}>
            {money(ledger.demoAmount)}
          </dd>
        </div>
        <div className={row}>
          <dt>{t('spent')}</dt>
          <dd className="tabular-nums" data-ledger="spent" data-value={ledger.spentAmount}>
            {money(ledger.spentAmount)}
          </dd>
        </div>
        <div className={`${row} pt-3`}>
          <dt className="font-semibold">{t('remaining')}</dt>
          <dd
            className="font-display text-xl font-bold tabular-nums text-accent"
            data-ledger="remaining"
            data-value={ledger.remainingAmount}
          >
            {money(ledger.remainingAmount)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-muted">
        {t('accountNote')} {t('demoNote')}
      </p>
      {acceptsPledges ? (
        <Link
          href={donateHref}
          className={buttonClasses('give', 'lg', 'mt-5 w-full')}
          data-testid="donate-cta"
        >
          {t('donateNow')}
        </Link>
      ) : (
        <p className="mt-5 rounded-xl bg-surface-muted px-4 py-3 text-sm text-muted">
          {t('notAccepting')}
        </p>
      )}
    </section>
  );
}
