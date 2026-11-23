import 'server-only';
import type { CampaignAccountOverride, PaymentMethodConfigRow } from '@/lib/types/staff';
import { apiFetch } from './client';

export interface PaymentMethodConfigInput {
  labelAr?: string;
  labelEn?: string;
  accountName?: string;
  accountNameEn?: string;
  accountNumber?: string;
  instructionsAr?: string;
  instructionsEn?: string;
  isActive?: boolean;
  sortOrder?: number;
}

/** ADMIN: every method's default receiving details (fake for the hackathon), inactive too. */
export function listPaymentMethodConfigs(token: string) {
  return apiFetch<PaymentMethodConfigRow[]>('/payment-methods/config', { token });
}

export function updatePaymentMethodConfig(
  token: string,
  method: string,
  input: PaymentMethodConfigInput,
) {
  return apiFetch<PaymentMethodConfigRow>(`/payment-methods/config/${method}`, {
    method: 'PATCH',
    token,
    body: input,
  });
}

/** ADMIN: the campaign's own receiving accounts (any campaign status). */
export function listCampaignOverrides(token: string, campaignId: string) {
  return apiFetch<CampaignAccountOverride[]>(
    `/campaigns/${campaignId}/payment-accounts/overrides`,
    { token },
  );
}

export function removeCampaignOverride(token: string, campaignId: string, method: string) {
  return apiFetch<{ ok: true }>(`/campaigns/${campaignId}/payment-accounts/${method}`, {
    method: 'DELETE',
    token,
  });
}
