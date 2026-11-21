'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Field } from '@/components/ui/Field';
import { FormError, SubmitButton } from '@/components/ui/FormParts';
import { loginAction, type FormState } from '@/lib/actions/auth';

const initialState: FormState = {};

export function LoginForm() {
  const t = useTranslations('auth');
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      <FormError message={state.error} />
      <Field
        label={t('phone')}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="username"
        dir="ltr"
        hint={t('phoneHint')}
        required
      />
      <Field
        label={t('password')}
        name="password"
        type="password"
        autoComplete="current-password"
        dir="ltr"
        required
      />
      <SubmitButton pendingLabel={t('submitting')} className="w-full">
        {t('submit')}
      </SubmitButton>
    </form>
  );
}
