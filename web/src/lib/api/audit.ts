import 'server-only';
import type { AuditHistoryItem } from '@/lib/types/staff';
import { apiFetch } from './client';

/** ADMIN history panels (the API refuses every other role). */
export function campaignHistory(token: string, id: string) {
  return apiFetch<AuditHistoryItem[]>(`/audit/campaigns/${id}`, { token });
}

export function caseHistory(token: string, id: string) {
  return apiFetch<AuditHistoryItem[]>(`/audit/cases/${id}`, { token });
}
