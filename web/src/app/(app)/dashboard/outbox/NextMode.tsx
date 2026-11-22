'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormParts';
import { nextOutboxAction } from '@/lib/actions/notifications';
import type { OutboxItem } from '@/shared';
import { SendButton } from './SendButton';

/**
 * "Next" mode: one queued message at a time, oldest first. Each send opens WhatsApp and loads the
 * next message, so staff can work through the queue from the council phone without scrolling.
 */
export function NextMode({ template, queued }: { template?: string; queued: number }) {
  const t = useTranslations('outbox');
  const router = useRouter();
  const [item, setItem] = useState<OutboxItem | null>(null);
  const [active, setActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const loadNext = () =>
    startTransition(async () => {
      const res = await nextOutboxAction(template);
      if (res.error !== undefined) return setError(res.error);
      setError(undefined);
      setItem(res.data);
      setFinished(res.data === null);
      setActive(true);
    });

  if (!active) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div>
          <p className="font-display text-lg font-bold">{t('nextTitle')}</p>
          <p className="text-sm text-muted">{t('nextIntro', { count: queued })}</p>
        </div>
        <Button onClick={loadNext} disabled={pending || queued === 0} data-testid="next-start">
          {t('nextStart')}
        </Button>
      </div>
    );
  }

  return (
    <section
      className="rounded-2xl border-2 border-brand-600 bg-surface p-5 shadow-card dark:border-brand-500"
      data-testid="next-mode"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-lg font-bold">{t('nextTitle')}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setActive(false);
            router.refresh();
          }}
        >
          {t('nextStop')}
        </Button>
      </div>
      <FormError message={error} />
      {finished || !item ? (
        <p className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent-strong">
          {t('nextDone')}
        </p>
      ) : (
        <div className="mt-4 space-y-4" data-testid="next-item">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold">
              {item.recipientName ?? t('unknownRecipient')}{' '}
              <span className="text-sm font-normal text-muted" dir="ltr">
                {item.phone}
              </span>
            </p>
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-muted">
              {t(`templates.${item.template.replace('.', '_')}`)}
            </span>
          </div>
          <p className="whitespace-pre-line rounded-xl bg-surface-muted p-4 text-sm leading-relaxed">
            {item.body}
          </p>
          {item.openUrl && (
            <SendButton
              id={item.id}
              openUrl={item.openUrl}
              label={t('send')}
              opened={false}
              onOpened={loadNext}
            />
          )}
        </div>
      )}
    </section>
  );
}
