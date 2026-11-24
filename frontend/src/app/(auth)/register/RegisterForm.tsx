'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useActionState } from 'react';
import { Field } from '@/components/ui/Field';
import { FormError, SubmitButton } from '@/components/ui/FormParts';
import { registerAction, type FormState } from '@/lib/actions/auth';

export function RegisterForm({ next }: { next?: string }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [state, formAction] = useActionState(registerAction, {} satisfies FormState);

  return (
    <>
      <form action={formAction} className="mt-8 space-y-5" noValidate>
        <FormError message={state.error} />
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}
        <Field label={t('fullName')} name="fullName" autoComplete="name" maxLength={120} required />
        <Field
          label={t('phone')}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          hint={t('phoneHint')}
          required
        />
        <Field
          label={t('password')}
          name="password"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          minLength={8}
          required
        />
        <SubmitButton pendingLabel={t('registerSubmitting')} className="w-full">
          {t('registerSubmit')}
        </SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        {t('alreadyAccount')}{' '}
        <Link
          href={next ? { pathname: '/login', query: { next } } : '/login'}
          className="font-semibold text-accent underline-offset-4 hover:underline"
        >
          {t('loginLink')}
        </Link>
      </p>
    </>
  );
}
