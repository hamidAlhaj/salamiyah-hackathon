import 'server-only';
import type { CaseDetail, CaseRow, CreateCaseResult, Hospital } from '@/lib/types/staff';
import { apiFetch } from './client';

export function listCases(token: string, query: { overdue?: boolean }) {
  return apiFetch<CaseRow[]>('/cases', {
    token,
    query: { overdue: query.overdue ? 'true' : undefined },
  });
}

export function getCase(token: string, id: string) {
  return apiFetch<CaseDetail>(`/cases/${id}`, { token });
}

export function createCase(token: string, form: FormData) {
  return apiFetch<CreateCaseResult>('/cases', { method: 'POST', token, form });
}

export function reviewCase(token: string, id: string, body: Record<string, string>) {
  return apiFetch(`/cases/${id}/review`, { method: 'POST', token, body });
}

export function publishCase(token: string, id: string, body: Record<string, string | boolean>) {
  return apiFetch<{ campaignId: string; slug: string }>(`/cases/${id}/publish`, {
    method: 'POST',
    token,
    body,
  });
}

export function changeHospitalOrAmount(token: string, id: string, body: Record<string, string>) {
  return apiFetch<{ requiresReview: boolean; pledgesPaused: boolean }>(
    `/cases/${id}/hospital-amount`,
    { method: 'PATCH', token, body },
  );
}

export function listHospitals(token: string) {
  return apiFetch<Hospital[]>('/hospitals', { token });
}
