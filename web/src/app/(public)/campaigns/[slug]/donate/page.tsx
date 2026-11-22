import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { ReceivingAccounts } from '@/components/campaigns/ReceivingAccounts';
import { getCampaign } from '@/lib/api/campaigns';
import { orNotFound } from '@/lib/api/client';
import { getCampaignAccounts } from '@/lib/api/payment-methods';

/** Placeholder: the donation flow (simulated payment, transfer + receipt, cash point) is P10. */
export default async function DonatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const campaign = await orNotFound(getCampaign(slug, locale));
  const accounts = await getCampaignAccounts(campaign.id, locale);
  const t = await getTranslations('donate');

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6" data-testid="donate-page">
      <Link
        href={`/campaigns/${campaign.slug}`}
        className="text-sm font-medium text-accent hover:underline"
      >
        {t('back')}
      </Link>
      <h1 className="mt-4 font-display text-2xl font-bold leading-snug">
        {t('title', { title: campaign.title })}
      </h1>
      <p className="mt-3 text-muted">{t('intro')}</p>
      <p className="mt-1 text-muted">{t('meanwhile')}</p>
      <div className="mt-6">
        <ReceivingAccounts accounts={accounts} />
      </div>
    </div>
  );
}
