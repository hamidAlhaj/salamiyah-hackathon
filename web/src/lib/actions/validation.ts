import 'server-only';
import { revalidatePath } from 'next/cache';

// Transport-shape checks for Server Actions. They never decide authorization: the API does.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function assertUuid(value: unknown, field: string): asserts value is string {
  if (!isUuid(value)) {
    throw new Error(`Invalid ${field}: expected a UUID`);
  }
}

/** A trimmed string field from a form, capped in length ('' when missing). */
export function readString(formData: FormData, field: string, maxLength = 5000): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

// Only these paths may be revalidated; P05+ adds its routes here.
const REVALIDATE_PATH_PATTERNS: RegExp[] = [/^\/$/, /^\/dashboard$/];

export function isKnownRoutePath(path: string): boolean {
  return REVALIDATE_PATH_PATTERNS.some((re) => re.test(path));
}

export function safeRevalidate(path: string): void {
  if (!isKnownRoutePath(path)) {
    console.warn(`safeRevalidate: refusing unrecognized path ${JSON.stringify(path)}`);
    return;
  }
  revalidatePath(path);
}
