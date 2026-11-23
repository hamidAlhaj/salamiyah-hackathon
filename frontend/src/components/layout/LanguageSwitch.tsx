'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

/**
 * ع / EN switch. A plain POST form (works without JavaScript): /lang stores the `lang` cookie and
 * redirects back to the same URL, which re-renders with the new language and direction.
 */
export function LanguageSwitch() {
  const locale = useLocale();
  const t = useTranslations('language');
  const pathname = usePathname();
  const target = locale === 'ar' ? 'en' : 'ar';

  return (
    <form action="/lang" method="post">
      <input type="hidden" name="lang" value={target} />
      <input type="hidden" name="next" value={pathname} />
      <button
        type="submit"
        title={t('switchLabel')}
        data-testid="language-switch"
        className="flex items-center gap-1 rounded-xl px-2.5 py-2 text-sm font-semibold text-muted transition duration-150 hover:bg-surface-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span lang="ar" className={locale === 'ar' ? 'text-accent-strong' : undefined}>
          ع
        </span>
        <span aria-hidden="true" className="text-border">
          /
        </span>
        <span lang="en" className={locale === 'en' ? 'text-accent-strong' : undefined}>
          EN
        </span>
        {/* The visible "ع / EN" stays part of the accessible name (WCAG 2.5.3). */}
        <span className="sr-only">{t('switchLabel')}</span>
      </button>
    </form>
  );
}
