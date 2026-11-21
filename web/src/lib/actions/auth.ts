'use server';

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import * as authApi from '../api/auth';
import { ApiError } from '../api/client';
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
    // 401 invalid_credentials and 400 invalid_phone get the same message on purpose.
    if (err instanceof ApiError && err.statusCode < 500) {
      return { error: t('invalid') };
    }
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
