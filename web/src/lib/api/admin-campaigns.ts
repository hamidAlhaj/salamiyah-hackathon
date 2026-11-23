import 'server-only';
import type { StaffCampaignDetail, StaffCampaignRow } from '@/lib/types/staff';
import { apiFetch } from './client';

export interface CampaignInput {
  categoryId: string;
  titleAr: string;
  titleEn?: string;
  summaryAr: string;
  summaryEn?: string;
  targetAmount: string;
  currency: string;
  priority: string;
  coverKey?: string;
  area?: string;
  isOngoing: boolean;
  status: 'ACTIVE' | 'DRAFT';
}

export function listStaffCampaigns(token: string) {
  return apiFetch<StaffCampaignRow[]>('/campaigns/staff/all', { token });
}

export function createCampaign(token: string, input: CampaignInput) {
  return apiFetch<{ id: string; slug: string; status: string }>('/campaigns', {
    method: 'POST',
    token,
    body: input,
  });
}

export function setCampaignAccount(
  token: string,
  campaignId: string,
  method: string,
  input: { accountName: string; accountNumber: string; note?: string },
) {
  return apiFetch(`/campaigns/${campaignId}/payment-accounts/${method}`, {
    method: 'PUT',
    token,
    body: input,
  });
}

/** One campaign with all its updates, for the management page (ADMIN). */
export function getStaffCampaign(token: string, id: string) {
  return apiFetch<StaffCampaignDetail>(`/campaigns/staff/${id}`, { token });
}

export interface CampaignEditInput {
  titleAr?: string;
  titleEn?: string;
  summaryAr?: string;
  summaryEn?: string;
  coverKey?: string;
  area?: string;
  priority?: string;
}

/** Edits titles, anonymised summaries, cover, area and priority ('' clears an optional text). */
export function updateCampaign(token: string, id: string, input: CampaignEditInput) {
  return apiFetch<{ id: string; slug: string }>(`/campaigns/${id}`, {
    method: 'PATCH',
    token,
    body: input,
  });
}

/** Publish, pause / resume new pledges, mark completed or close. */
export function setCampaignLifecycle(
  token: string,
  id: string,
  input: { status?: string; acceptsPledges?: boolean },
) {
  return apiFetch<{ id: string; slug: string; status: string }>(`/campaigns/${id}/status`, {
    method: 'PATCH',
    token,
    body: input,
  });
}

/** A public update shown on the campaign page. */
export function postCampaignUpdate(
  token: string,
  id: string,
  input: { bodyAr: string; bodyEn?: string },
) {
  return apiFetch<{ id: string }>(`/campaigns/${id}/updates`, {
    method: 'POST',
    token,
    body: input,
  });
}
