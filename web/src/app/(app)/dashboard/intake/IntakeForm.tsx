'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ActionForm } from '@/components/forms/ActionForm';
import { Field } from '@/components/ui/Field';
import { submitCaseAction, type IntakeState } from '@/lib/actions/cases';
import type { CreateCaseResult } from '@/lib/types/staff';
import { CASE_CATEGORIES } from '@/shared';

/** STAFF registers a medical request with the report; duplicate warnings are shown, not blocking. */
export function IntakeForm() {
  const t = useTranslations('intake');
  const tCategory = useTranslations('category');
  const tCommon = useTranslations('common');
  const [result, setResult] = useState<CreateCaseResult | null>(null);
  const w = result?.warnings;
  const hasWarnings =
    !!w &&
    (w.openCasesForSameNationalId.length > 0 ||
      w.otherBeneficiariesWithSamePhone.length > 0 ||
      w.otherPrograms.length > 0);

  return (
    <div className="space-y-5">
      {result && (
        <section
          className="rounded-2xl border border-border bg-surface p-5 shadow-card"
          data-testid="intake-result"
        >
          <p className="font-semibold">
            {t('done', { no: result.trackingNo })}{' '}
            <Link href={`/dashboard/cases/${result.id}`} className="text-accent underline">
              {t('openCase')}
            </Link>
          </p>
          {hasWarnings && (
            <div
              className="mt-3 rounded-xl border border-warning-line bg-warning-soft p-4 text-sm text-warning"
              data-testid="intake-warnings"
            >
              <p className="font-semibold">{t('warningsTitle')}</p>
              <ul className="mt-1 list-disc space-y-1 ps-5">
                {w.openCasesForSameNationalId.length > 0 && (
                  <li>
                    {t('warnOpenCases', {
                      list: w.openCasesForSameNationalId.map((c) => c.trackingNo).join(', '),
                    })}
                  </li>
                )}
                {w.otherBeneficiariesWithSamePhone.length > 0 && (
                  <li>{t('warnSamePhone', { count: w.otherBeneficiariesWithSamePhone.length })}</li>
                )}
                {w.otherPrograms.length > 0 && (
                  <li>{t('warnPrograms', { list: w.otherPrograms.join('، ') })}</li>
                )}
              </ul>
            </div>
          )}
        </section>
      )}
      <ActionForm
        action={submitCaseAction}
        submitLabel={t('submit')}
        pendingLabel={tCommon('saving')}
        resetOnSuccess
        onResult={(state: IntakeState) => state.result && setResult(state.result)}
        className="rounded-2xl border border-border bg-surface p-6 shadow-card"
        testId="intake-form"
      >
        <Field label={t('name')} name="beneficiaryName" required minLength={3} maxLength={120} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t('phone')}
            name="beneficiaryPhone"
            type="tel"
            dir="ltr"
            required
            placeholder="09xx xxx xxx"
          />
          <Field
            label={t('nationalId')}
            name="nationalId"
            inputMode="numeric"
            dir="ltr"
            required
            pattern="[0-9٠-٩ ]{6,20}"
          />
          <Field label={t('council')} name="localCouncil" required minLength={2} maxLength={80} />
          <Field as="select" label={t('category')} name="category" defaultValue="SURGERY">
            {CASE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {tCategory(c)}
              </option>
            ))}
          </Field>
        </div>
        <Field
          as="textarea"
          label={t('description')}
          name="description"
          required
          minLength={10}
          rows={4}
        />
        <Field
          label={t('amount')}
          name="requestedAmount"
          inputMode="decimal"
          dir="ltr"
          required
          pattern="[0-9]+(\.[0-9]{1,2})?"
        />
        <Field
          label={t('report')}
          name="medicalReport"
          type="file"
          required
          accept="image/jpeg,image/png,application/pdf"
        />
      </ActionForm>
    </div>
  );
}
