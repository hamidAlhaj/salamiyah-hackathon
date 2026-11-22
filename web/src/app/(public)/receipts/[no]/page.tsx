import type { Metadata } from 'next';
import Link from 'next/link';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { CategoryIcon } from '@/components/campaigns/CategoryIcon';
import { buttonClasses } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/Logo';
import { StarLattice } from '@/components/ui/StarLattice';
import { ApiError } from '@/lib/api/client';
import { getOfficialReceipt } from '@/lib/api/receipts';
import { DATE_LONG } from '@/lib/format';
import { formatMoney, whatsappShareUrl } from '@/shared';
import { PrintButton } from './PrintButton';

type Props = { params: Promise<{ no: string }> };

const RECEIPT_NO = /^R-\d{4}-\d{6}$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { no } = await params;
  const t = await getTranslations('receipt');
  // A receipt page is personal: keep it out of search engines.
  return { title: `${t('title')} ${decodeURIComponent(no)}`, robots: { index: false } };
}

/**
 * The public official receipt (issued only after finance verification). Its QR code encodes this
 * very page, so anyone can scan a printed receipt and check it against the council's record. Never
 * a phone number or a beneficiary identity. Prints as a clean A5-like slip (see globals.css).
 */
export default async function ReceiptPage({ params }: Props) {
  const no = decodeURIComponent((await params).no);
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const t = await getTranslations('receipt');
  if (!RECEIPT_NO.test(no)) return <ReceiptNotFound no={no} />;
  const receipt = await getOfficialReceipt(no, locale).catch((err: unknown) => {
    if (err instanceof ApiError && err.statusCode === 404) return null;
    throw err;
  });
  if (!receipt) return <ReceiptNotFound no={no} />;
  const format = await getFormatter();
  const share = whatsappShareUrl(t('shareText', { no: receipt.receiptNo, url: receipt.url }));
  // The SVG comes from our API's QR generator; render it only if it is an <svg> without scripts.
  const qr =
    /^<svg[\s>]/.test(receipt.qrSvg) && !/<script/i.test(receipt.qrSvg) ? receipt.qrSvg : null;

  return (
    <div className="receipt-page mx-auto max-w-xl px-4 py-10 sm:px-6 print:max-w-none print:p-0">
      <article
        className="overflow-hidden rounded-[28px] border border-border bg-surface shadow-lift print:rounded-none print:border-0 print:shadow-none"
        data-testid="official-receipt"
        data-receipt-no={receipt.receiptNo}
      >
        <header className="relative isolate overflow-hidden bg-panel px-6 py-6 text-white print:bg-white print:text-black">
          <StarLattice className="absolute inset-0 -z-10 h-full w-full print:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoMark className="h-11 w-11" />
              <div>
                <p className="text-sm text-panel-ink/85 print:text-black">{t('council')}</p>
                <h1 className="font-display text-xl font-bold">{t('title')}</h1>
              </div>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white print:border print:border-black print:text-black"
              data-testid="receipt-status"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              {t('verified')}
            </span>
          </div>
          <dl className="mt-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <dt className="text-xs text-panel-ink/80 print:text-black">{t('no')}</dt>
              <dd dir="ltr" className="text-start font-display text-2xl font-bold tracking-wide">
                {receipt.receiptNo}
              </dd>
            </div>
            <div className="text-end">
              <dt className="text-xs text-panel-ink/80 print:text-black">{t('amount')}</dt>
              <dd
                className="font-display text-2xl font-bold tabular-nums"
                data-testid="receipt-amount"
              >
                {formatMoney(receipt.amount, receipt.currency, locale)}
              </dd>
            </div>
          </dl>
        </header>

        <dl className="divide-y divide-border px-6 text-sm">
          <Row label={t('donor')}>
            <span className="font-semibold">{receipt.donorName || t('anonymousDonor')}</span>
          </Row>
          <Row label={t('method')}>
            {receipt.methodLabel}
            {receipt.collectionPoint && (
              <span className="block text-xs text-muted">
                {receipt.collectionPoint.name} ({t(`pointTypes.${receipt.collectionPoint.type}`)})
              </span>
            )}
          </Row>
          <Row label={t('campaign')}>
            <Link
              href={`/campaigns/${receipt.campaignSlug}`}
              className="font-medium text-accent hover:underline print:text-black print:no-underline"
            >
              {receipt.campaignTitle}
            </Link>
            <span className="mt-0.5 flex items-center justify-end gap-1 text-xs text-muted">
              <CategoryIcon icon={receipt.category.icon} className="h-3.5 w-3.5" />
              {receipt.category.name}
            </span>
          </Row>
          <Row label={t('date')}>{format.dateTime(new Date(receipt.verifiedAt), DATE_LONG)}</Row>
        </dl>

        <section
          aria-labelledby="verify-title"
          className="grid gap-5 border-t border-border bg-surface-muted px-6 py-6 sm:grid-cols-[auto_1fr] print:bg-white"
        >
          {qr && (
            <figure
              className="mx-auto w-40 shrink-0 sm:mx-0"
              data-testid="receipt-qr"
              data-qr-url={receipt.url}
            >
              <div
                className="overflow-hidden rounded-xl border border-border bg-white p-1"
                // eslint-disable-next-line react/no-danger -- server-generated QR SVG, checked above
                dangerouslySetInnerHTML={{ __html: qr }}
              />
              <figcaption className="mt-2 text-center text-xs text-muted">{t('scan')}</figcaption>
            </figure>
          )}
          <div>
            <h2 id="verify-title" className="font-display text-lg font-bold">
              {t('verifyTitle')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t('verifyBody')}</p>
            <p dir="ltr" className="mt-2 break-all text-start text-xs text-muted">
              {receipt.url}
            </p>
          </div>
        </section>

        <footer className="border-t border-border px-6 py-4 text-xs text-muted">
          <p>{t('thanks')}</p>
        </footer>
      </article>

      <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
        <PrintButton label={t('print')} />
        <a
          href={share}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses('secondary', 'md')}
        >
          {t('sendWhatsapp')}
        </a>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-end">{children}</dd>
    </div>
  );
}

async function ReceiptNotFound({ no }: { no: string }) {
  const t = await getTranslations('receipt');
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center" data-testid="receipt-not-found">
      <div className="rounded-[28px] border border-border bg-surface p-8 shadow-card">
        <h1 className="font-display text-2xl font-bold">{t('notFound')}</h1>
        <p className="mt-2 text-muted">{t('notFoundBody', { no })}</p>
        <Link href="/" className={buttonClasses('primary', 'md', 'mt-6')}>
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
