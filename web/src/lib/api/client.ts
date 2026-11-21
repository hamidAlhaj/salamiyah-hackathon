import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { clearSessionToken } from '../session';

// The only place the web app talks to the Nest API. Server-side only (no NEXT_PUBLIC_ URL).
const NEST_API_URL = process.env.NEST_API_URL ?? 'http://localhost:4000';

/** The API's uniform error body (AllExceptionsFilter). `message` carries stable codes. */
export interface ApiErrorShape {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: ApiErrorShape,
  ) {
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
  query?: Record<string, string | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(path, NEST_API_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', token, body, query } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : undefined;

  if (!response.ok) {
    // An expired or revoked token: drop the cookie and send the user to log in again.
    if (response.status === 401 && token) {
      try {
        await clearSessionToken();
      } catch {
        // Cookies are read-only while a Server Component renders; the redirect still applies.
      }
      redirect('/login');
    }
    throw new ApiError(response.status, payload as ApiErrorShape);
  }

  return payload as T;
}

export async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) {
      notFound();
    }
    throw err;
  }
}
