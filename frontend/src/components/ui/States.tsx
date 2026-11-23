'use client';

import { useTranslations } from 'next-intl';
import { Button } from './Button';
import { Card } from './Card';

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center p-6" role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-track border-t-brand-600" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Body of every route-segment error.tsx: what happened and a retry. */
export function ErrorState({ reset }: { reset: () => void }) {
  const t = useTranslations('errors');
  return (
    <Card className="mx-auto my-10 max-w-lg text-center" role="alert">
      <h2 className="font-display text-xl font-bold">{t('pageTitle')}</h2>
      <p className="mt-2 text-sm text-muted">{t('pageBody')}</p>
      <Button className="mt-5" onClick={reset}>
        {t('retry')}
      </Button>
    </Card>
  );
}
