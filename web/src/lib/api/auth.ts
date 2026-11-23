import 'server-only';
import { cache } from 'react';
import type { AuthResponse, CurrentUser, GoogleSignInConfig } from '@/shared';
import { apiFetch, apiRedirectLocation } from './client';

export function login(phone: string, password: string) {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: { phone, password } });
}

/** Memoised per request: the root layout, (app) layout and page share one GET /auth/me. */
export const me = cache((token: string) => apiFetch<CurrentUser>('/auth/me', { token }));

/** Whether Sign in with Google is configured in api/.env (the login page hides the button if not). */
export function googleConfig() {
  return apiFetch<GoogleSignInConfig>('/auth/google/enabled');
}

/** The Google consent URL for this sign-in; `state` is the CSRF value kept in our cookie. */
export function googleConsentUrl(state: string) {
  return apiRedirectLocation('/auth/google', { state });
}

/** Hands Google's one-time code to the API, which exchanges it and returns the app session. */
export function googleExchange(code: string) {
  return apiFetch<AuthResponse>('/auth/google/callback', { query: { code } });
}

/** DONOR: add or change the phone (needed before donating) and the WhatsApp consent. */
export function updateMyPhone(token: string, body: { phone: string; whatsappOptIn: boolean }) {
  return apiFetch<CurrentUser>('/auth/me/phone', { method: 'PATCH', token, body });
}
