import 'server-only';
import type { SpendingContext, StaffExpenditure } from '@/lib/types/staff';
import type { PublicExpenditure } from '@/shared';
import { apiFetch } from './client';

/** Staff: flags, approved hospital, balance and sponsored beneficiaries of a campaign. */
export function spendingContext(token: string, campaignId: string) {
  return apiFetch<SpendingContext>(`/campaigns/${campaignId}/spending-context`, { token });
}

/** Staff: every expenditure with its proof, public or not. */
export function listExpenditures(token: string, campaignId: string) {
  return apiFetch<StaffExpenditure[]>(`/campaigns/${campaignId}/expenditures`, { token });
}

/** multipart: fields + `proof` file. */
export function createExpenditure(token: string, form: FormData) {
  return apiFetch<{ id: string; campaignSpent: string; campaignStatus: string }>('/expenditures', {
    method: 'POST',
    token,
    form,
  });
}

/** multipart: `periodMonth` (+ optional shared `proof`). */
export function payMonth(token: string, campaignId: string, form: FormData) {
  return apiFetch<{ count: number; total: string; codes: string[]; campaignStatus: string }>(
    `/campaigns/${campaignId}/expenditures/monthly`,
    { method: 'POST', token, form },
  );
}

/** ADMIN: «تم الإنجاز» set by hand (an ongoing programme). */
export function markCompleted(token: string, campaignId: string) {
  return apiFetch(`/campaigns/${campaignId}/status`, {
    method: 'PATCH',
    token,
    body: { status: 'COMPLETED' },
  });
}

/** Public spending timeline (beneficiary payments by code only). */
export function publicSpending(campaignId: string, lang: 'ar' | 'en') {
  return apiFetch<PublicExpenditure[]>(`/campaigns/${campaignId}/spending`, { query: { lang } });
}
