import { getTranslations } from 'next-intl/server';
import { HeaderBell } from '@/components/layout/HeaderBell';
import { SiteHeader } from '@/components/layout/SiteHeader';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('common');
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader bell={<HeaderBell />} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border print:hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted sm:px-6">{t('council')}</div>
      </footer>
    </div>
  );
}
