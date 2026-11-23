import { describe, expect, it } from 'vitest';
import {
  decodeStateCookie,
  encodeStateCookie,
  isGoogleConsentUrl,
  isGoogleLoginNotice,
  newGoogleState,
  noticeForApiCode,
  showGoogleButton,
  statesMatch,
} from './google-signin';

describe('Sign in with Google (web side)', () => {
  it('makes a fresh 43-char URL-safe state each time', () => {
    const a = newGoogleState();
    const b = newGoogleState();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });

  it('keeps only a known in-app page to return to in the state cookie', () => {
    const state = newGoogleState();
    expect(decodeStateCookie(encodeStateCookie(state, '/campaigns/roof-repair/donate'))).toEqual({
      state,
      next: '/campaigns/roof-repair/donate',
    });
    expect(decodeStateCookie(encodeStateCookie(state, '//evil.example'))).toEqual({
      state,
      next: undefined,
    });
    expect(decodeStateCookie(`${state}~https://evil.example`)?.next).toBeUndefined();
    expect(decodeStateCookie('tampered')).toBeNull();
    expect(decodeStateCookie(undefined)).toBeNull();
  });

  it('accepts the callback only when the returned state equals the cookie (CSRF)', () => {
    const state = newGoogleState();
    expect(statesMatch(state, state)).toBe(true);
    expect(statesMatch(state, newGoogleState())).toBe(false);
    expect(statesMatch(state, null)).toBe(false);
    expect(statesMatch(state, `${state}x`)).toBe(false);
  });

  it("only redirects to Google's own consent screen", () => {
    expect(isGoogleConsentUrl('https://accounts.google.com/o/oauth2/v2/auth?client_id=x')).toBe(
      true,
    );
    expect(isGoogleConsentUrl('http://accounts.google.com/o/oauth2/v2/auth')).toBe(false);
    expect(isGoogleConsentUrl('https://accounts.google.com.evil.example/')).toBe(false);
    expect(isGoogleConsentUrl('/login')).toBe(false);
  });

  it('hides the button unless Google is configured and this is the callback host', () => {
    const on = { enabled: true, callbackOrigin: 'http://localhost:3000' };
    expect(showGoogleButton(on, 'localhost:3000')).toBe(true);
    expect(showGoogleButton(on, '192.168.1.20:3000')).toBe(false);
    expect(showGoogleButton({ enabled: false, callbackOrigin: null }, 'localhost:3000')).toBe(
      false,
    );
    expect(showGoogleButton(null, 'localhost:3000')).toBe(false);
    expect(showGoogleButton(on, null)).toBe(false);
  });

  it('maps the API refusals to login notices', () => {
    expect(noticeForApiCode('google_staff_account')).toBe('staff');
    expect(noticeForApiCode('google_account_mismatch')).toBe('mismatch');
    expect(noticeForApiCode('google_sign_in_disabled')).toBe('unavailable');
    expect(noticeForApiCode('google_sign_in_failed')).toBe('failed');
    expect(noticeForApiCode(undefined)).toBe('failed');
    expect(isGoogleLoginNotice('expired')).toBe(true);
    expect(isGoogleLoginNotice('<script>')).toBe(false);
  });
});
