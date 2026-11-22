import type { Metadata } from 'next';
import Link from 'next/link';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { LogoMark } from '@/components/ui/Logo';
import { StarLattice } from '@/components/ui/StarLattice';
import { orNotFound } from '@/lib/api/client';
import { getOfficialReceipt } from '@/lib/api/receipts';
import { formatMoney } from '@/shared';

type Props = { params: Promise<{ no: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { no } = await params;
  const t = await getTranslations('receipt');
  return { title: `${t('title')} ${decodeURIComponent(no)}` };
}

/** Public official receipt by number (issued only after finance verification). QR arrives in P13. */
export default async function ReceiptPage({ params }: Props) {
  const { no } = await params;
  const receipt = await orNotFound(getOfficialReceipt(decodeURIComponent(no)));
  const t = await getTranslations('receipt');
  const format = await getFormatter();
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <article
        className="overflow-hidden rounded-[28px] border border-border bg-surface shadow-lift"
        data-testid="official-receipt"
      >
        <header className="relative isolate overflow-hidden bg-panel px-6 py-6 text-white">
          <StarLattice className="absolute inset-0 -z-10 h-full w-full" />
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-10" />
            <div>
              <h1 className="font-display text-xl font-bold">{t('title')}</h1>
              <p dir="ltr" className="text-start text-sm text-panel-ink/85">
                {receipt.receiptNo}
              </p>
            </div>
          </div>
        </header>
        <dl className="divide-y divide-border px-6 text-sm">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-muted">{t('donor')}</dt>
            <dd className="font-semibold">{receipt.donorName || t('anonymousDonor')}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-muted">{t('amount')}</dt>
            <dd className="font-display text-lg font-bold tabular-nums">
              {formatMoney(receipt.amount, receipt.currency, locale)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-muted">{t('campaign')}</dt>
            <dd className="text-end">
              <Link
                href={`/campaigns/${receipt.campaignSlug}`}
                className="font-medium text-accent hover:underline"
              >
                {receipt.campaignTitle}
              </Link>
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-muted">{t('date')}</dt>
            <dd>{format.dateTime(new Date(receipt.verifiedAt), { dateStyle: 'long' })}</dd>
          </div>
        </dl>
        <footer className="border-t border-border bg-surface-muted px-6 py-4 text-xs text-muted">
          <p>{t('thanks')}</p>
          <p className="mt-1">{t('verifyNote')}</p>
        </footer>
      </article>
    </div>
  );
}
