import 'server-only';
import { cache } from 'react';
import type { AuthResponse, CurrentUser } from '@/shared';
import { apiFetch } from './client';

export function login(phone: string, password: string) {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: { phone, password } });
}

/** Memoised per request: the root layout, (app) layout and page share one GET /auth/me. */
export const me = cache((token: string) => apiFetch<CurrentUser>('/auth/me', { token }));
