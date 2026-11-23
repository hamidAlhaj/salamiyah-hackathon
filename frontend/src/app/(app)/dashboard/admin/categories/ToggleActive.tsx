'use client';

import { useTranslations } from 'next-intl';
import { ActionForm } from '@/components/forms/ActionForm';
import { setCategoryActiveAction } from '@/lib/actions/categories';

/** Activate / deactivate one category (system categories can be deactivated, never deleted). */
export function ToggleActive({
  id,
  isActive,
  code,
}: {
  id: string;
  isActive: boolean;
  code: string;
}) {
  const t = useTranslations('adminCategories');
  const tCommon = useTranslations('common');
  return (
    <ActionForm
      action={setCategoryActiveAction}
      submitLabel={isActive ? t('deactivate') : t('activate')}
      pendingLabel={tCommon('saving')}
      variant={isActive ? 'secondary' : 'primary'}
      submitClassName="!px-3 !py-1.5 !text-sm"
      className="!space-y-2"
      testId={`toggle-${code}`}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isActive" value={isActive ? 'false' : 'true'} />
    </ActionForm>
  );
}
