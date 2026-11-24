'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { Button, buttonClasses } from '@/components/ui/Button';
import type { AllocationPreview, SurplusChoice } from '@/shared';

/**
 * The surplus notice (docs/fund-contract.md): shown before any pledge when the amount is more than the
 * campaign still needs. Focus moves to it so keyboard and screen-reader users hear the choice at once.
 * Cancel and "browse" create no record.
 */
export function AllocationNotice({
  preview,
  money,
  pending,
  onChoose,
  onCancel,
}: {
  preview: AllocationPreview;
  money: (v: string) => string;
  pending: boolean;
  onChoose: (choice: SurplusChoice) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('donate.allocation');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const complete = preview.state === 'COMPLETE';
  const values = {
    remaining: money(preview.remaining ?? '0'),
    offered: money(preview.offered),
    surplus: money(preview.surplus),
  };
  const fundHref = preview.fund
    ? `/campaigns/${preview.fund.slug}/donate?amount=${encodeURIComponent(
        String(Math.trunc(Number(preview.offered))),
      )}`
    : null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alertdialog"
      aria-labelledby="allocation-title"
      aria-describedby="allocation-body"
      className="rounded-2xl border-2 border-warning bg-surface p-5 shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-testid="allocation-notice"
      data-state={preview.state}
    >
      <h3 id="allocation-title" className="font-display text-lg font-bold">
        {complete ? t('completeTitle') : t('surplusTitle')}
      </h3>
      <p id="allocation-body" className="mt-2 text-sm leading-relaxed">
        {complete ? t('completeBody', values) : t('surplusBody', values)}
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {complete ? (
          <>
            {fundHref && (
              <Link
                href={fundHref}
                className={buttonClasses('give', 'lg', 'w-full')}
                data-testid="allocation-to-fund"
              >
                {t('toFund')}
              </Link>
            )}
            <Link href="/#campaigns" className={buttonClasses('secondary', 'md', 'w-full')}>
              {t('browse')}
            </Link>
          </>
        ) : (
          <>
            <Button
              variant="give"
              size="lg"
              className="w-full"
              disabled={pending}
              onClick={() => onChoose('SPLIT')}
              data-testid="allocation-split"
            >
              {t('split', values)}
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              disabled={pending}
              onClick={() => onChoose('REMAINING_ONLY')}
              data-testid="allocation-remaining"
            >
              {t('onlyRemaining', values)}
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="md"
          className="w-full"
          disabled={pending}
          onClick={onCancel}
          data-testid="allocation-cancel"
        >
          {t('cancel')}
        </Button>
      </div>
    </div>
  );
}
