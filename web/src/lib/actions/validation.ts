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

/** An optional trimmed field: undefined when empty (so the API applies its default). */
export function readOptional(
  formData: FormData,
  field: string,
  maxLength = 5000,
): string | undefined {
  const value = readString(formData, field, maxLength);
  return value === '' ? undefined : value;
}

/** Every valid UUID among a repeated form field (e.g. checkboxes), de-duplicated. */
export function readUuids(formData: FormData, field: string): string[] {
  return [...new Set(formData.getAll(field).filter(isUuid))];
}

/** A checkbox / hidden "true" field. */
export function readFlag(formData: FormData, field: string): boolean {
  const value = formData.get(field);
  return value === 'true' || value === 'on';
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

// Only these paths may be revalidated; add new routes here.
const REVALIDATE_PATH_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/dashboard$/,
  /^\/dashboard\/admin\/categories$/,
  /^\/dashboard\/admin\/campaigns$/,
  /^\/dashboard\/admin\/campaigns\/new$/,
  new RegExp(`^/dashboard/admin/campaigns/${UUID}$`),
  /^\/dashboard\/admin\/users$/,
  /^\/dashboard\/admin\/collection-points$/,
  /^\/dashboard\/admin\/hospitals$/,
  /^\/dashboard\/admin\/payment-methods$/,
  /^\/dashboard\/admin\/beneficiaries$/,
  /^\/dashboard\/cases$/,
  new RegExp(`^/dashboard/cases/${UUID}$`),
  /^\/dashboard\/finance$/,
  /^\/dashboard\/donations$/,
  /^\/dashboard\/notifications$/,
  /^\/dashboard\/outbox$/,
  /^\/dashboard\/collector$/,
  /^\/dashboard\/spending$/,
  new RegExp(`^/dashboard/spending/${UUID}$`),
  /^\/campaigns\/[a-z0-9_-]{3,60}$/,
  /^\/campaigns\/[a-z0-9_-]{3,60}\/donate$/,
];

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
