import 'server-only';
import type { OfficialReceipt } from '@/shared';
import { apiFetch } from './client';

/** A verified donation's public receipt, with its QR code (SVG) of the public receipt URL. */
export function getOfficialReceipt(receiptNo: string, lang: 'ar' | 'en') {
  return apiFetch<OfficialReceipt>(`/official-receipts/${encodeURIComponent(receiptNo)}`, {
    query: { lang },
  });
}
