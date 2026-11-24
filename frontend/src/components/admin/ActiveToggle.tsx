'use client';

import { useTranslations } from 'next-intl';
import { ActionForm } from '@/components/forms/ActionForm';
import type { FormState } from '@/lib/actions/errors';

/**
 * Activate / deactivate one setup record (nothing is ever deleted). `fields` are the hidden inputs
 * that identify the record for the Server Action (e.g. { id } or { method }).
 */
export function ActiveToggle({
  action,
  fields,
  isActive,
  testId,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  fields: Record<string, string>;
  isActive: boolean;
  testId?: string;
}) {
  const t = useTranslations('adminSetup');
  const tCommon = useTranslations('common');
  return (
    <ActionForm
      action={action}
      submitLabel={isActive ? t('deactivate') : t('activate')}
      pendingLabel={tCommon('saving')}
      variant={isActive ? 'secondary' : 'primary'}
      submitClassName="!px-3 !py-1.5 !text-sm"
      className="!space-y-2"
      testId={testId}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input type="hidden" name="isActive" value={isActive ? 'false' : 'true'} />
    </ActionForm>
  );
}

/** The record's state as a small pill. */
export function ActiveBadge({ isActive }: { isActive: boolean }) {
  const t = useTranslations('adminSetup');
  return (
    <span
      data-testid="active-state"
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        isActive ? 'bg-accent-soft text-accent-strong' : 'bg-surface-muted text-muted'
      }`}
    >
      {isActive ? t('active') : t('inactive')}
    </span>
  );
}
