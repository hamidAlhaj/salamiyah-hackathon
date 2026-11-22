import 'server-only';
import type { StaffCampaignRow } from '@/lib/types/staff';
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
