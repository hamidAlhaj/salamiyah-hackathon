import 'server-only';
import type { PublicBeneficiary } from '@/shared';
import { apiFetch } from './client';

/** Anonymised beneficiaries of a public campaign: code, kind, area only. */
export function listCampaignBeneficiaries(campaignId: string) {
  return apiFetch<PublicBeneficiary[]>(`/campaigns/${campaignId}/beneficiaries`);
}
