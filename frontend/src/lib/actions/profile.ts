'use server';

import { getTranslations } from 'next-intl/server';
import * as authApi from '../api/auth';
import { requireSessionToken } from '../session';
import { toErrorState, type FormState } from './errors';
import { readFlag, readString, safeRevalidate } from './validation';

/** DONOR: add or change the phone (needed before donating) and the WhatsApp consent. */
export async function updatePhoneAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations('profile');
  const phone = readString(formData, 'phone', 40);
  if (!phone) return { error: t('required') };
  const token = await requireSessionToken();
  try {
    // The API normalises (0944…, ٠٩٤٤…, 00963…) and validates the number, as on registration.
    await authApi.updateMyPhone(token, {
      phone,
      whatsappOptIn: readFlag(formData, 'whatsappOptIn'),
    });
  } catch (err) {
    return toErrorState(err);
  }
  safeRevalidate('/dashboard/profile');
  safeRevalidate('/');
  return { ok: true, message: t('saved') };
}
