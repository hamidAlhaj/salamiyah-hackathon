import 'server-only';
import type { OfficialReceipt } from '@/shared';
import { apiFetch } from './client';

export function getOfficialReceipt(receiptNo: string) {
  return apiFetch<OfficialReceipt>(`/official-receipts/${encodeURIComponent(receiptNo)}`);
}
