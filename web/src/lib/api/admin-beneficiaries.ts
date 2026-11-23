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

/** ADMIN corrects a record; the public code never changes. */
export function updateBeneficiary(
  token: string,
  id: string,
  input: { kind?: string; fullName?: string; area?: string; phone?: string },
) {
  return apiFetch<StaffBeneficiary>(`/beneficiaries/${id}`, {
    method: 'PATCH',
    token,
    body: input,
  });
}

/** ADMIN changes a link's monthly amount or ends the link. */
export function updateBeneficiaryLink(
  token: string,
  campaignId: string,
  beneficiaryId: string,
  input: { monthlyAmount?: string; end?: boolean },
) {
  return apiFetch<{ code: string }>(`/campaigns/${campaignId}/beneficiaries/${beneficiaryId}`, {
    method: 'PATCH',
    token,
    body: input,
  });
}
