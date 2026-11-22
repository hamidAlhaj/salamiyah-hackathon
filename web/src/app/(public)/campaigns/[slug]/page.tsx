import { DATE_MEDIUM } from '@/lib/format';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { BeneficiaryList } from '@/components/campaigns/BeneficiaryList';
import { CampaignCover } from '@/components/campaigns/CampaignCover';
import { CategoryIcon } from '@/components/campaigns/CategoryIcon';
import { fundingSegments } from '@/components/campaigns/funding';
import { LedgerCard } from '@/components/campaigns/LedgerCard';
import { ReceivingAccounts } from '@/components/campaigns/ReceivingAccounts';
import { buttonClasses } from '@/components/ui/Button';
import { listCampaignBeneficiaries } from '@/lib/api/beneficiaries';
import { getCampaign, getLedger } from '@/lib/api/campaigns';
import { orNotFound } from '@/lib/api/client';
import { getCampaignAccounts } from '@/lib/api/payment-methods';
import { whatsappShareUrl } from '@/shared';

type Props = { params: Promise<{ slug: string }> };

async function lang(): Promise<'ar' | 'en'> {
  return (await getLocale()) === 'en' ? 'en' : 'ar';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await orNotFound(getCampaign(slug, await lang()));
  return { title: campaign.title, description: campaign.summary.slice(0, 160) };
}

export default async function CampaignPage({ params }: Props) {
  const { slug } = await params;
  const locale = await lang();
  const campaign = await orNotFound(getCampaign(slug, locale));
  const [ledger, accounts, beneficiaries] = await Promise.all([
    getLedger(campaign.id),
    getCampaignAccounts(campaign.id, locale),
    listCampaignBeneficiaries(campaign.id),
  ]);
  const t = await getTranslations('campaign');
  const tPriority = await getTranslations('priority');
  const format = await getFormatter();

  const siteUrl = process.env.SITE_URL ?? 'http://localhost:3000';
  const { verifiedPercent } = fundingSegments({
    target: ledger.targetAmount,
    verified: ledger.verifiedAmount,
    pending: ledger.pendingAmount,
    demo: ledger.demoAmount,
  });
  const shareUrl = whatsappShareUrl(
    t('shareText', {
      title: campaign.title,
      percent: verifiedPercent,
      url: `${siteUrl}/campaigns/${campaign.slug}`,
    }),
  );
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
            <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold">
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

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-10">
          <p className="max-w-[70ch] text-lg leading-relaxed">{campaign.summary}</p>

          <BeneficiaryList beneficiaries={beneficiaries} currency={campaign.currency} />

          <section aria-labelledby="spending-title">
            <h2 id="spending-title" className="font-display text-xl font-bold">
              {t('spendingTitle')}
            </h2>
            <p className="mt-2 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted">
              {t('spendingEmpty')}
            </p>
          </section>

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
          <LedgerCard
            ledger={ledger}
            acceptsPledges={campaign.acceptsPledges}
            donateHref={`/campaigns/${campaign.slug}/donate`}
          />
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses('secondary', 'md', 'w-full')}
          >
            {t('shareWhatsapp')}
          </a>
          <ReceivingAccounts accounts={accounts} />
        </aside>
      </div>
    </div>
  );
}
