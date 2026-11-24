'use client';

import { useTranslations } from 'next-intl';
import { ActionForm } from '@/components/forms/ActionForm';
import { Field } from '@/components/ui/Field';
import { createBeneficiaryAction } from '@/lib/actions/beneficiaries';
import { BENEFICIARY_KINDS } from '@/shared';

/** Register an anonymised beneficiary; the API allocates the public code (B-XXXX). */
export function NewBeneficiaryForm() {
  const t = useTranslations('adminCampaigns');
  const tKinds = useTranslations('campaign.kinds');
  const tCommon = useTranslations('common');
  return (
    <ActionForm
      action={createBeneficiaryAction}
      submitLabel={t('registerBeneficiary')}
      pendingLabel={tCommon('saving')}
      variant="secondary"
      resetOnSuccess
      testId="new-beneficiary-form"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          as="select"
          id="nb-kind"
          label={t('beneficiaryKind')}
          name="kind"
          defaultValue="FAMILY"
        >
          {BENEFICIARY_KINDS.map((k) => (
            <option key={k} value={k}>
              {tKinds(k)}
            </option>
          ))}
        </Field>
        <Field
          id="nb-name"
          label={t('beneficiaryName')}
          name="fullName"
          required
          minLength={3}
          maxLength={120}
        />
        <Field id="nb-area" label={t('beneficiaryArea')} name="area" minLength={2} maxLength={60} />
        <Field id="nb-phone" label={t('beneficiaryPhone')} name="phone" type="tel" dir="ltr" />
      </div>
    </ActionForm>
  );
}
