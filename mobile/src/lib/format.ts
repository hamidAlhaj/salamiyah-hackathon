import { formatMoney, formatNumber, toLatinDigits, type Currency } from '@/shared';

/*
 * Western digits (0-9) for every number in both languages. The shared helpers already ask Intl for
 * `ar-SY-u-nu-latn`; toLatinDigits is a guard for JS engines whose Intl ignores the extension, and the
 * Arabic separators «٬» «٫» become «,» «.» with it.
 */
const latin = (text: string) => toLatinDigits(text).replace(/٬/g, ',').replace(/٫/g, '.');

export const money = (amount: string | number, currency: Currency, locale: 'ar' | 'en') =>
  latin(formatMoney(amount, currency, locale));

export const count = (value: number, locale: 'ar' | 'en') => latin(formatNumber(value, locale));

export const date = (iso: string, locale: 'ar' | 'en') =>
  latin(
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Damascus',
    }),
  );

export const dateTime = (iso: string, locale: 'ar' | 'en') =>
  latin(
    new Date(iso).toLocaleString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Damascus',
    }),
  );
