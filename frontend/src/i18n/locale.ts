export const LOCALES = ['ar', 'en'] as const;
export type AppLocale = (typeof LOCALES)[number];

/** Arabic is the default; English only when the visitor chose it with the language switch. */
export const DEFAULT_LOCALE: AppLocale = 'ar';

/** Cookie set by POST /lang (app/lang/route.ts). No locale in the URL, no middleware. */
export const LANG_COOKIE = 'lang';

export function toLocale(value: string | undefined | null): AppLocale {
  return value === 'en' ? 'en' : DEFAULT_LOCALE;
}

export function dirFor(locale: AppLocale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
