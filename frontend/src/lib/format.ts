import type { DateTimeFormatOptions } from 'next-intl';

/**
 * Date formats for next-intl's `format.dateTime`: always Western digits (0-9), like money and counts
 * (see formatMoney/formatNumber in shared/utils). Use these instead of inline option objects.
 */
export const DATE_MEDIUM: DateTimeFormatOptions = { dateStyle: 'medium', numberingSystem: 'latn' };

export const DATE_LONG: DateTimeFormatOptions = { dateStyle: 'long', numberingSystem: 'latn' };

export const DATE_TIME_SHORT: DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
  numberingSystem: 'latn',
};
