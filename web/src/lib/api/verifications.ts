import 'server-only';
import type { VerificationItem } from '@/lib/types/staff';
import { apiFetch } from './client';

export function listPendingVerifications(token: string) {
  return apiFetch<VerificationItem[]>('/verifications', { token, query: { status: 'PENDING' } });
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
