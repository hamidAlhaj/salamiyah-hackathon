'use server';

import { getTranslations } from 'next-intl/server';
import * as beneficiariesApi from '../api/admin-beneficiaries';
import * as campaignsApi from '../api/admin-campaigns';
import { requireSessionToken } from '../session';
import { toErrorState, type FormState } from './errors';
import { assertUuid, isUuid, readOptional, readString, safeRevalidate } from './validation';

export interface CreateCampaignState extends FormState {
  slug?: string;
}

/**
 * ADMIN creates a campaign, then links the chosen anonymised beneficiaries (with a monthly amount when
 * given) and sets an optional per-campaign receiving account. The API enforces every rule (category
 * flags, roles); a failed link is reported without undoing the created campaign.
 */
export async function createCampaignAction(
  _prev: CreateCampaignState,
  formData: FormData,
): Promise<CreateCampaignState> {
  const t = await getTranslations('adminCampaigns');
  const categoryId = formData.get('categoryId');
  assertUuid(categoryId, 'categoryId');
  const titleAr = readString(formData, 'titleAr', 160);
  const beneficiaryIds = formData.getAll('beneficiaryIds').filter(isUuid);
  const token = await requireSessionToken();

  let created: { id: string; slug: string };
  try {
    created = await campaignsApi.createCampaign(token, {
      categoryId,
      titleAr,
      titleEn: readOptional(formData, 'titleEn', 160),
      summaryAr: readString(formData, 'summaryAr', 4000),
      summaryEn: readOptional(formData, 'summaryEn', 4000),
      targetAmount: readString(formData, 'targetAmount', 20),
      currency: readString(formData, 'currency', 3) || 'SYP',
      priority: readString(formData, 'priority', 20) || 'NORMAL',
      coverKey: readOptional(formData, 'coverKey', 30),
      area: readOptional(formData, 'area', 60),
      isOngoing: formData.get('isOngoing') === 'on',
      status: readString(formData, 'status') === 'DRAFT' ? 'DRAFT' : 'ACTIVE',
    });
  } catch (err) {
    return toErrorState(err);
  }

  const problems: string[] = [];
  for (const beneficiaryId of beneficiaryIds) {
    try {
      await beneficiariesApi.linkBeneficiary(token, created.id, {
        beneficiaryId,
        monthlyAmount: readOptional(formData, `monthly_${beneficiaryId}`, 20),
      });
    } catch (err) {
      problems.push((await toErrorState(err)).error ?? '');
    }
  }
  const method = readOptional(formData, 'accountMethod', 30);
  if (method) {
    try {
      await campaignsApi.setCampaignAccount(token, created.id, method, {
        accountName: readString(formData, 'accountName', 120),
        accountNumber: readString(formData, 'accountNumber', 60),
      });
    } catch (err) {
      problems.push((await toErrorState(err)).error ?? '');
    }
  }

  safeRevalidate('/dashboard/admin/campaigns');
  safeRevalidate('/');
  return problems.length
    ? { ok: true, slug: created.slug, error: t('createdPartial', { detail: problems.join(' ') }) }
    : { ok: true, slug: created.slug, message: t('created', { title: titleAr }) };
}
