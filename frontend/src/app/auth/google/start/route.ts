import { NextResponse, type NextRequest } from 'next/server';
import * as authApi from '@/lib/api/auth';
import {
  encodeStateCookie,
  GOOGLE_COOKIE_PATH,
  GOOGLE_STATE_COOKIE,
  GOOGLE_STATE_MAX_AGE_SECONDS,
  isGoogleConsentUrl,
  newGoogleState,
  showGoogleButton,
  type GoogleLoginNotice,
} from '@/lib/google-signin';
import { sessionCookieOptions } from '@/lib/session';

export const dynamic = 'force-dynamic';

function backToLogin(notice: GoogleLoginNotice) {
  return new NextResponse(null, { status: 303, headers: { Location: `/login?google=${notice}` } });
}

/**
 * GET /auth/google/start (the "Continue with Google" link): new CSRF state in an HttpOnly cookie,
 * then 303 to Google's consent screen. When Google is not configured (or this is not the callback
 * host) it goes back to the login page with a notice instead.
 */
export async function GET(request: NextRequest) {
  let consentUrl: string;
  const state = newGoogleState();
  try {
    const config = await authApi.googleConfig();
    if (!showGoogleButton(config, request.headers.get('host'))) return backToLogin('unavailable');
    consentUrl = await authApi.googleConsentUrl(state);
  } catch {
    return backToLogin('unavailable');
  }
  if (!isGoogleConsentUrl(consentUrl)) return backToLogin('unavailable');

  const response = new NextResponse(null, { status: 303, headers: { Location: consentUrl } });
  response.cookies.set(
    GOOGLE_STATE_COOKIE,
    encodeStateCookie(state, request.nextUrl.searchParams.get('next') ?? undefined),
    {
      // Same flags as the session cookie ("lax" is sent on Google's top-level redirect back).
      ...sessionCookieOptions(),
      maxAge: GOOGLE_STATE_MAX_AGE_SECONDS,
      path: GOOGLE_COOKIE_PATH,
    },
  );
  return response;
}
