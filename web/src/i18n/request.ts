import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { LANG_COOKIE, toLocale } from './locale';

// next-intl without URL routing: the locale comes from the `lang` cookie on every request.
export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = toLocale(store.get(LANG_COOKIE)?.value);
  const messages = (await import(`../../messages/${locale}.json`)) as {
    default: Record<string, unknown>;
  };
  return { locale, messages: messages.default, timeZone: 'Asia/Damascus' };
});
