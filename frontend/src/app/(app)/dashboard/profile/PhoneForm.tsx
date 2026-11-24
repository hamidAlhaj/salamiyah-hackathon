'use client';

import { useTranslations } from 'next-intl';
import { ActionForm } from '@/components/forms/ActionForm';
import { Field } from '@/components/ui/Field';
import { updatePhoneAction } from '@/lib/actions/profile';

/**
 * The donor's phone and WhatsApp consent. The page keys this form by the saved values, so after a
 * save (React resets uncontrolled fields) it shows what is now stored.
 */
export function PhoneForm({
  phone,
  whatsappOptIn,
  isLogin,
}: {
  phone: string | null;
  whatsappOptIn: boolean;
  /** The phone is also the login of a phone + password account. */
  isLogin: boolean;
}) {
  const t = useTranslations('profile');
  return (
    <ActionForm
      action={updatePhoneAction}
      submitLabel={t('save')}
      pendingLabel={t('saving')}
      submitClassName="w-full sm:w-auto"
      testId="phone-form"
    >
      <Field
        label={t('phone')}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        dir="ltr"
        maxLength={40}
        defaultValue={phone ?? ''}
        hint={t('phoneHint')}
        required
      />
      <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted/60 px-4 py-3 text-sm">
        <input
          type="checkbox"
          name="whatsappOptIn"
          defaultChecked={whatsappOptIn}
          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-brand-600"
          data-testid="whatsapp-opt-in"
        />
        <span>{t('whatsapp')}</span>
      </label>
      {isLogin && <p className="text-xs text-muted">{t('loginNote')}</p>}
    </ActionForm>
  );
}
