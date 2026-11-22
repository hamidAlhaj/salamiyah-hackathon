import { describe, expect, it } from 'vitest';
import { createFormatter } from 'next-intl';
import { formatMoney, formatNumber } from '@/shared';
import { DATE_LONG, DATE_MEDIUM } from './format';

const ARABIC_INDIC = /[٠-٩۰-۹]/;

describe('Western digits everywhere (money, counts, dates)', () => {
  it('formats Arabic money with 0-9 and Arabic currency text', () => {
    const ar = formatMoney('3000000', 'SYP', 'ar');
    expect(ar).not.toMatch(ARABIC_INDIC);
    expect(ar).toContain('3,000,000');
    expect(ar).toContain('ل.س');
  });

  it('formats English money and both languages’ counts with 0-9', () => {
    expect(formatMoney('1500.5', 'USD', 'en')).toBe('$1,500.50');
    expect(formatNumber(12400, 'ar')).toBe('12,400');
    expect(formatNumber(12400, 'en')).toBe('12,400');
  });

  it('formats Arabic dates with 0-9', () => {
    const format = createFormatter({ locale: 'ar', timeZone: 'Asia/Damascus' });
    const date = new Date('2026-11-22T10:00:00Z');
    for (const options of [DATE_MEDIUM, DATE_LONG]) {
      const text = format.dateTime(date, options);
      expect(text).not.toMatch(ARABIC_INDIC);
      expect(text).toContain('2026');
    }
  });
});
