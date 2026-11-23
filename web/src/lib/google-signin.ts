import { randomBytes, timingSafeEqual } from 'crypto';
import type { GoogleSignInConfig } from '@/shared';
import { safeNextPath } from './next-path';

/**
 * Sign in with Google, web side (P22). The browser only ever talks to this web app and to Google:
 * 1. /auth/google/start makes a random CSRF `state`, keeps it in an HttpOnly cookie (10 min, scoped
 *    to /auth/google) and sends the browser to the consent URL the API builds for that state.
 * 2. Google redirects to /auth/google/callback?code&state. The route compares `state` with the
 *    cookie, deletes the cookie, and hands Google's one-time `code` to the API server-side; the API
 *    exchanges it and returns the usual session, which goes into the HttpOnly `session` cookie.
 * The app JWT never appears in a URL; the only thing left in history is Google's spent code.
 */
export const GOOGLE_STATE_COOKIE = 'google_oauth';
export const GOOGLE_STATE_MAX_AGE_SECONDS = 10 * 60;
export const GOOGLE_COOKIE_PATH = '/auth/google';

/** Outcomes shown on the login page as ?google=… (each has a message in auth.google.*). */
export type GoogleLoginNotice =
  'unavailable' | 'cancelled' | 'failed' | 'expired' | 'staff' | 'mismatch';

const STATE_RE = /^[A-Za-z0-9_-]{43}$/;

/** 32 random bytes, base64url (43 chars): what the API accepts as `state`. */
export function newGoogleState(): string {
  return randomBytes(32).toString('base64url');
}

/** Cookie value: the state and, optionally, the in-app page to return to. */
export function encodeStateCookie(state: string, next?: string): string {
  const safe = next ? safeNextPath(next) : undefined;
  return safe ? `${state}~${safe}` : state;
}

export function decodeStateCookie(
  value: string | undefined,
): { state: string; next?: string } | null {
  if (!value) return null;
  const [state, next] = value.split('~', 2);
  if (!STATE_RE.test(state)) return null;
  return { state, next: next ? safeNextPath(next) : undefined };
}

/** Constant-time comparison of the returned `state` with the one in our cookie. */
export function statesMatch(expected: string, received: string | null): boolean {
  if (!received || !STATE_RE.test(received)) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Only Google's own consent screen is an acceptable redirect target. */
export function isGoogleConsentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.host === 'accounts.google.com';
  } catch {
    return false;
  }
}

/**
 * The button shows only when the API has Google configured and this page is served from the host
 * Google redirects back to (otherwise the state cookie would be on another host and every attempt
 * would fail, e.g. on the LAN address while the callback is localhost).
 */
export function showGoogleButton(config: GoogleSignInConfig | null, host: string | null): boolean {
  if (!config?.enabled || !config.callbackOrigin || !host) return false;
  try {
    return new URL(config.callbackOrigin).host === host;
  } catch {
    return false;
  }
}

/** Maps the API's stable codes from the code exchange to the login page notice. */
export function noticeForApiCode(code: string | undefined): GoogleLoginNotice {
  if (code === 'google_staff_account') return 'staff';
  if (code === 'google_account_mismatch') return 'mismatch';
  if (code === 'google_sign_in_disabled') return 'unavailable';
  return 'failed';
}

export function isGoogleLoginNotice(value: unknown): value is GoogleLoginNotice {
  return (
    typeof value === 'string' &&
    ['unavailable', 'cancelled', 'failed', 'expired', 'staff', 'mismatch'].includes(value)
  );
}
