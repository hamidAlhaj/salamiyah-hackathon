import 'server-only';
import type { TransparencyStats } from '@/shared';
import { apiFetch } from './client';

/** Public transparency aggregates (no identities; demo money apart). */
export function transparencyStats(lang: 'ar' | 'en') {
  return apiFetch<TransparencyStats>('/stats/transparency', { query: { lang } });
}
