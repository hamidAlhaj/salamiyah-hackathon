import 'server-only';
import type { PublicCategory } from '@/shared';
import { apiFetch } from './client';

/** Active categories, ordered (data managed by ADMIN, never hard-coded in the web app). */
export function listCategories(lang: 'ar' | 'en') {
  return apiFetch<PublicCategory[]>('/categories', { query: { lang } });
}
