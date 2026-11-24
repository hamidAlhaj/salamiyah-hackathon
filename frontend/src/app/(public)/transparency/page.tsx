import type { Metadata } from 'next';
import Link from 'next/link';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { CategoryIcon } from '@/components/campaigns/CategoryIcon';
import { HBar } from '@/components/transparency/HBar';
import { MonthlyChart } from '@/components/transparency/MonthlyChart';
import { share } from '@/components/transparency/chart-geometry';
import { StarLattice } from '@/components/ui/StarLattice';
import { transparencyStats } from '@/lib/api/stats';
import { DATE_MEDIUM, DATE_TIME_SHORT } from '@/lib/format';
import { formatMoney, formatNumber, numberLocale } from '@/shared';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('transparency');
  return { title: t('metaTitle'), description: t('metaDescription') };
}

interface HowItem {
  title: string;
  body: string;
}

/** One stroke icon per «كيف نتحقق» point: matched, receipt, proof, privacy. */
const HOW_ICONS = [
  <path key="m" d="M5 12.5 9.5 17 19 7.5" />,
  <>
    <path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" />
    <path d="M9 8h6M9 11.5h6M9 15h3" />
  </>,
  <>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="m4 16 4.5-4.5 3.5 3.5 2.5-2.5L20 18" />
    <circle cx="15.5" cy="9" r="1.5" />
  </>,
  <>
    <path d="M3.5 12S7 5.5 12 5.5 20.5 12 20.5 12 17 18.5 12 18.5 3.5 12 3.5 12z" />
    <path d="M4 20 20 4" />
  </>,
];

/**
 * «لوحة الشفافية»: the platform's open account. Every figure comes from GET /stats/transparency,
 * which sums the public campaign ledgers; demo money appears only in its own note at the end.
 */
export default async function TransparencyPage() {
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const [s, t, tc, tp, format] = await Promise.all([
    transparencyStats(locale),
    getTranslations('transparency'),
    getTranslations('campaign'),
    getTranslations('spending'),
    getFormatter(),
  ]);
  const { totals } = s;
  const money = (v: string) => formatMoney(v, totals.currency, locale);
  const plain = new Intl.NumberFormat(numberLocale(locale), { maximumFractionDigits: 0 });
  const figure = (v: string) => plain.format(Number(v));
  const monthName = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const from = s.monthly[0] ? monthName.format(new Date(`${s.monthly[0].month}-01T00:00:00Z`)) : '';
  const lastMonth = s.monthly[s.monthly.length - 1];
  const to = lastMonth ? monthName.format(new Date(`${lastMonth.month}-01T00:00:00Z`)) : '';
  const spentWidth = Math.min(100, Number(totals.spentPercent));
  const maxCategory = Math.max(0, ...s.categories.map((c) => Number(c.verifiedAmount)));
  const channels = [...s.channels].sort((a, b) => Number(b.amount) - Number(a.amount));
  const channelMax = Math.max(0, ...channels.map((c) => Number(c.amount)));
  const payees = s.payeeTypes
    .filter((p) => Number(p.amount) > 0)
    .sort((a, b) => Number(b.amount) - Number(a.amount));
  const payeeMax = Math.max(0, ...payees.map((p) => Number(p.amount)));
  const kinds = s.beneficiaries.byKind.filter((k) => k.count > 0);
  const how = t.raw('how') as HowItem[];

  const heroFigures = [
    { key: 'collected', label: t('collected'), value: totals.verifiedAmount, unit: true },
    { key: 'spent', label: t('spent'), value: totals.spentAmount, unit: true },
    { key: 'remaining', label: t('remaining'), value: totals.remainingAmount, unit: true },
    {
      key: 'beneficiaries',
      label: t('beneficiaries'),
      value: String(s.beneficiaries.total),
      unit: false,
    },
  ];

  return (
    <div className="pb-16" data-testid="transparency-page">
      {/* ── The open account ── */}
      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:pt-12">
        <div
          className="relative isolate overflow-hidden rounded-panel bg-panel p-6 text-panel-ink shadow-lift sm:p-10"
          data-testid="transparency-hero"
        >
          <StarLattice className="absolute inset-0 -z-10 h-full w-full" />
          <p className="text-sm font-medium text-panel-ink/80">{t('kicker')}</p>
          <h1 className="mt-2 max-w-[22ch] font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-[62ch] text-panel-ink/90">{t('lead')}</p>

          <dl className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {heroFigures.map((f) => (
              <div key={f.key} className="border-t border-white/15 pt-4">
                <dt className="text-sm text-panel-ink/80">{f.label}</dt>
                <dd
                  className="mt-1 flex flex-wrap items-baseline gap-x-2 font-display font-bold text-white"
                  data-testid={`hero-${f.key}`}
                  data-value={f.value}
                >
                  <span className="text-[2.5rem] leading-tight sm:text-5xl">
                    {f.unit ? figure(f.value) : formatNumber(Number(f.value), locale)}
                  </span>
                  {f.unit && (
                    <span className="text-base font-medium text-panel-ink/80">{t('unit')}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8">
            <div
              className="flex h-2.5 overflow-hidden rounded-full bg-white/15"
              role="img"
              aria-label={`${t('spentShareLabel')}: ${totals.spentPercent}%`}
            >
              <span
                className="h-full rounded-e-full bg-white/85"
                style={{ width: `${spentWidth}%` }}
              />
            </div>
            <p
              className="mt-2 text-sm text-panel-ink/85"
              data-testid="hero-spent-percent"
              data-value={totals.spentPercent}
            >
              {t('spentShare', { percent: totals.spentPercent })}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/15 pt-5 text-sm text-panel-ink/85 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <p data-testid="hero-pending" data-value={totals.pendingAmount}>
                {t('pending', { amount: money(totals.pendingAmount) })}
              </p>
              <p data-testid="hero-campaigns">
                {t('campaignsLine', {
                  total: s.campaigns.total,
                  active: s.campaigns.active,
                  funded: s.campaigns.funded,
                  completed: s.campaigns.completed,
                })}
              </p>
              <p className="text-xs text-panel-ink/70">
                {t('updated', { time: format.dateTime(new Date(s.generatedAt), DATE_TIME_SHORT) })}
              </p>
            </div>
            <a
              href={`/api/transparency-csv?lang=${locale}`}
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-white/30 px-4 py-2 font-semibold text-white hover:bg-white/10 lg:self-auto"
              data-testid="download-csv"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
              </svg>
              {t('downloadCsv')}
            </a>
          </div>
          {s.otherCurrencies.map((o) => (
            <p key={o.currency} className="mt-3 text-xs text-panel-ink/75">
              {t('otherCurrency', {
                currency: o.currency,
                verified: formatMoney(o.verifiedAmount, o.currency, locale),
                spent: formatMoney(o.spentAmount, o.currency, locale),
              })}
            </p>
          ))}
        </div>
      </section>

      {/* ── By category ── */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6" aria-labelledby="categories-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="categories-title" className="font-display text-2xl font-bold">
              {t('categoriesTitle')}
            </h2>
            <p className="mt-1 max-w-[70ch] text-sm text-muted">{t('categoriesIntro')}</p>
          </div>
          <ul className="flex gap-4 text-sm text-muted" aria-hidden="true">
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-[3px] bg-series-spent" />
              {t('legendSpent')}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-[3px] bg-series-collected" />
              {t('legendRemaining')}
            </li>
          </ul>
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.categories.map((c) => (
            <li
              key={c.code}
              className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card"
              data-testid="category-card"
              data-code={c.code}
              data-verified={c.verifiedAmount}
              data-spent={c.spentAmount}
              data-beneficiaries={c.beneficiariesCount}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <CategoryIcon icon={c.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold leading-snug">{c.name}</h3>
                  <p className="text-xs text-muted">
                    {t('campaignsCount', { count: c.campaignsCount })}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm text-muted">{t('legendCollected')}</p>
              <p className="font-display text-2xl font-bold">{money(c.verifiedAmount)}</p>
              <div className="mt-3">
                <HBar
                  max={maxCategory}
                  label={t('categoryBar', {
                    name: c.name,
                    collected: money(c.verifiedAmount),
                    spent: money(c.spentAmount),
                  })}
                  segments={[
                    { value: Number(c.spentAmount), className: 'fill-series-spent' },
                    { value: Number(c.remainingAmount), className: 'fill-series-collected' },
                  ]}
                />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted">{t('legendSpent')}</dt>
                  <dd className="mt-0.5 font-semibold">{money(c.spentAmount)}</dd>
                </div>
                <div>
                  <dt className="text-muted">{t('legendRemaining')}</dt>
                  <dd className="mt-0.5 font-semibold">{money(c.remainingAmount)}</dd>
                </div>
                <div>
                  <dt className="text-muted">{tc('beneficiariesTitle')}</dt>
                  <dd className="mt-0.5 font-semibold">
                    {formatNumber(c.beneficiariesCount, locale)}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Twelve months ── */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6" aria-labelledby="monthly-title">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7">
          <h2 id="monthly-title" className="font-display text-2xl font-bold">
            {t('monthlyTitle')}
          </h2>
          <p className="mt-1 max-w-[70ch] text-sm text-muted">{t('monthlyIntro', { from, to })}</p>
          <div className="mt-5">
            <MonthlyChart
              months={s.monthly}
              locale={locale}
              labels={{
                title: t('monthlyTitle'),
                desc: t('monthlyDesc', { from, to }),
                collected: t('legendCollected'),
                spent: t('legendSpent'),
                table: t('monthlyTable'),
                month: t('month'),
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Channels, payees, beneficiaries ── */}
      <section className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-4 px-4 sm:px-6 lg:grid-cols-3">
        <div
          className="rounded-2xl border border-border bg-surface p-5 shadow-card"
          data-testid="channels"
        >
          <h2 className="font-display text-lg font-bold">{t('channelsTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('channelsIntro')}</p>
          <ul className="mt-5 space-y-4">
            {channels.map((c) => (
              <li key={c.channel} data-channel={c.channel} data-value={c.amount}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{t(`channels.${c.channel}`)}</span>
                  <span className="font-semibold">{money(c.amount)}</span>
                </div>
                <div className="mt-1.5">
                  <HBar
                    max={channelMax}
                    label={`${t(`channels.${c.channel}`)}: ${money(c.amount)}`}
                    segments={[{ value: Number(c.amount), className: 'fill-series-collected' }]}
                  />
                </div>
                <p className="mt-1 flex gap-3 text-xs text-muted">
                  <span>{share(Number(c.amount), Number(totals.verifiedAmount))}%</span>
                  <span>{t('count', { count: c.count })}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="rounded-2xl border border-border bg-surface p-5 shadow-card"
          data-testid="payees"
        >
          <h2 className="font-display text-lg font-bold">{t('payeesTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('payeesIntro')}</p>
          {payees.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted">
              {t('nothingYet')}
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {payees.map((p) => (
                <li key={p.payeeType} data-payee={p.payeeType} data-value={p.amount}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span>{tp(`payeeTypes.${p.payeeType}`)}</span>
                    <span className="font-semibold">{money(p.amount)}</span>
                  </div>
                  <div className="mt-1.5">
                    <HBar
                      max={payeeMax}
                      label={`${tp(`payeeTypes.${p.payeeType}`)}: ${money(p.amount)}`}
                      segments={[{ value: Number(p.amount), className: 'fill-series-spent' }]}
                    />
                  </div>
                  <p className="mt-1 flex gap-3 text-xs text-muted">
                    <span>{share(Number(p.amount), Number(totals.spentAmount))}%</span>
                    <span>{t('count', { count: p.count })}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="rounded-2xl border border-border bg-surface p-5 shadow-card"
          data-testid="kinds"
        >
          <h2 className="font-display text-lg font-bold">{t('kindsTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('kindsIntro')}</p>
          <p className="mt-5 font-display text-4xl font-bold" data-value={s.beneficiaries.total}>
            {formatNumber(s.beneficiaries.total, locale)}
          </p>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {kinds.map((k) => (
              <li
                key={k.kind}
                className="flex items-center justify-between py-2.5 text-sm"
                data-kind={k.kind}
                data-value={k.count}
              >
                <span>{tc(`kinds.${k.kind}`)}</span>
                <span className="font-semibold tabular-nums">{formatNumber(k.count, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Recent activity ── */}
      <section className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div data-testid="recent-spending">
          <h2 className="font-display text-xl font-bold">{t('recentSpendingTitle')}</h2>
          {s.recentExpenditures.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted">
              {t('recentSpendingEmpty')}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {s.recentExpenditures.map((e) => (
                <li
                  key={e.id}
                  className="flex gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card"
                  data-amount={e.amount}
                >
                  {e.proof?.mimeType.startsWith('image/') ? (
                    <a
                      href={`/api/proofs/${e.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                      aria-label={tp('viewProof')}
                      data-testid="proof-thumb"
                    >
                      {/* Public-safe proof through the same-origin proxy (next/image cannot load it). */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/proofs/${e.id}`}
                        alt=""
                        loading="lazy"
                        className="h-16 w-16 rounded-xl border border-border object-cover"
                      />
                    </a>
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted">
                      <CategoryIcon icon={e.campaign.categoryIcon} className="h-6 w-6" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="text-sm">
                        <span className="font-semibold">
                          {e.beneficiaryCode ? (
                            <span dir="ltr">{e.beneficiaryCode}</span>
                          ) : (
                            e.payeeLabel
                          )}
                        </span>
                        <span className="text-muted"> — {tp(`payeeTypes.${e.payeeType}`)}</span>
                      </p>
                      <p className="font-display text-lg font-bold">
                        {formatMoney(e.amount, e.currency, locale)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed">{e.description}</p>
                    <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-muted">
                      <Link
                        href={`/campaigns/${e.campaign.slug}`}
                        className="font-semibold text-accent hover:underline"
                      >
                        {e.campaign.title}
                      </Link>
                      <time dateTime={e.paidAt}>
                        {format.dateTime(new Date(e.paidAt), DATE_MEDIUM)}
                      </time>
                      {e.proof && !e.proof.mimeType.startsWith('image/') && (
                        <a
                          href={`/api/proofs/${e.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-accent hover:underline"
                        >
                          {tp('viewProof')}
                        </a>
                      )}
                      {!e.proof && <span>{tp('proofKeptByCouncil')}</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div data-testid="recent-donations">
          <h2 className="font-display text-xl font-bold">{t('recentDonationsTitle')}</h2>
          {s.recentDonations.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted">
              {t('recentDonationsEmpty')}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface px-4 shadow-card">
              {s.recentDonations.map((d, i) => (
                <li
                  key={`${d.verifiedAt}-${i}`}
                  className="flex items-center gap-3 py-3.5"
                  data-amount={d.amount}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <CategoryIcon icon={d.category.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{d.displayName ?? t('anonymous')}</p>
                    <p className="truncate text-xs text-muted">
                      <Link href={`/campaigns/${d.campaign.slug}`} className="hover:underline">
                        {d.campaign.title}
                      </Link>
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-display font-bold">
                      {formatMoney(d.amount, d.currency, locale)}
                    </p>
                    <time dateTime={d.verifiedAt} className="text-xs text-muted">
                      {format.dateTime(new Date(d.verifiedAt), DATE_MEDIUM)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── How we check ── */}
      <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6" aria-labelledby="how-title">
        <h2 id="how-title" className="font-display text-2xl font-bold">
          {t('howTitle')}
        </h2>
        <ul className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {how.map((item, i) => (
            <li key={item.title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-600 text-accent">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {HOW_ICONS[i]}
                </svg>
              </span>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <p
          className="mt-10 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted"
          data-testid="demo-note"
          data-value={totals.demoAmount}
        >
          {t('demoNote')}
          {Number(totals.demoAmount) > 0 && (
            <> {t('demoAmount', { amount: money(totals.demoAmount) })}</>
          )}
        </p>
      </section>
    </div>
  );
}
