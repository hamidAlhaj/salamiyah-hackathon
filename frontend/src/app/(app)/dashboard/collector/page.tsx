import type { Metadata } from 'next';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { NotForYourRole } from '@/components/layout/WorkspacePage';
import { listCampaigns } from '@/lib/api/campaigns';
import * as collectorApi from '@/lib/api/collector';
import { requireWorkspace } from '@/lib/auth';
import { DATE_TIME_SHORT } from '@/lib/format';
import { formatMoney, type CollectorPledge, type Currency } from '@/shared';
import { CollectorBoard } from './CollectorBoard';
import { RecordCashForm } from './RecordCashForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('collector');
  return { title: t('title') };
}

const STATE_TONE: Record<string, string> = {
  COLLECTED: 'bg-warning-soft text-warning',
  VERIFIED: 'bg-accent-soft text-accent-strong',
  REJECTED: 'bg-danger-soft text-danger',
};

/** Sum of SYP amounts (the council's cash points collect in SYP). */
const total = (rows: CollectorPledge[], currency: Currency = 'SYP') =>
  rows.filter((r) => r.currency === currency).reduce((s, r) => s + Number(r.amount), 0);

/**
 * The collector's phone dashboard («مسؤول نقطة جمع»): cash waiting at my points, one-tap confirm,
 * box totals, and a clearance record («براءة ذمة») of everything handed over to the council.
 * Mobile-first: one column at 375 px, installable as a PWA.
 */
export default async function CollectorPage() {
  const { token, user, allowed } = await requireWorkspace('collector');
  if (!allowed) return <NotForYourRole />;
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const [points, pending, history, campaigns, t, format] = await Promise.all([
    collectorApi.myPoints(token),
    collectorApi.pendingPledges(token),
    collectorApi.history(token),
    listCampaigns({ lang: locale, pageSize: 50, status: 'ACTIVE' }),
    getTranslations('collector'),
    getFormatter(),
  ]);
  const handedOver = history.filter((h) => h.status === 'COLLECTED');
  const matched = history.filter((h) => h.status === 'VERIFIED');
  const money = (v: number | string) => formatMoney(v, 'SYP', locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8" data-testid="collector-page">
      <header>
        <p className="text-sm text-muted">{t('hello', { name: user.fullName })}</p>
        <h1 className="mt-1 font-display text-2xl font-bold">{t('title')}</h1>
      </header>

      {/* Clearance of responsibility: what is with the council, what it has already matched. */}
      <section
        aria-labelledby="clearance-title"
        className="relative mt-5 overflow-hidden rounded-[24px] bg-panel p-5 text-panel-ink shadow-card"
        data-testid="clearance"
      >
        <h2 id="clearance-title" className="font-display text-lg font-bold text-white">
          {t('clearanceTitle')}
        </h2>
        <p className="mt-1 text-sm text-panel-ink/85">{t('clearanceBody')}</p>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="min-w-0 rounded-xl bg-white/10 px-1.5 py-3">
            <dt className="text-xs text-panel-ink/80">{t('statWaiting')}</dt>
            <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-white">
              {pending.length}
            </dd>
          </div>
          <div className="min-w-0 rounded-xl bg-white/10 px-1.5 py-3">
            <dt className="text-xs text-panel-ink/80">{t('statHandedOver')}</dt>
            <dd className="mt-1 text-[0.8125rem] font-bold leading-snug tabular-nums text-white [overflow-wrap:anywhere] sm:text-sm">
              {money(total(handedOver))}
            </dd>
          </div>
          <div className="min-w-0 rounded-xl bg-white/10 px-1.5 py-3">
            <dt className="text-xs text-panel-ink/80">{t('statMatched')}</dt>
            <dd className="mt-1 text-[0.8125rem] font-bold leading-snug tabular-nums text-white [overflow-wrap:anywhere] sm:text-sm">
              {money(total(matched))}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="points-title" className="mt-6">
        <h2 id="points-title" className="text-sm font-semibold text-muted">
          {t('pointsTitle')}
        </h2>
        <ul className="mt-2 flex flex-wrap gap-2" data-testid="my-points">
          {points.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-card"
            >
              <span className="font-semibold">{p.name}</span>
              <span className="text-muted">
                {' — '}
                {t(`pointTypes.${p.type}`)}، {p.area}
              </span>
              {p.pendingCount > 0 && (
                <span className="ms-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent-strong">
                  {p.pendingCount}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6">
        <CollectorBoard initial={pending} />
      </div>

      <details className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <summary className="cursor-pointer font-display text-lg font-bold">
          {t('recordTitle')}
        </summary>
        <p className="mt-2 text-sm text-muted">{t('recordIntro')}</p>
        <div className="mt-4">
          <RecordCashForm
            points={points}
            campaigns={campaigns.items.map((c) => ({ id: c.id, title: c.title }))}
          />
        </div>
      </details>

      <section aria-labelledby="history-title" className="mt-8" data-testid="history">
        <h2 id="history-title" className="font-display text-xl font-bold">
          {t('historyTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted">{t('historyIntro')}</p>
        {history.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted">
            {t('historyEmpty')}
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface shadow-card">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                data-reference={h.referenceNo}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {h.channel === 'COLLECTOR' ? (
                      t('boxTotal')
                    ) : (
                      <span dir="ltr">{h.referenceNo}</span>
                    )}
                    <span className="font-normal text-muted"> — {h.campaignTitle}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {h.collectionPoint?.name}
                    {h.handedOverAt && (
                      <>
                        {' — '}
                        <time dateTime={h.handedOverAt}>
                          {format.dateTime(new Date(h.handedOverAt), DATE_TIME_SHORT)}
                        </time>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 sm:block sm:text-end">
                  <p className="font-semibold tabular-nums">
                    {formatMoney(h.amount, h.currency, locale)}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATE_TONE[h.status] ?? 'bg-surface-muted text-muted'}`}
                  >
                    {t(`state.${h.status}`)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
