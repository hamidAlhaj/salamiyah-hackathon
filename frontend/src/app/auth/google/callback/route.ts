import { NextResponse, type NextRequest } from 'next/server';
import * as authApi from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import {
  decodeStateCookie,
  GOOGLE_COOKIE_PATH,
  GOOGLE_STATE_COOKIE,
  noticeForApiCode,
  statesMatch,
} from '@/lib/google-signin';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';
import { safeRevalidate } from '@/lib/actions/validation';

export const dynamic = 'force-dynamic';

/** 303 to `location`, always dropping the one-time state cookie. */
function finish(location: string) {
  const response = new NextResponse(null, { status: 303, headers: { Location: location } });
  response.cookies.set(GOOGLE_STATE_COOKIE, '', { path: GOOGLE_COOKIE_PATH, maxAge: 0 });
  return response;
}

/**
 * GET /auth/google/callback (GOOGLE_CALLBACK_URL): Google sends the browser back here with a
 * one-time `code` and our `state`. The state must match the HttpOnly cookie set by /start (CSRF);
 * the code is exchanged by the API server-side and the session goes into the HttpOnly cookie. A
 * donor without a phone lands on the profile page to add one (donating needs it).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const saved = decodeStateCookie(request.cookies.get(GOOGLE_STATE_COOKIE)?.value);
  if (!saved || !statesMatch(saved.state, params.get('state'))) {
    return finish('/login?google=expired');
  }
  if (params.has('error')) {
    return finish(
      `/login?google=${params.get('error') === 'access_denied' ? 'cancelled' : 'failed'}`,
    );
  }
  const code = params.get('code');
  if (!code || code.length > 2048) return finish('/login?google=failed');

  let session: Awaited<ReturnType<typeof authApi.googleExchange>>;
  try {
    session = await authApi.googleExchange(code);
  } catch (err) {
    const raw = err instanceof ApiError ? err.body?.message : undefined;
    return finish(`/login?google=${noticeForApiCode(typeof raw === 'string' ? raw : undefined)}`);
  }

  const next = saved.next ?? '/dashboard';
  const target = session.user.phone
    ? next
    : `/dashboard/profile?phone=required${saved.next ? `&next=${encodeURIComponent(saved.next)}` : ''}`;
  const response = finish(target);
  response.cookies.set(SESSION_COOKIE, session.accessToken, sessionCookieOptions());
  safeRevalidate('/');
  return response;
}
