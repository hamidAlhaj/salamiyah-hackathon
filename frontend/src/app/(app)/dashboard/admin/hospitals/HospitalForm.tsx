'use client';

import { useTranslations } from 'next-intl';
import { ActionForm } from '@/components/forms/ActionForm';
import { Field } from '@/components/ui/Field';
import { createHospitalAction, updateHospitalAction } from '@/lib/actions/lookups';
import type { AdminHospital } from '@/lib/types/staff';

/** Create (no `hospital`) or edit an approved hospital. */
export function HospitalForm({ hospital }: { hospital?: AdminHospital }) {
  const t = useTranslations('adminSetup');
  const tCommon = useTranslations('common');
  const editing = Boolean(hospital);
  const prefix = hospital ? `h-${hospital.id}` : 'h-new';

  return (
    <ActionForm
      action={editing ? updateHospitalAction : createHospitalAction}
      submitLabel={editing ? tCommon('save') : t('hospitals.add')}
      pendingLabel={tCommon('saving')}
      resetOnSuccess={!editing}
      testId={editing ? 'hospital-edit-form' : 'hospital-create-form'}
    >
      {hospital && <input type="hidden" name="id" value={hospital.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${prefix}-nameAr`}
          label={t('hospitals.nameAr')}
          name="nameAr"
          required
          minLength={3}
          maxLength={120}
          defaultValue={hospital?.nameAr}
        />
        <Field
          id={`${prefix}-nameEn`}
          label={`${t('hospitals.nameEn')} (${tCommon('optional')})`}
          name="nameEn"
          dir="ltr"
          minLength={2}
          maxLength={120}
          defaultValue={hospital?.nameEn ?? ''}
        />
        <Field
          id={`${prefix}-city`}
          label={t('hospitals.city')}
          name="city"
          required
          minLength={2}
          maxLength={60}
          defaultValue={hospital?.city ?? 'السلمية'}
        />
        <label className="flex items-center gap-2.5 self-end pb-3 text-sm font-medium">
          <input
            type="checkbox"
            name="isPrivate"
            defaultChecked={hospital?.isPrivate ?? false}
            className="h-4 w-4 accent-brand-700"
          />
          {t('hospitals.isPrivate')}
        </label>
      </div>
    </ActionForm>
  );
}
