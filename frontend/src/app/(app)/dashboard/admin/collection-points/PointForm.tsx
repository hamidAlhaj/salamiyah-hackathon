'use client';

import { useTranslations } from 'next-intl';
import { ActionForm } from '@/components/forms/ActionForm';
import { Field } from '@/components/ui/Field';
import { createCollectionPointAction, updateCollectionPointAction } from '@/lib/actions/lookups';
import type { AdminCollectionPoint } from '@/lib/types/staff';
import { COLLECTION_POINT_TYPES } from '@/shared';

/** Create (no `point`) or edit a collection point. Collectors are assigned on the Users page. */
export function PointForm({ point }: { point?: AdminCollectionPoint }) {
  const t = useTranslations('adminSetup');
  const tCommon = useTranslations('common');
  const editing = Boolean(point);
  const prefix = point ? `cp-${point.id}` : 'cp-new';

  return (
    <ActionForm
      action={editing ? updateCollectionPointAction : createCollectionPointAction}
      submitLabel={editing ? tCommon('save') : t('points.add')}
      pendingLabel={tCommon('saving')}
      resetOnSuccess={!editing}
      testId={editing ? 'point-edit-form' : 'point-create-form'}
    >
      {point && <input type="hidden" name="id" value={point.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${prefix}-name`}
          label={t('points.name')}
          name="name"
          required
          minLength={3}
          maxLength={120}
          defaultValue={point?.name}
        />
        <Field
          as="select"
          id={`${prefix}-type`}
          label={t('points.type')}
          name="type"
          defaultValue={point?.type ?? 'CENTER'}
        >
          {COLLECTION_POINT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`pointTypes.${type}`)}
            </option>
          ))}
        </Field>
        <Field
          id={`${prefix}-area`}
          label={t('points.area')}
          name="area"
          required
          minLength={2}
          maxLength={60}
          defaultValue={point?.area}
        />
        <Field
          id={`${prefix}-contact`}
          label={`${t('points.contactName')} (${tCommon('optional')})`}
          name="contactName"
          maxLength={120}
          hint={t('points.contactHint')}
          defaultValue={point?.contactName ?? ''}
        />
      </div>
    </ActionForm>
  );
}
