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
  const completed = campaign.status === 'COMPLETED';
  const spent = Number(campaign.spentAmount) > 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow duration-200 hover:shadow-lift focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-page">
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-300 ease-calm group-hover:scale-[1.03] motion-reduce:transform-none">
          <CampaignCover coverKey={campaign.coverKey} />
        </div>
        <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-strong shadow-card">
          <CategoryIcon icon={campaign.category.icon} className="h-4 w-4" />
          {campaign.category.name}
        </span>
        {completed ? (
          <span
            className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white shadow-card dark:bg-brand-600"
            data-testid="completed-badge"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
            {t('completed')}
          </span>
        ) : (
          urgent && (
            <span className="absolute end-3 top-3 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
              {tPriority(campaign.priority)}
            </span>
          )
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
        <div className="mt-auto space-y-2 pt-5">
          <FundingBar
            size="sm"
            target={campaign.targetAmount}
            verified={campaign.verifiedAmount}
            pending={campaign.pendingAmount}
            demo={campaign.demoAmount}
            label={t('progressLabel')}
          />
          <p className="border-t border-border pt-3 text-sm">
            <span className="font-semibold tabular-nums">
              {formatMoney(campaign.verifiedAmount, campaign.currency, locale)}
            </span>{' '}
            <span className="text-muted">
              {t('ofTarget', {
                target: formatMoney(campaign.targetAmount, campaign.currency, locale),
              })}
            </span>
          </p>
          {spent && (
            <p className="mt-0.5 text-xs text-muted">
              {t('spentSoFar', {
                amount: formatMoney(campaign.spentAmount, campaign.currency, locale),
              })}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
