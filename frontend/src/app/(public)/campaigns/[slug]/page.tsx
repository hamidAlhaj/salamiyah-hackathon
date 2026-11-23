import { DATE_MEDIUM } from '@/lib/format';
import type { Metadata } from 'next';
import Link from 'next/link';
import { NextIntlClientProvider } from 'next-intl';
import { getFormatter, getLocale, getMessages, getTranslations } from 'next-intl/server';
import { BeneficiaryList } from '@/components/campaigns/BeneficiaryList';
import { CampaignCover } from '@/components/campaigns/CampaignCover';
import { CategoryIcon } from '@/components/campaigns/CategoryIcon';
import { fundingSegments } from '@/components/campaigns/funding';
import { LedgerCard } from '@/components/campaigns/LedgerCard';
import { ReceivingAccounts } from '@/components/campaigns/ReceivingAccounts';
import { ShareButtons } from '@/components/campaigns/ShareButtons';
import { SpendingTimeline } from '@/components/campaigns/SpendingTimeline';
import { listCampaignBeneficiaries } from '@/lib/api/beneficiaries';
import { getCampaign, getLedger } from '@/lib/api/campaigns';
import { publicSpending } from '@/lib/api/expenditures';
import { orNotFound } from '@/lib/api/client';
import { getCampaignAccounts } from '@/lib/api/payment-methods';

type Props = { params: Promise<{ slug: string }> };

async function lang(): Promise<'ar' | 'en'> {
  return (await getLocale()) === 'en' ? 'en' : 'ar';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await orNotFound(getCampaign(slug, await lang()));
  const description = campaign.summary.slice(0, 160);
  // Link previews (WhatsApp, Telegram, Facebook): the anonymised title and summary; the image is
  // the campaign's opengraph-image (illustration + progress, never a beneficiary).
  return {
    title: campaign.title,
    description,
    metadataBase: new URL(siteUrl()),
    alternates: { canonical: `/campaigns/${campaign.slug}` },
    openGraph: {
      type: 'website',
      siteName: 'Majlis Fund · مجلس فند',
      title: campaign.title,
      description,
      url: `/campaigns/${campaign.slug}`,
      locale: (await lang()) === 'en' ? 'en_US' : 'ar_SY',
    },
    twitter: { card: 'summary_large_image', title: campaign.title, description },
  };
}

/** The public address in shared links and previews (SITE_URL; the LAN address during the demo). */
function siteUrl(): string {
  return (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

export default async function CampaignPage({ params }: Props) {
  const { slug } = await params;
  const locale = await lang();
  const campaign = await orNotFound(getCampaign(slug, locale));
  const [ledger, accounts, beneficiaries, spending] = await Promise.all([
    getLedger(campaign.id),
    getCampaignAccounts(campaign.id, locale),
    listCampaignBeneficiaries(campaign.id),
    publicSpending(campaign.id, locale),
  ]);
  const t = await getTranslations('campaign');
  const tPriority = await getTranslations('priority');
  const format = await getFormatter();
  // The live ledger is a Client Component: it only needs the campaign texts.
  const { campaign: campaignMessages } = await getMessages();

  const { verifiedPercent } = fundingSegments({
    target: ledger.targetAmount,
    verified: ledger.verifiedAmount,
    pending: ledger.pendingAmount,
    demo: ledger.demoAmount,
  });
  const shareText = t('shareText', { title: campaign.title, percent: verifiedPercent });
  const statusLabel =
    campaign.status === 'COMPLETED'
      ? t('completed')
      : campaign.status === 'FUNDED'
        ? t('funded')
        : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" data-testid="campaign-page">
      <Link href="/#campaigns" className="text-sm font-medium text-accent hover:underline">
        {t('backToAll')}
      </Link>

      <header className="mt-4">
        <div className="relative h-48 overflow-hidden rounded-[28px] border border-border sm:h-64">
          <CampaignCover coverKey={campaign.coverKey} />
          {campaign.status === 'COMPLETED' && (
            <div
              className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-panel/95 px-5 py-3 text-white"
              data-testid="completed-banner"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  aria-hidden="true"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span>
                <span className="block font-display text-lg font-bold leading-tight">
                  {t('completed')}
                </span>
                <span className="block text-sm text-panel-ink/85">{t('completedNote')}</span>
              </span>
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-strong"
            data-testid="campaign-category"
          >
            <CategoryIcon icon={campaign.category.icon} className="h-4 w-4" />
            {campaign.category.name}
          </span>
          {campaign.priority !== 'NORMAL' && (
            <span className="rounded-full bg-danger-soft px-3 py-1 text-sm font-semibold text-danger">
              {tPriority(campaign.priority)}
            </span>
          )}
          {statusLabel && (
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                campaign.status === 'COMPLETED'
                  ? 'bg-brand-600 text-white dark:bg-brand-600'
                  : 'bg-surface-muted'
              }`}
            >
              {statusLabel}
            </span>
          )}
        </div>
        <h1 className="mt-3 max-w-[30ch] font-display text-3xl font-bold leading-snug sm:text-4xl">
          {campaign.title}
        </h1>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {campaign.area && (
            <span>
              {t('area')}: {campaign.area}
            </span>
          )}
          <span>{t('beneficiaries', { count: ledger.beneficiariesCount })}</span>
          {campaign.hospitalName && (
            <span>
              {t('hospital')}: {campaign.hospitalName}
            </span>
          )}
          {campaign.fileNo && (
            <span dir="ltr">
              {t('fileNo')}: {campaign.fileNo}
            </span>
          )}
        </p>
      </header>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-10">
          <p className="max-w-[70ch] text-lg leading-relaxed">{campaign.summary}</p>

          <BeneficiaryList beneficiaries={beneficiaries} currency={campaign.currency} />

          <SpendingTimeline items={spending} />

          <section aria-labelledby="updates-title">
            <h2 id="updates-title" className="font-display text-xl font-bold">
              {t('updates')}
            </h2>
            {campaign.updates.length === 0 ? (
              <p className="mt-2 text-sm text-muted">{t('noUpdates')}</p>
            ) : (
              <ol className="mt-3 space-y-3 border-s-2 border-border ps-5">
                {campaign.updates.map((u) => (
                  <li key={u.id}>
                    <time className="text-xs text-muted" dateTime={u.createdAt}>
                      {format.dateTime(new Date(u.createdAt), DATE_MEDIUM)}
                    </time>
                    <p className="mt-0.5">{u.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="order-first space-y-5 lg:order-none lg:sticky lg:top-24 lg:self-start">
          <NextIntlClientProvider messages={{ campaign: campaignMessages }}>
            <LedgerCard
              ledger={ledger}
              acceptsPledges={campaign.acceptsPledges}
              donateHref={`/campaigns/${campaign.slug}/donate`}
            />
          </NextIntlClientProvider>
          <ShareButtons url={`${siteUrl()}/campaigns/${campaign.slug}`} text={shareText} />
          <ReceivingAccounts accounts={accounts} />
        </aside>
      </div>
    </div>
  );
}
