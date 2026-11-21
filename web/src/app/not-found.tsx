import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default async function NotFound() {
  const t = await getTranslations('errors');
  return (
    <main id="main" className="px-4">
      <Card className="mx-auto my-16 max-w-lg text-center">
        <h1 className="font-display text-2xl font-bold">{t('notFoundTitle')}</h1>
        <p className="mt-2 text-muted">{t('notFoundBody')}</p>
        <Link href="/" className={buttonClasses('primary', 'md', 'mt-6')}>
          {t('home')}
        </Link>
      </Card>
    </main>
  );
}
