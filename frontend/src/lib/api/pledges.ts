import 'server-only';
import type {
  AllocationPreview,
  CreatePledgeResult,
  PaymentMethod,
  PledgeView,
  PublicCollectionPoint,
  SurplusChoice,
} from '@/shared';
import { apiFetch } from './client';

export interface PledgeInput {
  campaignId: string;
  amount: string;
  isAnonymousDisplay: boolean;
  /** Only when the amount exceeds the campaign's remaining need (docs/fund-contract.md). */
  surplusChoice?: SurplusChoice;
  expectedCampaignShare?: string;
}

/** Public: how a donation would be split between the campaign and the general council fund. */
export function previewAllocation(campaignId: string, amount: string, lang: 'ar' | 'en') {
  const q = new URLSearchParams({ amount, lang });
  return apiFetch<AllocationPreview>(`/campaigns/${campaignId}/allocation?${q}`);
}

/** Money held because the campaign was already full goes to the general council fund. */
export function giveHeldToFund(token: string, pledgeId: string) {
  return apiFetch<PledgeView>(`/pledges/${pledgeId}/allocation-decision`, {
    method: 'POST',
    token,
    body: { decision: 'FUND' },
  });
}

/** Pledge & Verify: the pledge, plus the campaign's receiving account and the reference for the note. */
export function createPledge(token: string, input: PledgeInput & { method: PaymentMethod }) {
  return apiFetch<CreatePledgeResult>('/pledges', { method: 'POST', token, body: input });
}

/** Simulated instant payment («Demo»): DEMO_CONFIRMED, never verified money. */
export function createDemoPledge(token: string, input: PledgeInput & { method: PaymentMethod }) {
  return apiFetch<PledgeView>('/pledges/demo', { method: 'POST', token, body: input });
}

/** Cash at an active collection point: a reference to show the collector. */
export function createCashPledge(
  token: string,
  input: PledgeInput & { collectionPointId: string },
) {
  return apiFetch<PledgeView>('/pledges/cash', { method: 'POST', token, body: input });
}

/** multipart: `receipt` file + optional `transferRef`. */
export function uploadReceipt(token: string, pledgeId: string, form: FormData) {
  return apiFetch<PledgeView>(`/pledges/${pledgeId}/receipts`, { method: 'POST', token, form });
}

/** «تبرعاتي»: every pledge of the signed-in donor with its status. */
export function myPledges(token: string) {
  return apiFetch<PledgeView[]>('/pledges/mine', { token });
}

/** Public: active collection points for cash donations. */
export function listActiveCollectionPoints() {
  return apiFetch<PublicCollectionPoint[]>('/collection-points/active');
}
