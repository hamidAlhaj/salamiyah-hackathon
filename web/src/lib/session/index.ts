import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionCookieSecure } from './cookie-secure';

// The Nest JWT lives only in this HttpOnly cookie. It never reaches browser JavaScript.
const SESSION_COOKIE = 'session';

// Matches the API token lifetime (JWT_EXPIRES_IN = 8h).
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function setSessionToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // SESSION_COOKIE_SECURE overrides the production default ("false" for the plain-HTTP LAN demo).
    secure: sessionCookieSecure(process.env.SESSION_COOKIE_SECURE, process.env.NODE_ENV),
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  });
}

export async function clearSessionToken(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function requireSessionToken(): Promise<string> {
  const token = await getSessionToken();
  if (!token) {
    redirect('/login');
  }
  return token;
}
