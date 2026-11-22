'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { ActionForm } from '@/components/forms/ActionForm';
import { Field, labelClass } from '@/components/ui/Field';
import { payMonthAction } from '@/lib/actions/expenditures';
import type { SpendingContext } from '@/lib/types/staff';
import { formatMoney } from '@/shared';

/**
 * «ادفع كفالة هذا الشهر» for categories with supportsMonthlySponsorship: one payment per sponsored
 * beneficiary at their monthly amount, recorded by code only. A paid month cannot be paid twice.
 */
export function MonthlyRunForm({ ctx, month }: { ctx: SpendingContext; month: string }) {
  const t = useTranslations('spending');
  const locale = useLocale() === 'en' ? 'en' : 'ar';
  const [periodMonth, setPeriodMonth] = useState(month);
  const sponsored = ctx.beneficiaries.filter((b) => b.monthlyAmount);
  const total = sponsored.reduce((s, b) => s + Number(b.monthlyAmount), 0);
  const money = (v: number | string) => formatMoney(v, ctx.campaign.currency, locale);
  const paid = ctx.paidMonths.some((m) => m.periodMonth === periodMonth);

  return (
    <div className="space-y-4" data-testid="monthly-run">
      <ul className="divide-y divide-border rounded-xl border border-border text-sm">
        {sponsored.map((b) => (
          <li key={b.id} className="flex items-center justify-between px-4 py-2">
            <span dir="ltr" className="font-semibold">
              {b.code}
            </span>
            <span className="tabular-nums">{money(b.monthlyAmount ?? 0)}</span>
          </li>
        ))}
        <li className="flex items-center justify-between bg-surface-muted px-4 py-2 font-bold">
          <span>{t('monthTotal', { count: sponsored.length })}</span>
          <span className="tabular-nums">{money(total)}</span>
        </li>
      </ul>
      <ActionForm
        action={payMonthAction}
        submitLabel={t('payMonth', { month: periodMonth })}
        pendingLabel={t('saving')}
        testId="monthly-form"
      >
        <input type="hidden" name="campaignId" value={ctx.campaign.id} />
        <input type="hidden" name="slug" value={ctx.campaign.slug} />
        <Field
          label={t('periodMonth')}
          name="periodMonth"
          type="month"
          required
          dir="ltr"
          value={periodMonth}
          onChange={(e) => setPeriodMonth(e.target.value)}
        />
        {paid && (
          <p
            className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning"
            data-testid="month-paid-note"
          >
            {t('monthAlreadyPaid', { month: periodMonth })}
          </p>
        )}
        <div className="space-y-1.5">
          <label htmlFor="monthly-proof" className={labelClass}>
            {t('monthlyProof')}
          </label>
          <input
            id="monthly-proof"
            name="proof"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="block w-full text-sm text-ink file:me-3 file:rounded-xl file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-strong"
          />
        </div>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" name="proofPublic" className="mt-1 h-4 w-4 accent-brand-600" />
          <span className="text-sm">{t('publishProof')}</span>
        </label>
      </ActionForm>
      {ctx.paidMonths.length > 0 && (
        <p className="text-xs text-muted">
          {t('paidMonths')}{' '}
          <span dir="ltr">{ctx.paidMonths.map((m) => m.periodMonth).join('، ')}</span>
        </p>
      )}
    </div>
  );
}
