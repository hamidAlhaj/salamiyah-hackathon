import 'server-only';
import type { CollectorPledge, CollectorPoint, PledgeView } from '@/shared';
import { apiFetch } from './client';

/** My collection points with how many cash pledges wait at each. */
export function myPoints(token: string) {
  return apiFetch<CollectorPoint[]>('/collector/points', { token });
}

/** Cash pledges waiting to be handed over at my points. */
export function pendingPledges(token: string) {
  return apiFetch<CollectorPledge[]>('/collector/pledges', { token });
}

export function findByReference(token: string, referenceNo: string) {
  return apiFetch<CollectorPledge>(
    `/collector/pledges/by-reference/${encodeURIComponent(referenceNo)}`,
    { token },
  );
}

export function confirmReceived(token: string, pledgeId: string) {
  return apiFetch<CollectorPledge>(`/collector/pledges/${pledgeId}/confirm`, {
    method: 'POST',
    token,
  });
}

/** What I handed over: confirmed pledges and recorded box totals. */
export function history(token: string) {
  return apiFetch<CollectorPledge[]>('/collector/history', { token });
}

/** An anonymous cash amount (box total) for a campaign at one of my points. */
export function recordCash(
  token: string,
  body: { campaignId: string; collectionPointId: string; amount: string; donorName?: string },
) {
  return apiFetch<PledgeView>('/pledges/collector', { method: 'POST', token, body });
}
