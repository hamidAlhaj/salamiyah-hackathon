import { createHmac } from 'node:crypto';

/** الرقم الوطني لا يُخزَّن نصاً (NFR-01): HMAC-SHA256 + آخر 4 أرقام. */
export function hashNationalId(
  nationalId: string,
  key: string,
): { hash: string; last4: string } {
  const normalized = nationalId.replace(/\D/g, '');
  return {
    hash: createHmac('sha256', key).update(normalized).digest('hex'),
    last4: normalized.slice(-4),
  };
}
