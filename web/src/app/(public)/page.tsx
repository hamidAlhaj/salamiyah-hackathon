import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { CategoryTabs, filterHref, PriorityFilter } from '@/components/campaigns/CampaignFilters';
import { buttonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StarLattice } from '@/components/ui/StarLattice';
import { listAllCampaigns, listCampaigns } from '@/lib/api/campaigns';
import { listCategories } from '@/lib/api/categories';
import { sumMoney } from '@/lib/money';
import { formatMoney, PRIORITIES, type Priority } from '@/shared';

interface Step {
  title: string;
  body: string;
}

const CODE_RE = /^[A-Z][A-Z0-9_]{2,39}$/;

/** Public home: the open ledger first, then every campaign category from the API. */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const t = await getTranslations('home');
  const tPriority = await getTranslations('priority');

  const categories = await listCategories(locale);
  const requested = typeof params.category === 'string' ? params.category : undefined;
  const category =
    requested && CODE_RE.test(requested) && categories.some((c) => c.code === requested)
      ? requested
      : undefined;
  const priority = (PRIORITIES as readonly string[]).includes(String(params.priority))
    ? (params.priority as Priority)
    : undefined;

  const [page, all] = await Promise.all([
    listCampaigns({ lang: locale, category, priority, pageSize: 24 }),
    listAllCampaigns(locale),
  ]);

  // Platform totals in SYP (campaigns in another currency are not mixed in).
  const syp = all.filter((c) => c.currency === 'SYP');
  const collected = sumMoney(syp.map((c) => c.verifiedAmount));
  const spent = sumMoney(syp.map((c) => c.spentAmount));
  const remaining = sumMoney([collected, `-${spent}`]);
  const demo = sumMoney(syp.map((c) => c.demoAmount));
  const beneficiaries = all.reduce((n, c) => n + c.beneficiariesCount, 0);
  const spentShare = Number(collected) > 0 ? (Number(spent) / Number(collected)) * 100 : 0;
  const steps = t.raw('steps') as Step[];
  const money = (v: string) => formatMoney(v, 'SYP', locale);

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pt-16">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-medium text-accent">{t('kicker')}</p>
          <h1 className="mt-3 max-w-[20ch] font-display text-4xl font-bold leading-tight sm:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-5 max-w-[60ch] text-lg text-muted">{t('heroBody')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#campaigns" className={buttonClasses('primary', 'lg')}>
              {t('ctaCases')}
            </Link>
            <Link href="/track" className={buttonClasses('secondary', 'lg')}>
              {t('ctaTrack')}
            </Link>
          </div>
        </div>

        {/* The brand panel is the open account: collected, spent, remaining. */}
        <div
          className="relative isolate overflow-hidden rounded-[28px] bg-panel p-7 text-panel-ink shadow-lift sm:p-9"
          data-testid="platform-ledger"
        >
          <StarLattice className="absolute inset-0 -z-10 h-full w-full" />
          <h2 className="font-display text-xl font-bold text-white">{t('ledgerTitle')}</h2>
          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-sm text-panel-ink/80">{t('ledgerCollected')}</dt>
              <dd className="font-display text-3xl font-bold tabular-nums text-white sm:text-4xl">
                {money(collected)}
              </dd>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
              <span
                className="h-full bg-white/80"
                style={{ width: `${Math.min(100, spentShare)}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-panel-ink/80">{t('ledgerSpent')}</dt>
                <dd className="text-xl font-bold tabular-nums text-white">{money(spent)}</dd>
              </div>
              <div>
                <dt className="text-sm text-panel-ink/80">{t('ledgerRemaining')}</dt>
                <dd className="text-xl font-bold tabular-nums text-white">{money(remaining)}</dd>
              </div>
            </div>
          </dl>
          <p className="mt-6 border-t border-white/15 pt-4 text-sm text-panel-ink/85">
            {t('ledgerBeneficiaries', { count: beneficiaries })}
          </p>
          <p className="mt-1 text-xs text-panel-ink/70">
            {t('ledgerNote')} {t('ledgerDemo', { amount: money(demo) })}
          </p>
        </div>
      </section>

      <section id="campaigns" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-bold">{t('campaignsTitle')}</h2>
          <p className="text-sm text-muted" data-testid="campaign-count">
            {t('count', { count: page.total })}
          </p>
        </div>
        <div className="mt-5 space-y-3">
          <CategoryTabs
            categories={categories}
            active={category}
            priority={priority}
            allLabel={t('filterAll')}
            label={t('categoriesLabel')}
          />
          <PriorityFilter
            active={priority}
            category={category}
            label={t('priorityLabel')}
            options={[
              { value: undefined, label: t('priorityAll') },
              ...PRIORITIES.map((p) => ({ value: p, label: tPriority(p) })),
            ]}
          />
        </div>
        {page.items.length > 0 ? (
          <div
            className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="campaign-grid"
          >
            {page.items.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-6"
            icon="search"
            message={t('empty')}
            action={{ href: filterHref({}), label: t('emptyAction') }}
          />
        )}
      </section>

      <section className="border-t border-border bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-xl font-bold">{t('stepsTitle')}</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-brand-600 font-display text-sm font-bold text-accent">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
