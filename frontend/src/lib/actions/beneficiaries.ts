'use server';

import { getTranslations } from 'next-intl/server';
import { BENEFICIARY_KINDS } from '@/shared';
import * as beneficiariesApi from '../api/admin-beneficiaries';
import { requireSessionToken } from '../session';
import { toErrorState, type FormState } from './errors';
import { assertUuid, readOptional, readString, safeRevalidate } from './validation';

function readKind(formData: FormData): string | undefined {
  const value = readString(formData, 'kind', 20);
  return (BENEFICIARY_KINDS as readonly string[]).includes(value) ? value : undefined;
}

function revalidateRegistry(formData?: FormData) {
  safeRevalidate('/dashboard/admin/beneficiaries');
  safeRevalidate('/dashboard/admin/campaigns/new');
  safeRevalidate('/dashboard/admin/campaigns');
  const slug = formData ? readString(formData, 'slug', 60) : '';
  if (slug) safeRevalidate(`/campaigns/${slug}`);
}

/** ADMIN/STAFF register an anonymised beneficiary; the API allocates the public B-XXXX code. */
export async function createBeneficiaryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminCampaigns');
  const token = await requireSessionToken();
  try {
    const b = await beneficiariesApi.createBeneficiary(token, {
      kind: readString(formData, 'kind', 20),
      fullName: readString(formData, 'fullName', 120),
      area: readOptional(formData, 'area', 60),
      phone: readOptional(formData, 'phone', 30),
    });
    revalidateRegistry();
    return { ok: true, message: t('beneficiaryCreated', { code: b.publicCode }) };
  } catch (err) {
    return toErrorState(err);
  }
}

/** ADMIN corrects a beneficiary record (an empty area clears it); the public code never changes. */
export async function updateBeneficiaryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const token = await requireSessionToken();
  try {
    await beneficiariesApi.updateBeneficiary(token, id, {
      kind: readKind(formData),
      fullName: readOptional(formData, 'fullName', 120),
      area: readString(formData, 'area', 60),
      phone: readOptional(formData, 'phone', 30),
    });
  } catch (err) {
    return toErrorState(err);
  }
  revalidateRegistry();
  return { ok: true, message: t('saved') };
}

/** ADMIN links a beneficiary to a campaign (monthly amount only for sponsorship categories). */
export async function linkBeneficiaryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const beneficiaryId = formData.get('beneficiaryId');
  const campaignId = formData.get('campaignId');
  assertUuid(beneficiaryId, 'beneficiaryId');
  if (typeof campaignId !== 'string' || campaignId === '') {
    return { error: t('beneficiaries.pickCampaign') };
  }
  assertUuid(campaignId, 'campaignId');
  const token = await requireSessionToken();
  try {
    const link = await beneficiariesApi.linkBeneficiary(token, campaignId, {
      beneficiaryId,
      monthlyAmount: readOptional(formData, 'monthlyAmount', 20),
    });
    revalidateRegistry();
    return { ok: true, message: t('beneficiaries.linked', { code: link.code }) };
  } catch (err) {
    return toErrorState(err);
  }
}

/** ADMIN changes a link's monthly amount. */
export async function updateLinkAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const beneficiaryId = formData.get('beneficiaryId');
  const campaignId = formData.get('campaignId');
  assertUuid(beneficiaryId, 'beneficiaryId');
  assertUuid(campaignId, 'campaignId');
  const token = await requireSessionToken();
  try {
    await beneficiariesApi.updateBeneficiaryLink(token, campaignId, beneficiaryId, {
      monthlyAmount: readString(formData, 'monthlyAmount', 20),
    });
  } catch (err) {
    return toErrorState(err);
  }
  revalidateRegistry(formData);
  return { ok: true, message: t('saved') };
}

/** ADMIN ends a link: the code leaves the public campaign page; paid history stays. */
export async function endLinkAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const beneficiaryId = formData.get('beneficiaryId');
  const campaignId = formData.get('campaignId');
  assertUuid(beneficiaryId, 'beneficiaryId');
  assertUuid(campaignId, 'campaignId');
  const token = await requireSessionToken();
  try {
    await beneficiariesApi.updateBeneficiaryLink(token, campaignId, beneficiaryId, { end: true });
  } catch (err) {
    return toErrorState(err);
  }
  revalidateRegistry(formData);
  return { ok: true, message: t('beneficiaries.ended') };
}

/** ADMIN suspends (or reactivates) a beneficiary with a reason; intake then refuses silently. */
export async function beneficiarySuspensionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const suspend = readString(formData, 'suspend') === 'true';
  const token = await requireSessionToken();
  try {
    await beneficiariesApi.setBeneficiarySuspension(
      token,
      id,
      suspend,
      readString(formData, 'reason', 1000),
    );
  } catch (err) {
    return toErrorState(err);
  }
  revalidateRegistry();
  return {
    ok: true,
    message: suspend ? t('beneficiaries.hold.suspended') : t('beneficiaries.hold.reactivated'),
  };
}

/** ADMIN writes a note or a violation into the beneficiary's internal log. */
export async function addBeneficiaryNoteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const kind = readString(formData, 'kind', 20) === 'VIOLATION' ? 'VIOLATION' : 'NOTE';
  const token = await requireSessionToken();
  try {
    await beneficiariesApi.addBeneficiaryNote(token, id, {
      kind,
      body: readString(formData, 'body', 1000),
    });
  } catch (err) {
    return toErrorState(err);
  }
  revalidateRegistry();
  return { ok: true, message: t('beneficiaries.log.added') };
}
