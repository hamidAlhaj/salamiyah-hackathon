import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { DATE_MEDIUM } from '@/lib/format';
import { formatMoney, type PublicExpenditure } from '@/shared';

/**
 * «سجل الصرف»: every amount spent from the campaign, newest first, with its published proof. A
 * beneficiary payment shows the beneficiary's code only; nothing here identifies a person.
 */
export async function SpendingTimeline({ items }: { items: PublicExpenditure[] }) {
  const t = await getTranslations('campaign');
  const tp = await getTranslations('spending');
  const format = await getFormatter();
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';

  return (
    <section aria-labelledby="spending-title" data-testid="spending-timeline">
      <h2 id="spending-title" className="font-display text-xl font-bold">
        {t('spendingTitle')}
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted">
          {t('spendingEmpty')}
        </p>
      ) : (
        <ol className="mt-4 space-y-3 border-s-2 border-border ps-5">
          {items.map((e) => (
            <li
              key={e.id}
              className="relative rounded-2xl border border-border bg-surface p-4 shadow-card"
              data-payee={e.payeeType}
              data-amount={e.amount}
            >
              <span
                aria-hidden="true"
                className="absolute -start-[1.6rem] top-5 h-3 w-3 rounded-full border-2 border-surface bg-brand-600"
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-sm">
                  <span className="font-semibold">
                    {e.beneficiaryCode ? <span dir="ltr">{e.beneficiaryCode}</span> : e.payeeLabel}
                  </span>
                  <span className="text-muted"> — {tp(`payeeTypes.${e.payeeType}`)}</span>
                </p>
                <p className="font-display text-lg font-bold tabular-nums">
                  {formatMoney(e.amount, e.currency, locale)}
                </p>
              </div>
              <p className="mt-1 text-sm leading-relaxed">{e.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                <time dateTime={e.paidAt}>{format.dateTime(new Date(e.paidAt), DATE_MEDIUM)}</time>
                {e.proof ? (
                  <a
                    href={`/api/proofs/${e.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-semibold text-accent hover:underline"
                    data-testid="public-proof"
                  >
                    {e.proof.mimeType.startsWith('image/') && (
                      // Public-safe proof through the same-origin proxy (next/image cannot load it).
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/proofs/${e.id}`}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 rounded-lg border border-border object-cover"
                      />
                    )}
                    {tp('viewProof')}
                  </a>
                ) : (
                  <span>{tp('proofKeptByCouncil')}</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
