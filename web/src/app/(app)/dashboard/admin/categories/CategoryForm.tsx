'use client';

import { useTranslations } from 'next-intl';
import { CategoryIcon } from '@/components/campaigns/CategoryIcon';
import { ActionForm } from '@/components/forms/ActionForm';
import { Field } from '@/components/ui/Field';
import { createCategoryAction, updateCategoryAction } from '@/lib/actions/categories';
import type { AdminCategory } from '@/lib/types/staff';
import { BENEFICIARY_KINDS, CATEGORY_ICONS } from '@/shared';

/** Create (no `category`) or edit a category. The code is set once; flags are never editable here. */
export function CategoryForm({ category }: { category?: AdminCategory }) {
  const t = useTranslations('adminCategories');
  const tCommon = useTranslations('common');
  const tKinds = useTranslations('campaign.kinds');
  const editing = Boolean(category);
  const idPrefix = category ? `cat-${category.id}` : 'cat-new';

  return (
    <ActionForm
      action={editing ? updateCategoryAction : createCategoryAction}
      submitLabel={editing ? tCommon('save') : t('add')}
      pendingLabel={tCommon('saving')}
      resetOnSuccess={!editing}
      testId={editing ? 'category-edit-form' : 'category-create-form'}
    >
      {category && <input type="hidden" name="id" value={category.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        {!editing && (
          <Field
            id={`${idPrefix}-code`}
            label={t('code')}
            name="code"
            dir="ltr"
            required
            pattern="[A-Za-z][A-Za-z0-9_]{2,39}"
            hint={t('codeHint')}
            autoComplete="off"
          />
        )}
        <Field
          id={`${idPrefix}-order`}
          label={t('order')}
          name="sortOrder"
          type="number"
          min={0}
          max={10000}
          dir="ltr"
          defaultValue={category?.sortOrder ?? 100}
        />
        <Field
          id={`${idPrefix}-nameAr`}
          label={t('nameAr')}
          name="nameAr"
          required
          minLength={2}
          maxLength={60}
          defaultValue={category?.nameAr}
        />
        <Field
          id={`${idPrefix}-nameEn`}
          label={t('nameEn')}
          name="nameEn"
          dir="ltr"
          required
          minLength={2}
          maxLength={60}
          defaultValue={category?.nameEn}
        />
        <Field
          id={`${idPrefix}-descAr`}
          label={`${t('descriptionAr')} (${tCommon('optional')})`}
          name="descriptionAr"
          maxLength={500}
          defaultValue={category?.descriptionAr ?? ''}
        />
        <Field
          id={`${idPrefix}-descEn`}
          label={`${t('descriptionEn')} (${tCommon('optional')})`}
          name="descriptionEn"
          dir="ltr"
          maxLength={500}
          defaultValue={category?.descriptionEn ?? ''}
        />
        {!editing && (
          <Field
            as="select"
            id={`${idPrefix}-kind`}
            label={`${t('beneficiaryKind')} (${tCommon('optional')})`}
            name="beneficiaryKind"
            defaultValue=""
            hint={t('beneficiaryKindHint')}
          >
            <option value="">{t('beneficiaryKindAny')}</option>
            {BENEFICIARY_KINDS.map((k) => (
              <option key={k} value={k}>
                {tKinds(k)}
              </option>
            ))}
          </Field>
        )}
      </div>
      <fieldset>
        <legend className="text-sm font-medium">{t('icon')}</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
          {CATEGORY_ICONS.map((icon) => (
            <label key={icon} className="cursor-pointer">
              <input
                type="radio"
                name="icon"
                value={icon}
                required
                defaultChecked={(category?.icon ?? 'star') === icon}
                className="peer sr-only"
              />
              <span
                title={icon}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-muted transition peer-checked:border-brand-600 peer-checked:bg-accent-soft peer-checked:text-accent-strong peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
              >
                <CategoryIcon icon={icon} className="h-5 w-5" />
                <span className="sr-only">{icon}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </ActionForm>
  );
}
