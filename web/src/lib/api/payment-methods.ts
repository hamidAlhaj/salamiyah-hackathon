import 'server-only';
import type { PaymentAccount } from '@/shared';
import { apiFetch } from './client';

/** This campaign's receiving accounts (defaults with its overrides applied). Fake for the hackathon. */
export function getCampaignAccounts(campaignId: string, lang: 'ar' | 'en') {
  return apiFetch<PaymentAccount[]>(`/campaigns/${campaignId}/payment-accounts`, {
    query: { lang },
  });
}

/** Active payment methods with their default (fake) receiving accounts. */
export function listPaymentMethods(lang: 'ar' | 'en') {
  return apiFetch<PaymentAccount[]>('/payment-methods', { query: { lang } });
}
