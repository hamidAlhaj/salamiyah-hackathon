'use client';

import { useRouter } from 'next/navigation';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { controlClass } from '@/components/ui/Field';
import { FormError } from '@/components/ui/FormParts';
import { confirmReceivedAction, findByReferenceAction } from '@/lib/actions/collector';
import { DATE_TIME_SHORT } from '@/lib/format';
import { formatMoney, type CollectorPledge } from '@/shared';

/**
 * Pending cash at my points: search by the reference the donor shows, and one big «تأكيد الاستلام»
 * per pledge behind a confirm dialog. A confirmed pledge leaves the list at once.
 */
export function CollectorBoard({ initial }: { initial: CollectorPledge[] }) {
  const t = useTranslations('collector');
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [found, setFound] = useState<CollectorPledge | null>(null);
  const [reference, setReference] = useState('');
  const [searchError, setSearchError] = useState<string>();
  const [confirming, setConfirming] = useState<CollectorPledge | null>(null);
  const [error, setError] = useState<string>();
  const [doneRef, setDoneRef] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const search = () =>
    startTransition(async () => {
      setDoneRef(null);
      const res = await findByReferenceAction(reference);
      if (res.error !== undefined) {
        setFound(null);
        setSearchError(res.error);
      } else {
        setSearchError(undefined);
        setFound(res.data);
      }
    });

  const confirm = () => {
    if (!confirming) return;
    const target = confirming;
    startTransition(async () => {
      const res = await confirmReceivedAction(target.id);
      if (res.error !== undefined) {
        setError(res.error);
        setConfirming(null);
        return;
      }
      setError(undefined);
      setConfirming(null);
      setItems((prev) => prev.filter((p) => p.id !== target.id));
      setFound((f) => (f?.id === target.id ? res.data : f));
      setDoneRef(target.referenceNo);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="search-title"
        className="rounded-2xl border border-border bg-surface p-5 shadow-card"
      >
        <h2 id="search-title" className="font-display text-lg font-bold">
          {t('searchTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted">{t('searchHint')}</p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
        >
          <label htmlFor="reference" className="sr-only">
            {t('searchLabel')}
          </label>
          <input
            id="reference"
            className={`${controlClass} text-lg font-semibold uppercase tracking-wider`}
            dir="ltr"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="P-XXXXXX"
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase().slice(0, 14))}
            data-testid="reference-input"
          />
          <Button type="submit" size="lg" disabled={pending || reference.length < 4}>
            {t('search')}
          </Button>
        </form>
        <div className="mt-3">
          <FormError message={searchError} />
        </div>
        {found && (
          <div className="mt-4" data-testid="reference-result">
            <PledgeCard pledge={found} onConfirm={setConfirming} />
          </div>
        )}
      </section>

      {doneRef && (
        <p
          role="status"
          className="rounded-xl border border-brand-200 bg-accent-soft px-4 py-3 text-sm font-medium text-accent-strong dark:border-brand-800"
          data-testid="confirm-done"
        >
          {t('confirmed', { reference: doneRef })}
        </p>
      )}
      <FormError message={error} />

      <section aria-labelledby="pending-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="pending-title" className="font-display text-xl font-bold">
            {t('pendingTitle')}
          </h2>
          <span className="text-sm text-muted">{t('pendingCount', { count: items.length })}</span>
        </div>
        {items.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted">
            {t('pendingEmpty')}
          </p>
        ) : (
          <ul className="mt-3 space-y-3" data-testid="pending-list">
            {items.map((p) => (
              <li key={p.id} data-reference={p.referenceNo}>
                <PledgeCard pledge={p} onConfirm={setConfirming} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirming !== null}
        title={t('dialogTitle')}
        description={confirming ? <DialogBody pledge={confirming} /> : null}
        confirmLabel={t('confirmButton')}
        cancelLabel={t('cancel')}
        pendingLabel={t('confirming')}
        danger={false}
        pending={pending}
        onConfirm={confirm}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}

function DialogBody({ pledge }: { pledge: CollectorPledge }) {
  const t = useTranslations('collector');
  const locale = useLocale() === 'en' ? 'en' : 'ar';
  return (
    <div className="space-y-3" data-testid="confirm-dialog">
      <p className="text-center font-display text-3xl font-bold tabular-nums text-ink">
        {formatMoney(pledge.amount, pledge.currency, locale)}
      </p>
      <p className="text-center">
        <span className="text-muted">{t('reference')} </span>
        <span dir="ltr" className="font-bold text-ink">
          {pledge.referenceNo}
        </span>
      </p>
      <p>{t('dialogBody')}</p>
    </div>
  );
}

function PledgeCard({
  pledge,
  onConfirm,
}: {
  pledge: CollectorPledge;
  onConfirm: (p: CollectorPledge) => void;
}) {
  const t = useTranslations('collector');
  const format = useFormatter();
  const locale = useLocale() === 'en' ? 'en' : 'ar';
  const waiting = pledge.status === 'PLEDGED';
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p dir="ltr" className="text-start text-lg font-bold tracking-wide">
            {pledge.referenceNo}
          </p>
          <p className="text-sm text-muted">{pledge.donorName ?? t('anonymous')}</p>
        </div>
        <p className="font-display text-xl font-bold tabular-nums">
          {formatMoney(pledge.amount, pledge.currency, locale)}
        </p>
      </div>
      <p className="mt-2 text-sm">{pledge.campaignTitle}</p>
      <p className="mt-1 text-xs text-muted">
        {pledge.collectionPoint?.name}
        {' — '}
        <time dateTime={pledge.createdAt}>
          {format.dateTime(new Date(pledge.createdAt), DATE_TIME_SHORT)}
        </time>
      </p>
      {waiting ? (
        <Button
          size="lg"
          className="mt-4 w-full"
          onClick={() => onConfirm(pledge)}
          data-testid="confirm-received"
        >
          {t('confirmButton')}
        </Button>
      ) : (
        <p className="mt-3 rounded-xl bg-surface-muted px-3 py-2 text-sm text-muted">
          {t(`state.${pledge.status}`)}
        </p>
      )}
    </article>
  );
}
