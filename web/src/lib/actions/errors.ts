import 'server-only';
import { getTranslations } from 'next-intl/server';
import { ApiError } from '../api/client';

/** What every write Server Action returns to its form. */
export interface FormState {
  ok?: boolean;
  error?: string;
  message?: string;
}

/**
 * Maps an API error to a translated message. The API's `message` carries stable codes
 * (e.g. category_code_taken); unknown codes and validation arrays get a generic text.
 * Anything that is not an API or network error is re-thrown (e.g. Next's redirect).
 */
export async function toErrorState(err: unknown): Promise<FormState> {
  const t = await getTranslations('apiErrors');
  if (err instanceof ApiError) {
    const raw = err.body?.message;
    const codes = Array.isArray(raw) ? raw : [raw];
    const known = codes.find((c): c is string => typeof c === 'string' && t.has(c));
    if (known) return { error: t(known) };
    return { error: err.statusCode === 400 ? t('invalid') : t('generic') };
  }
  if (err instanceof TypeError) return { error: t('unavailable') };
  throw err;
}
