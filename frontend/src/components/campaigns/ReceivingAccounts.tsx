import { useTranslations } from 'next-intl';
import type { PaymentAccount } from '@/shared';
import { CopyButton } from './CopyButton';
import { DemoBadge } from './DemoBadge';

/** The campaign's receiving accounts (fake for the hackathon), with one-tap copy of each number. */
export function ReceivingAccounts({ accounts }: { accounts: PaymentAccount[] }) {
  const t = useTranslations('campaign');
  const withNumber = accounts.filter((a) => a.accountNumber);
  const demoOnly = accounts.filter((a) => !a.accountNumber && a.allowsDemoCheckout);

  return (
    <section
      aria-labelledby="accounts-title"
      className="rounded-2xl border border-border bg-surface p-6 shadow-card"
      data-testid="receiving-accounts"
    >
      <h2 id="accounts-title" className="font-display text-lg font-bold">
        {t('receivingTitle')}
      </h2>
      <p className="mt-1 text-xs text-muted">{t('receivingNote')}</p>
      <ul className="mt-4 space-y-3">
        {withNumber.map((a) => (
          <li key={a.method} className="rounded-xl bg-surface-muted p-3" data-method={a.method}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{a.label}</p>
              {a.source === 'campaign' && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-strong">
                  {t('campaignAccount')}
                </span>
              )}
            </div>
            {a.accountName && <p className="mt-0.5 text-xs text-muted">{a.accountName}</p>}
            <div className="mt-2 flex items-center justify-between gap-2">
              <code dir="ltr" className="select-all text-sm font-semibold tabular-nums">
                {a.accountNumber}
              </code>
              <CopyButton
                value={a.accountNumber ?? ''}
                label={t('copyLabel', { method: a.label })}
                copyText={t('copy')}
                copiedText={t('copied')}
              />
            </div>
            {a.note && <p className="mt-1 text-xs text-muted">{a.note}</p>}
          </li>
        ))}
      </ul>
      {demoOnly.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <DemoBadge label={t('demoBadge')} />
          {t('demoCheckout')}: {demoOnly.map((a) => a.label).join(' / ')}
        </p>
      )}
    </section>
  );
}
