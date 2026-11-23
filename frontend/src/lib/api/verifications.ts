import 'server-only';
import type { VerificationItem, VerificationStatusTab } from '@/lib/types/staff';
import { apiFetch } from './client';

/** The finance queue by status: PENDING oldest first, decided ones newest first (API order). */
export function listVerifications(token: string, status: VerificationStatusTab) {
  return apiFetch<VerificationItem[]>('/verifications', { token, query: { status } });
}

export function approveVerification(token: string, id: string) {
  return apiFetch<{ officialReceiptNo: string | null }>(`/verifications/${id}/approve`, {
    method: 'POST',
    token,
  });
}

export function rejectVerification(token: string, id: string, reason: string) {
  return apiFetch(`/verifications/${id}/reject`, { method: 'POST', token, body: { reason } });
}
