'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { CopyButton } from '@/components/campaigns/CopyButton';
import { DemoBadge } from '@/components/campaigns/DemoBadge';
import { Button, buttonClasses } from '@/components/ui/Button';
import { controlClass } from '@/components/ui/Field';
import { FormError } from '@/components/ui/FormParts';
import { cashPledgeAction, demoDonateAction, transferPledgeAction } from '@/lib/actions/donations';
import {
  formatMoney,
  type CreatePledgeResult,
  type Currency,
  type PaymentAccount,
  type PledgeView,
  type PublicCollectionPoint,
} from '@/shared';
import { DemoCheckout } from './DemoCheckout';
import { ReceiptUpload } from './ReceiptUpload';

type Path = 'demo' | 'transfer' | 'cash';

const PRESETS: Record<Currency, number[]> = {
  SYP: [25_000, 50_000, 100_000, 250_000],
  USD: [10, 25, 50, 100],
};

const PATH_ICONS: Record<Path, React.ReactNode> = {
  demo: <path d="M6 3h12v18H6zM10 18h4M9 7h6" />,
  transfer: <path d="M3 10 12 4l9 6M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18" />,
  cash: <path d="M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 10v4M18 10v4" />,
};

export interface DonateCampaign {
  id: string;
  slug: string;
  title: string;
  currency: Currency;
}

/**
 * The donate flow in three steps (path & method → amount → finish), on top of the two-phase API:
 * a simulated checkout (DEMO_CONFIRMED), transfer → account + reference → receipt upload, or cash at a
 * collection point → reference. The summary column follows the choices and becomes the result.
 */
export function DonateFlow({
  campaign,
  accounts,
  points,
}: {
  campaign: DonateCampaign;
  accounts: PaymentAccount[];
  points: PublicCollectionPoint[];
}) {
  const t = useTranslations('donate');
  const locale = useLocale() === 'en' ? 'en' : 'ar';
  const money = (v: string | number) => formatMoney(v, campaign.currency, locale);

  const methodsFor = useMemo(
    () => ({
      demo: accounts.filter(
        (a) => a.allowsDemoCheckout && (a.kind === 'WALLET' || a.kind === 'CARD'),
      ),
      transfer: accounts.filter((a) => a.allowsReceiptUpload),
      cash: accounts.filter((a) => a.kind === 'CASH'),
    }),
    [accounts],
  );
  const paths = (['demo', 'transfer', 'cash'] as const).filter((p) => methodsFor[p].length > 0);

  const [path, setPath] = useState<Path | null>(null);
  const [method, setMethod] = useState<PaymentAccount | null>(null);
  const [amount, setAmount] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [pointId, setPointId] = useState<string | null>(null);
  const [pledge, setPledge] = useState<CreatePledgeResult | null>(null);
  const [done, setDone] = useState<PledgeView | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  // A finished donation: re-render the layout so the header bell shows the new notification at once.
  const finish = (pledge: PledgeView) => {
    setDone(pledge);
    router.refresh();
  };

  const amountOk = /^[1-9][0-9]{0,11}$/.test(amount);
  const ready = method !== null && amountOk;
  const locked = pledge !== null; // a transfer pledge exists: its method and amount are fixed
  const input = {
    campaignId: campaign.id,
    campaignSlug: campaign.slug,
    amount,
    isAnonymousDisplay: anonymous,
  };

  function choosePath(p: Path) {
    setPath(p);
    setMethod(methodsFor[p].length === 1 ? methodsFor[p][0] : null);
    setError(undefined);
  }

  function run<T>(action: () => Promise<{ data?: T; error?: string }>, onData: (d: T) => void) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error !== undefined) setError(result.error);
      else if (result.data !== undefined) onData(result.data);
    });
  }

  if (done) {
    return (
      <DonationDone
        pledge={done}
        campaignSlug={campaign.slug}
        amountLabel={money(done.amount)}
        methodLabel={method?.label ?? ''}
      />
    );
  }

  const pointsByArea = Object.entries(
    points.reduce<Record<string, PublicCollectionPoint[]>>((acc, p) => {
      (acc[p.area] ??= []).push(p);
      return acc;
    }, {}),
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-10">
        {/* 1. Path and method */}
        <fieldset disabled={locked} data-testid="step-path">
          <StepTitle step={1}>{t('stepPath')}</StepTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            {paths.map((p) => {
              const active = path === p;
              return (
                <label
                  key={p}
                  className={`flex cursor-pointer flex-col gap-2 rounded-2xl border-2 p-4 transition-colors focus-within:ring-2 focus-within:ring-ring ${
                    active
                      ? 'border-brand-600 bg-accent-soft dark:border-brand-500'
                      : 'border-border bg-surface hover:border-brand-300'
                  }`}
                  data-path={p}
                >
                  <input
                    type="radio"
                    name="path"
                    value={p}
                    checked={active}
                    onChange={() => choosePath(p)}
                    className="sr-only"
                  />
                  <span className="flex items-center justify-between gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6 text-accent"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {PATH_ICONS[p]}
                    </svg>
                    {p === 'demo' && <DemoBadge />}
                  </span>
                  <span className="font-semibold">{t(`paths.${p}.title`)}</span>
                  <span className="text-xs leading-relaxed text-muted">{t(`paths.${p}.body`)}</span>
                </label>
              );
            })}
          </div>

          {path && path !== 'cash' && methodsFor[path].length > 1 && (
            <div className="mt-5" role="radiogroup" aria-label={t('methodLabel')}>
              <p className="text-sm font-medium">{t('methodLabel')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {methodsFor[path].map((m) => (
                  <label
                    key={m.method}
                    className={`cursor-pointer rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-ring ${
                      method?.method === m.method
                        ? 'border-brand-600 bg-accent-soft text-accent-strong dark:border-brand-500'
                        : 'border-border hover:border-brand-300'
                    }`}
                    data-method={m.method}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={m.method}
                      checked={method?.method === m.method}
                      onChange={() => setMethod(m)}
                      className="sr-only"
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {/* 2. Amount and the anonymous option */}
        <fieldset disabled={locked} data-testid="step-amount">
          <StepTitle step={2}>{t('stepAmount')}</StepTitle>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('presetsLabel')}>
            {PRESETS[campaign.currency].map((preset) => {
              const active = amount === String(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setAmount(String(preset))}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold tabular-nums transition-colors ${
                    active
                      ? 'border-give-600 bg-give-50 text-give-800 dark:border-give-500 dark:bg-give-900/30 dark:text-give-200'
                      : 'border-border hover:border-give-300'
                  }`}
                >
                  {money(preset)}
                </button>
              );
            })}
          </div>
          <div className="mt-4 max-w-xs space-y-1.5">
            <label htmlFor="amount" className="block text-sm font-medium">
              {t('customAmount')}
            </label>
            <input
              id="amount"
              className={controlClass}
              inputMode="numeric"
              dir="ltr"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 12))}
              aria-describedby="amount-hint"
            />
            <p id="amount-hint" className="text-xs text-muted">
              {t('amountHint', { currency: campaign.currency })}
            </p>
          </div>
          <label className="mt-5 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="mt-1 h-4 w-4 accent-brand-600"
            />
            <span>
              <span className="block text-sm font-medium">{t('anonymous')}</span>
              <span className="block text-xs text-muted">{t('anonymousHint')}</span>
            </span>
          </label>
        </fieldset>

        {/* 3. Finish: path-specific */}
        <section aria-labelledby="step-finish" data-testid="step-finish">
          <h2 id="step-finish" className="mb-4">
            <StepLabel step={3}>{t('stepFinish')}</StepLabel>
          </h2>
          {!ready ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted">
              {amount && !amountOk ? t('invalidAmount') : t('chooseFirst')}
            </p>
          ) : path === 'demo' && method ? (
            <DemoCheckout
              account={method}
              amountLabel={money(amount)}
              pending={pending}
              error={error}
              onPay={() => run(() => demoDonateAction({ ...input, method: method.method }), finish)}
            />
          ) : path === 'transfer' && method ? (
            pledge ? (
              <TransferDetails
                result={pledge}
                amountLabel={money(pledge.pledge.amount)}
                campaignSlug={campaign.slug}
                onUploaded={finish}
              />
            ) : (
              <div className="space-y-3">
                <FormError message={error} />
                <Button
                  variant="give"
                  size="lg"
                  className="w-full"
                  disabled={pending}
                  data-testid="transfer-create"
                  onClick={() =>
                    run(
                      () => transferPledgeAction({ ...input, method: method.method }),
                      (r: CreatePledgeResult) => {
                        setPledge(r);
                        router.refresh();
                      },
                    )
                  }
                >
                  {pending ? t('submitting') : t('transfer.create')}
                </Button>
              </div>
            )
          ) : path === 'cash' ? (
            points.length === 0 ? (
              <p className="rounded-xl bg-surface-muted px-4 py-3 text-sm text-muted">
                {t('cash.noPoints')}
              </p>
            ) : (
              <div className="space-y-5" data-testid="cash-points">
                <p className="text-sm font-medium">{t('cash.pointsTitle')}</p>
                {pointsByArea.map(([area, list]) => (
                  <div key={area} role="radiogroup" aria-label={area}>
                    <p className="text-xs font-semibold text-muted">{area}</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {list.map((p) => (
                        <label
                          key={p.id}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 transition-colors focus-within:ring-2 focus-within:ring-ring ${
                            pointId === p.id
                              ? 'border-brand-600 bg-accent-soft dark:border-brand-500'
                              : 'border-border hover:border-brand-300'
                          }`}
                          data-point={p.id}
                        >
                          <input
                            type="radio"
                            name="point"
                            value={p.id}
                            checked={pointId === p.id}
                            onChange={() => setPointId(p.id)}
                            className="sr-only"
                          />
                          <span className="font-medium">{p.name}</span>
                          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-muted">
                            {t(`pointTypes.${p.type}`)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <FormError message={error} />
                <Button
                  variant="give"
                  size="lg"
                  className="w-full"
                  disabled={pending}
                  data-testid="cash-confirm"
                  onClick={() => {
                    if (!pointId) return setError(t('cash.choosePoint'));
                    run(() => cashPledgeAction({ ...input, collectionPointId: pointId }), finish);
                  }}
                >
                  {pending ? t('submitting') : t('cash.confirm')}
                </Button>
              </div>
            )
          ) : null}
        </section>
      </div>

      {/* Running summary */}
      <aside className="order-first lg:order-none lg:sticky lg:top-24 lg:self-start">
        <div
          className="rounded-2xl border border-border bg-surface p-5 shadow-card"
          data-testid="donation-summary"
        >
          <h2 className="font-display text-lg font-bold">{t('summaryTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{campaign.title}</p>
          <dl className="mt-4 divide-y divide-border text-sm">
            <SummaryRow label={t('summaryAmount')}>
              <span className="font-display text-xl font-bold tabular-nums">
                {amountOk ? money(amount) : '—'}
              </span>
            </SummaryRow>
            <SummaryRow label={t('summaryMethod')}>
              <span className="inline-flex items-center gap-2">
                {method?.label ?? (path ? t(`paths.${path}.title`) : '—')}
                {path === 'demo' && <DemoBadge />}
              </span>
            </SummaryRow>
            <SummaryRow label={t('summaryName')}>
              {anonymous ? t('summaryAnonymous') : t('summaryYou')}
            </SummaryRow>
          </dl>
          {path === 'demo' && <p className="mt-3 text-xs text-muted">{t('demoNote')}</p>}
        </div>
      </aside>
    </div>
  );
}

function StepLabel({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-base font-bold">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm text-white dark:bg-brand-600"
        aria-hidden="true"
      >
        {step}
      </span>
      {children}
    </span>
  );
}

function StepTitle({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <legend className="mb-4">
      <StepLabel step={step}>{children}</StepLabel>
    </legend>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="text-end">{children}</dd>
    </div>
  );
}

function TransferDetails({
  result,
  amountLabel,
  campaignSlug,
  onUploaded,
}: {
  result: CreatePledgeResult;
  amountLabel: string;
  campaignSlug: string;
  onUploaded: (p: PledgeView) => void;
}) {
  const t = useTranslations('donate.transfer');
  const account = result.instructions[0];
  const ref = result.pledge.referenceNo;
  return (
    <div className="space-y-6" data-testid="transfer-details">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <p className="font-semibold">{t('accountTitle')}</p>
        <dl className="mt-3 space-y-3 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">{t('amountToSend')}</dt>
            <dd className="font-display text-lg font-bold tabular-nums">{amountLabel}</dd>
          </div>
          {account && (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">{account.bankName}</dt>
                <dd>{account.accountName}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <dt className="text-muted">{t('number')}</dt>
                <dd className="flex items-center gap-2">
                  <code
                    dir="ltr"
                    className="select-all rounded-lg bg-surface-muted px-2.5 py-1 font-semibold"
                  >
                    {account.accountNumber}
                  </code>
                  <CopyButton
                    value={account.accountNumber}
                    label={t('copyNumber')}
                    copyText={t('copy')}
                    copiedText={t('copied')}
                  />
                </dd>
              </div>
            </>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-give-50 px-3 py-2.5 dark:bg-give-900/30">
            <dt className="font-medium">{t('reference')}</dt>
            <dd className="flex items-center gap-2">
              <code
                dir="ltr"
                className="select-all text-base font-bold"
                data-testid="pledge-reference"
              >
                {ref}
              </code>
              <CopyButton
                value={ref}
                label={t('copyReference')}
                copyText={t('copy')}
                copiedText={t('copied')}
              />
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">{t('referenceHint')}</p>
      </div>
      <ReceiptUpload pledgeId={result.pledge.id} campaignSlug={campaignSlug} onDone={onUploaded} />
      <Link
        href="/dashboard/donations"
        className="block text-center text-sm font-medium text-accent hover:underline"
      >
        {t('later')}
      </Link>
    </div>
  );
}

function DonationDone({
  pledge,
  campaignSlug,
  amountLabel,
  methodLabel,
}: {
  pledge: PledgeView;
  campaignSlug: string;
  amountLabel: string;
  methodLabel: string;
}) {
  const t = useTranslations('donate.done');
  const kind = pledge.isDemo ? 'demo' : pledge.method === 'CASH' ? 'cash' : 'transfer';
  return (
    <div
      role="status"
      className="mx-auto max-w-xl rounded-[28px] border border-border bg-surface p-8 text-center shadow-card"
      data-testid="donation-done"
      data-kind={kind}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <svg
          className="h-7 w-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="mt-4 font-display text-2xl font-bold">{t(`${kind}Title`)}</h2>
      <p className="mt-2 text-muted">
        {kind === 'cash' && pledge.collectionPoint
          ? t('cashBody', { point: pledge.collectionPoint.name, area: pledge.collectionPoint.area })
          : t(`${kind}Body`)}
      </p>
      <dl className="mx-auto mt-6 max-w-sm divide-y divide-border rounded-2xl bg-surface-muted px-4 text-start text-sm">
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className="text-muted">{t('reference')}</dt>
          <dd className="font-display text-lg font-bold" dir="ltr" data-testid="done-reference">
            {pledge.referenceNo}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className="text-muted">{methodLabel}</dt>
          <dd className="inline-flex items-center gap-2 font-semibold tabular-nums">
            {amountLabel}
            {pledge.isDemo && <DemoBadge />}
          </dd>
        </div>
      </dl>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href={`/campaigns/${campaignSlug}`}
          className={buttonClasses('primary')}
          data-testid="done-campaign"
        >
          {t('backToCampaign')}
        </Link>
        <Link href="/dashboard/donations" className={buttonClasses('secondary')}>
          {t('myDonations')}
        </Link>
      </div>
    </div>
  );
}
