import 'server-only';
import { cache } from 'react';
import type { AuthResponse, CurrentUser, GoogleSignInConfig } from '@/shared';
import { apiFetch, apiRedirectLocation } from './client';

export function login(identifier: string, password: string) {
  const account = identifier.includes('@') ? { email: identifier } : { phone: identifier };
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: { ...account, password } });
}

export function register(body: {
  fullName: string;
  phone: string;
  password: string;
  locale: 'ar' | 'en';
}) {
  return apiFetch<AuthResponse>('/auth/register', { method: 'POST', body });
}

export function emailRegistrationConfig() {
  return apiFetch<{ enabled: boolean }>('/auth/email-registration/enabled');
}

export function startEmailRegistration(body: { email: string; locale: 'ar' | 'en' }) {
  return apiFetch<{ accepted: true }>('/auth/email-registration/start', { method: 'POST', body });
}

export function completeEmailRegistration(body: {
  token: string;
  fullName: string;
  password: string;
}) {
  return apiFetch<AuthResponse>('/auth/email-registration/complete', { method: 'POST', body });
}

/** Memoised per request: the root layout, (app) layout and page share one GET /auth/me. */
export const me = cache((token: string) => apiFetch<CurrentUser>('/auth/me', { token }));

/** Whether Sign in with Google is configured in backend/.env (the login page hides the button if not). */
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
