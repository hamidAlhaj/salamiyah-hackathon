import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { formatMoney, type PublicCampaign } from '@/shared';
import { CampaignCover } from './CampaignCover';
import { CategoryIcon } from './CategoryIcon';
import { FundingBar } from './FundingBar';

/** A campaign in the public list. Everything shown is public-safe (no identities). */
export function CampaignCard({ campaign }: { campaign: PublicCampaign }) {
  const t = useTranslations('campaign');
  const tPriority = useTranslations('priority');
  const locale = useLocale() === 'en' ? 'en' : 'ar';
  const urgent = campaign.priority !== 'NORMAL';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative h-40 overflow-hidden">
        <CampaignCover coverKey={campaign.coverKey} />
        <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-semibold text-accent-strong shadow-card backdrop-blur">
          <CategoryIcon icon={campaign.category.icon} className="h-4 w-4" />
          {campaign.category.name}
        </span>
        {urgent && (
          <span className="absolute end-3 top-3 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
            {tPriority(campaign.priority)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold leading-snug">
          <Link
            href={`/campaigns/${campaign.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {campaign.title}
          </Link>
        </h3>
        <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted">
          {campaign.area && <span>{campaign.area}</span>}
          <span>{t('beneficiaries', { count: campaign.beneficiariesCount })}</span>
        </p>
        <div className="mt-auto pt-5">
          <FundingBar
            size="sm"
            target={campaign.targetAmount}
            verified={campaign.verifiedAmount}
            pending={campaign.pendingAmount}
            demo={campaign.demoAmount}
            label={t('progressLabel')}
          />
          <p className="mt-2 text-sm">
            <span className="font-semibold tabular-nums">
              {formatMoney(campaign.verifiedAmount, campaign.currency, locale)}
            </span>{' '}
            <span className="text-muted">
              {t('ofTarget', {
                target: formatMoney(campaign.targetAmount, campaign.currency, locale),
              })}
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}
