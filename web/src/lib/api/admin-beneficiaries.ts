import 'server-only';
import type { StaffBeneficiary } from '@/lib/types/staff';
import { apiFetch } from './client';

/** Staff search (ADMIN, STAFF). Includes private names: staff screens only. */
export function searchBeneficiaries(token: string, q?: string) {
  return apiFetch<StaffBeneficiary[]>('/beneficiaries', { token, query: { q } });
}

export function createBeneficiary(
  token: string,
  input: { kind: string; fullName: string; area?: string; phone?: string },
) {
  return apiFetch<StaffBeneficiary>('/beneficiaries', { method: 'POST', token, body: input });
}

export function linkBeneficiary(
  token: string,
  campaignId: string,
  input: { beneficiaryId: string; monthlyAmount?: string },
) {
  return apiFetch<{ code: string }>(`/campaigns/${campaignId}/beneficiaries`, {
    method: 'POST',
    token,
    body: input,
  });
}
