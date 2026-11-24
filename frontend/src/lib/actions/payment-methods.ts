'use server';

import { getTranslations } from 'next-intl/server';
import { PAYMENT_METHODS } from '@/shared';
import { setCampaignAccount } from '../api/admin-campaigns';
import * as paymentsApi from '../api/admin-payment-methods';
import { requireSessionToken } from '../session';
import { toErrorState, type FormState } from './errors';
import { assertUuid, readOptional, readString, safeRevalidate } from './validation';

function readMethod(formData: FormData): string {
  const value = readString(formData, 'method', 30);
  if (!(PAYMENT_METHODS as readonly string[]).includes(value)) {
    throw new Error('Invalid method');
  }
  return value;
}

function readOrder(formData: FormData): number | undefined {
  const raw = readString(formData, 'sortOrder', 6);
  if (raw === '') return undefined;
  const n = Number(raw);
  return Number.isInteger(n) ? n : undefined;
}

/** The campaign pages that show this campaign's receiving accounts. */
function revalidateCampaign(formData: FormData) {
  safeRevalidate('/dashboard/admin/payment-methods');
  const slug = readString(formData, 'slug', 60);
  if (slug) {
    safeRevalidate(`/campaigns/${slug}`);
    safeRevalidate(`/campaigns/${slug}/donate`);
  }
}

/** ADMIN edits a method's default receiving details (empty fields clear; flags are fixed). */
export async function updatePaymentMethodAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const method = readMethod(formData);
  const token = await requireSessionToken();
  try {
    await paymentsApi.updatePaymentMethodConfig(token, method, {
      labelAr: readString(formData, 'labelAr', 60),
      labelEn: readString(formData, 'labelEn', 60),
      accountName: readString(formData, 'accountName', 120),
      accountNameEn: readString(formData, 'accountNameEn', 120),
      accountNumber: readString(formData, 'accountNumber', 60),
      instructionsAr: readString(formData, 'instructionsAr', 500),
      instructionsEn: readString(formData, 'instructionsEn', 500),
      sortOrder: readOrder(formData),
    });
  } catch (err) {
    return toErrorState(err);
  }
  safeRevalidate('/dashboard/admin/payment-methods');
  return { ok: true, message: t('saved') };
}

export async function setPaymentMethodActiveAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const method = readMethod(formData);
  const isActive = readString(formData, 'isActive') === 'true';
  const token = await requireSessionToken();
  try {
    await paymentsApi.updatePaymentMethodConfig(token, method, { isActive });
  } catch (err) {
    return toErrorState(err);
  }
  safeRevalidate('/dashboard/admin/payment-methods');
  return { ok: true, message: isActive ? t('activated') : t('deactivated') };
}

/** ADMIN gives one campaign its own (fake) account for a method; the donate page shows it. */
export async function setCampaignOverrideAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const campaignId = formData.get('campaignId');
  assertUuid(campaignId, 'campaignId');
  const method = readMethod(formData);
  const token = await requireSessionToken();
  try {
    await setCampaignAccount(token, campaignId, method, {
      accountName: readString(formData, 'accountName', 120),
      accountNumber: readString(formData, 'accountNumber', 60),
      note: readOptional(formData, 'note', 300),
    });
  } catch (err) {
    return toErrorState(err);
  }
  revalidateCampaign(formData);
  return { ok: true, message: t('payments.overrideSaved') };
}

/** ADMIN returns the campaign to the default account for a method. */
export async function removeCampaignOverrideAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const campaignId = formData.get('campaignId');
  assertUuid(campaignId, 'campaignId');
  const method = readMethod(formData);
  const token = await requireSessionToken();
  try {
    await paymentsApi.removeCampaignOverride(token, campaignId, method);
  } catch (err) {
    return toErrorState(err);
  }
  revalidateCampaign(formData);
  return { ok: true, message: t('payments.overrideRemoved') };
}
