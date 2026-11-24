'use server';

import { getTranslations } from 'next-intl/server';
import * as verificationsApi from '../api/verifications';
import { requireSessionToken } from '../session';
import { toErrorState, type FormState } from './errors';
import { assertUuid, readString, safeRevalidate } from './validation';

/** FINANCE_VERIFIER approves: VERIFIED + campaign balance + official receipt number. */
export async function approveVerificationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('finance');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const token = await requireSessionToken();
  try {
    const { officialReceiptNo } = await verificationsApi.approveVerification(token, id);
    safeRevalidate('/dashboard/finance');
    safeRevalidate('/');
    safeRevalidate('/dashboard/donations');
    return {
      ok: true,
      message: officialReceiptNo
        ? t('approved', { no: officialReceiptNo })
        : t('approvedNoReceipt'),
    };
  } catch (err) {
    return toErrorState(err);
  }
}

/** FINANCE_VERIFIER rejects with a reason the donor will see. */
export async function rejectVerificationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('finance');
  const id = formData.get('id');
  assertUuid(id, 'id');
  // The donor reads this reason: it is required (the API also asks for 5–500 characters).
  const reason = readString(formData, 'reason', 500);
  if (reason.length < 5) return { error: t('reasonRequired') };
  const token = await requireSessionToken();
  try {
    await verificationsApi.rejectVerification(token, id, reason);
    safeRevalidate('/dashboard/finance');
    return { ok: true, message: t('rejected') };
  } catch (err) {
    return toErrorState(err);
  }
}
