'use server';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import * as authApi from '../api/auth';
import { ApiError } from '../api/client';
import { safeNextPath } from '../next-path';
import { clearSessionToken, setSessionToken } from '../session';
import { readString, safeRevalidate } from './validation';

export interface FormState {
  error?: string;
}

export async function loginAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations('auth');
  const phone = readString(formData, 'phone', 40);
  // Passwords are not trimmed; bcrypt only reads the first 72 bytes (the API caps it too).
  const rawPassword = formData.get('password');
  const password = typeof rawPassword === 'string' ? rawPassword.slice(0, 72) : '';

  if (!phone || !password) {
    return { error: t('required') };
  }

  try {
    const { accessToken } = await authApi.login(phone, password);
    await setSessionToken(accessToken);
  } catch (err) {
    // Too many attempts (the API's login rate limit): say so, never "wrong password".
    if (err instanceof ApiError && err.statusCode === 429) {
      return { error: t('tooMany') };
    }
    // 401 invalid_credentials and 400 invalid_phone get the same message on purpose.
    if (err instanceof ApiError && err.statusCode < 500) {
      return { error: t('invalid') };
    }
    return { error: t('unavailable') };
  }

  safeRevalidate('/');
  // Back to where the donor started (e.g. the donate page); only known in-app paths are accepted.
  const next = formData.get('next');
  redirect((typeof next === 'string' && safeNextPath(next)) || '/dashboard');
}

export async function registerAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations('auth');
  const fullName = readString(formData, 'fullName', 120);
  const phone = readString(formData, 'phone', 40);
  const rawPassword = formData.get('password');
  const password = typeof rawPassword === 'string' ? rawPassword.slice(0, 72) : '';
  const localeValue = formData.get('locale');
  const locale = localeValue === 'en' ? 'en' : 'ar';

  if (fullName.length < 3 || !phone || password.length < 8) {
    return { error: t('registerRequired') };
  }

  try {
    const { accessToken } = await authApi.register({ fullName, phone, password, locale });
    await setSessionToken(accessToken);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 409) return { error: t('phoneTaken') };
    if (err instanceof ApiError && err.statusCode < 500) return { error: t('registerInvalid') };
    return { error: t('unavailable') };
  }

  safeRevalidate('/');
  redirect('/dashboard');
}

export async function logoutAction() {
  // Stateless JWT (no refresh token): logging out is deleting the cookie.
  await clearSessionToken();
  safeRevalidate('/');
  redirect('/login');
}
