import { getTranslations } from 'next-intl/server';
import { SiteHeader } from '@/components/layout/SiteHeader';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('common');
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted sm:px-6">{t('council')}</div>
      </footer>
    </div>
  );
}
