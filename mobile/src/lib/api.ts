import { API_URL } from './config';
import { getItem, removeItem, setItem } from './storage';

const TOKEN_KEY = 'mf_access';

/** A failed API call: the HTTP status plus the stable error code from `message` (e.g. `phone_taken`). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

export const saveToken = (token: string) => setItem(TOKEN_KEY, token);
export const clearToken = () => removeItem(TOKEN_KEY);
export const getToken = () => getItem(TOKEN_KEY);

/** Set by the AuthProvider: on 401 the session is gone (expired 8h token or deactivated account). */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

interface Options {
  method?: 'GET' | 'POST';
  body?: unknown;
  form?: FormData;
  /** false for public endpoints: no Authorization header and no 401 handling. */
  auth?: boolean;
  query?: Record<string, string | undefined>;
}

/**
 * Calls the API with `Authorization: Bearer <token>` (one 8h access token, no refresh).
 * 401 on an authenticated call → the token is cleared and the app returns to the login screen.
 */
export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const useAuth = opts.auth !== false;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = useAuth ? await getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  const params = Object.entries(opts.query ?? {}).filter(
    (entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '',
  );
  const qs = params.length ? `?${new URLSearchParams(params).toString()}` : '';

  const res = await fetch(`${API_URL}${path}${qs}`, { method: opts.method ?? 'GET', headers, body });
  if (res.status === 401 && useAuth) {
    await clearToken();
    onUnauthorized?.();
  }
  if (!res.ok) {
    let code = `http_${res.status}`;
    try {
      const err = (await res.json()) as { message?: string | string[] };
      code = Array.isArray(err.message) ? (err.message[0] ?? code) : (err.message ?? code);
    } catch {
      // not JSON
    }
    throw new ApiError(res.status, code);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}
