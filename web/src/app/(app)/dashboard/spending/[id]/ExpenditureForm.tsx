'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { ActionForm } from '@/components/forms/ActionForm';
import { Field, labelClass } from '@/components/ui/Field';
import { createExpenditureAction } from '@/lib/actions/expenditures';
import type { SpendingContext } from '@/lib/types/staff';
import { formatMoney, PAYEE_TYPES, type PayeeType } from '@/shared';

const FILE_INPUT =
  'block w-full text-sm text-ink file:me-3 file:rounded-xl file:border-0 file:bg-accent-soft ' +
  'file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-strong hover:file:brightness-95';

/**
 * Record spending with a proof. The payee rules come from the category flags: lockedPayeeHospital
 * shows only the approved hospital (no other choice); other categories offer every payee type except
 * beneficiary payments, which go through the monthly run or a linked beneficiary.
 */
export function ExpenditureForm({ ctx, today }: { ctx: SpendingContext; today: string }) {
  const t = useTranslations('spending');
  const locale = useLocale() === 'en' ? 'en' : 'ar';
  const { campaign, hospital } = ctx;
  const locked = campaign.category.lockedPayeeHospital;
  const [payeeType, setPayeeType] = useState<PayeeType>(locked ? 'HOSPITAL' : 'CONTRACTOR');
  const [amount, setAmount] = useState('');
  const remaining = Number(campaign.remainingAmount);
  const typed = Number(amount || 0);
  const after = remaining - typed;
  const money = (v: number) => formatMoney(v, campaign.currency, locale);
  const types = PAYEE_TYPES.filter((p) => p !== 'HOSPITAL' || hospital);

  return (
    <ActionForm
      action={createExpenditureAction}
      submitLabel={t('submit')}
      pendingLabel={t('saving')}
      resetOnSuccess
      onResult={(s) => s.ok && setAmount('')}
      testId="expenditure-form"
    >
      <input type="hidden" name="campaignId" value={campaign.id} />
      <input type="hidden" name="slug" value={campaign.slug} />

      {locked && hospital ? (
        <div
          className="rounded-xl border border-brand-200 bg-accent-soft px-4 py-3 dark:border-brand-800"
          data-testid="locked-payee"
        >
          <input type="hidden" name="payeeType" value="HOSPITAL" />
          <p className="text-xs font-semibold text-accent-strong">{t('lockedTitle')}</p>
          <p className="mt-0.5 font-semibold">{hospital.name}</p>
          <p className="mt-1 text-xs text-muted">{t('lockedHint')}</p>
        </div>
      ) : (
        <>
          <fieldset>
            <legend className={labelClass}>{t('payeeType')}</legend>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
              {types
                .filter((p) => p !== 'BENEFICIARY_FAMILY')
                .map((p) => (
                  <label
                    key={p}
                    className={`cursor-pointer rounded-xl border-2 px-3 py-1.5 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-ring ${
                      payeeType === p
                        ? 'border-brand-600 bg-accent-soft text-accent-strong dark:border-brand-500'
                        : 'border-border hover:border-brand-300'
                    }`}
                    data-payee={p}
                  >
                    <input
                      type="radio"
                      name="payeeType"
                      value={p}
                      checked={payeeType === p}
                      onChange={() => setPayeeType(p)}
                      className="sr-only"
                    />
                    {t(`payeeTypes.${p}`)}
                  </label>
                ))}
            </div>
          </fieldset>
          <Field
            label={t('payeeLabel')}
            name="payeeLabel"
            hint={t('payeeLabelHint')}
            required
            minLength={2}
            maxLength={120}
          />
        </>
      )}

      <div className="space-y-1.5">
        <Field
          label={t('amount')}
          name="amount"
          inputMode="decimal"
          dir="ltr"
          required
          autoComplete="off"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, '').slice(0, 15))}
        />
        <p
          className={`text-sm tabular-nums ${after < 0 ? 'font-semibold text-danger' : 'text-muted'}`}
          aria-live="polite"
          data-testid="remaining-live"
        >
          {after < 0
            ? t('overBalance', { remaining: money(remaining) })
            : t('remainingAfter', { remaining: money(remaining), after: money(after) })}
        </p>
      </div>
      <Field
        label={t('paidAt')}
        name="paidAt"
        type="date"
        required
        defaultValue={today}
        max={today}
        dir="ltr"
      />
      <Field
        as="textarea"
        label={t('description')}
        name="description"
        required
        minLength={2}
        maxLength={1000}
        rows={2}
      />
      <Field
        as="textarea"
        label={t('descriptionEn')}
        name="descriptionEn"
        dir="ltr"
        maxLength={1000}
        rows={2}
      />
      <div className="space-y-1.5">
        <label htmlFor="proof" className={labelClass}>
          {t('proof')}
        </label>
        <input
          id="proof"
          name="proof"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          required
          className={FILE_INPUT}
          data-testid="proof-file"
        />
        <p className="text-xs text-muted">{t('proofHint')}</p>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-4 py-3">
        <input
          type="checkbox"
          name="proofPublic"
          className="mt-1 h-4 w-4 accent-brand-600"
          data-testid="proof-public"
        />
        <span>
          <span className="block text-sm font-medium">{t('publishProof')}</span>
          <span className="block text-xs text-muted">{t('publishProofHint')}</span>
        </span>
      </label>
    </ActionForm>
  );
}
