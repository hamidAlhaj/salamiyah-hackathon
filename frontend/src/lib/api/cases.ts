import 'server-only';
import { apiFetch } from './client';

export type TrackStage =
  | 'RECEIVED'
  | 'UNDER_REVIEW'
  | 'NEEDS_INFO'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'DISBURSED'
  | 'REJECTED'
  | 'CLOSED';

export interface TrackResult {
  trackingNo: string;
  stage: TrackStage;
  updatedAt: string;
}

/** Public request tracking: the stage only, nothing else about the request. */
export function trackCase(no: string, phoneLast4: string) {
  return apiFetch<TrackResult>('/cases/track', { query: { no, phoneLast4 } });
}
