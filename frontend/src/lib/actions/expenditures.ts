'use server';

import { getTranslations } from 'next-intl/server';
import { PAYEE_TYPES } from '@/shared';
import * as expendituresApi from '../api/expenditures';
import { requireSessionToken } from '../session';
import { toErrorState, type FormState } from './errors';
import { assertUuid, readOptional, readString, safeRevalidate } from './validation';

const SLUG_RE = /^[a-z0-9_-]{3,60}$/;

/** Spent and remaining move on the staff page, the campaign page, its card and the home totals. */
function refresh(campaignId: string, slug: unknown) {
  safeRevalidate(`/dashboard/spending/${campaignId}`);
  safeRevalidate('/dashboard/spending');
  if (typeof slug === 'string' && SLUG_RE.test(slug)) safeRevalidate(`/campaigns/${slug}`);
  safeRevalidate('/');
}

function proofFile(formData: FormData): File | null {
  const file = formData.get('proof');
  return file instanceof File && file.size > 0 ? file : null;
}

/** FINANCE_VERIFIER records spending with a proof; the API enforces the payee rules and balance. */
export async function createExpenditureAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('spending');
  const campaignId = formData.get('campaignId');
  assertUuid(campaignId, 'campaignId');
  const payeeType = readString(formData, 'payeeType', 30);
  if (!(PAYEE_TYPES as readonly string[]).includes(payeeType)) throw new Error('Invalid payeeType');
  const amount = readString(formData, 'amount', 14).replace(/[^\d.]/g, '');
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    return { error: t('amountInvalid') };
  }
  const proof = proofFile(formData);
  if (!proof) return { error: t('proofRequired') };

  const payload = new FormData();
  payload.append('campaignId', campaignId);
  payload.append('payeeType', payeeType);
  payload.append('amount', amount);
  payload.append('paidAt', readString(formData, 'paidAt', 10));
  payload.append('description', readString(formData, 'description', 1000));
  for (const key of ['payeeLabel', 'descriptionEn', 'beneficiaryId'] as const) {
    const value = readOptional(formData, key, key === 'descriptionEn' ? 1000 : 120);
    if (value) payload.append(key, value);
  }
  payload.append('proofPublic', formData.get('proofPublic') === 'on' ? 'true' : 'false');
  payload.append('proof', proof, proof.name);

  const token = await requireSessionToken();
  try {
    const res = await expendituresApi.createExpenditure(token, payload);
    refresh(campaignId, formData.get('slug'));
    return {
      ok: true,
      message: res.campaignStatus === 'COMPLETED' ? t('recordedCompleted') : t('recorded'),
    };
  } catch (err) {
    return toErrorState(err);
  }
}

/** «ادفع كفالة هذا الشهر»: one row per sponsored beneficiary, refused if the month is paid. */
export async function payMonthAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations('spending');
  const campaignId = formData.get('campaignId');
  assertUuid(campaignId, 'campaignId');
  const periodMonth = readString(formData, 'periodMonth', 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodMonth)) return { error: t('monthInvalid') };
  const payload = new FormData();
  payload.append('periodMonth', periodMonth);
  const paidAt = readOptional(formData, 'paidAt', 10);
  if (paidAt) payload.append('paidAt', paidAt);
  const proof = proofFile(formData);
  if (proof) {
    payload.append('proof', proof, proof.name);
    payload.append('proofPublic', formData.get('proofPublic') === 'on' ? 'true' : 'false');
  }
  const token = await requireSessionToken();
  try {
    const res = await expendituresApi.payMonth(token, campaignId, payload);
    refresh(campaignId, formData.get('slug'));
    return { ok: true, message: t('monthPaid', { count: res.count, month: periodMonth }) };
  } catch (err) {
    return toErrorState(err);
  }
}

/** ADMIN marks an ongoing programme «تم الإنجاز» (a medical case is closed with it). */
export async function markCompletedAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('spending');
  const campaignId = formData.get('campaignId');
  assertUuid(campaignId, 'campaignId');
  const token = await requireSessionToken();
  try {
    await expendituresApi.markCompleted(token, campaignId);
    refresh(campaignId, formData.get('slug'));
    return { ok: true, message: t('markedCompleted') };
  } catch (err) {
    return toErrorState(err);
  }
}
