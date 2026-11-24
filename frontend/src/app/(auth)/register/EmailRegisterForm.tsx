'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useActionState, useEffect, useState } from 'react';
import { Field } from '@/components/ui/Field';
import { FormError, SubmitButton } from '@/components/ui/FormParts';
import { completeEmailRegistrationAction, startEmailRegistrationAction } from '@/lib/actions/auth';

export function EmailRegisterForm({ enabled }: { enabled: boolean }) {
  const locale = useLocale();
  const t = useTranslations('auth');
  const [token, setToken] = useState('');
  const [start, sendLink] = useActionState(startEmailRegistrationAction, {});
  const [complete, createAccount] = useActionState(completeEmailRegistrationAction, {});

  useEffect(() => {
    function readVerificationLink() {
      const proof = new URLSearchParams(window.location.hash.slice(1)).get('token');
      if (!proof) return;
      setToken(proof);
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname + window.location.search,
      );
    }
    readVerificationLink();
    window.addEventListener('hashchange', readVerificationLink);
    return () => window.removeEventListener('hashchange', readVerificationLink);
  }, []);

  if (token) {
    return (
      <form action={createAccount} className="mt-8 space-y-5">
        <FormError message={complete.error} />
        <input type="hidden" name="token" value={token} />
        <Field
          label={t('fullName')}
          name="fullName"
          autoComplete="name"
          minLength={3}
          maxLength={120}
          required
        />
        <Field
          label={t('password')}
          name="password"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          minLength={8}
          maxLength={72}
          required
        />
        <SubmitButton pendingLabel={t('registerSubmitting')} className="w-full">
          {t('registerSubmit')}
        </SubmitButton>
      </form>
    );
  }
  if (!enabled) return <p className="mt-6 text-sm text-muted">{t('emailDeliveryUnavailable')}</p>;
  if (start.sent)
    return (
      <p role="status" className="mt-6 text-sm text-ink">
        {t('emailLinkSent')}
      </p>
    );
  return (
    <form action={sendLink} className="mt-8 space-y-5">
      <FormError message={start.error} />
      <input type="hidden" name="locale" value={locale} />
      <Field
        label={t('email')}
        name="email"
        type="email"
        autoComplete="email"
        dir="ltr"
        maxLength={254}
        required
      />
      <SubmitButton pendingLabel={t('emailSending')} className="w-full">
        {t('emailSendLink')}
      </SubmitButton>
    </form>
  );
}
