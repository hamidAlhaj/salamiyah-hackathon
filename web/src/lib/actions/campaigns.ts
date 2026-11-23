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

function revalidateCampaign(id: string, slug: string) {
  safeRevalidate(`/dashboard/admin/campaigns/${id}`);
  safeRevalidate('/dashboard/admin/campaigns');
  safeRevalidate(`/campaigns/${slug}`);
  safeRevalidate(`/campaigns/${slug}/donate`);
  safeRevalidate('/');
}

/** ADMIN edits titles, anonymised summaries, cover, area and priority. Empty English texts clear. */
export async function updateCampaignAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminCampaigns');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const slug = readString(formData, 'slug', 60);
  const token = await requireSessionToken();
  try {
    await campaignsApi.updateCampaign(token, id, {
      titleAr: readString(formData, 'titleAr', 160),
      titleEn: readString(formData, 'titleEn', 160),
      summaryAr: readString(formData, 'summaryAr', 4000),
      summaryEn: readString(formData, 'summaryEn', 4000),
      coverKey: readOptional(formData, 'coverKey', 30),
      area: readString(formData, 'area', 60),
      priority: readOptional(formData, 'priority', 20),
    });
  } catch (err) {
    return toErrorState(err);
  }
  revalidateCampaign(id, slug);
  return { ok: true, message: t('manage.saved') };
}

/** Lifecycle buttons: each maps to one status / pledge change; the API enforces the rules. */
const LIFECYCLE = {
  publish: { status: 'ACTIVE' },
  pause: { acceptsPledges: false },
  resume: { acceptsPledges: true },
  complete: { status: 'COMPLETED' },
  close: { status: 'CLOSED' },
} as const;
type LifecycleOp = keyof typeof LIFECYCLE;

function isLifecycleOp(value: string): value is LifecycleOp {
  return Object.prototype.hasOwnProperty.call(LIFECYCLE, value);
}

export async function campaignLifecycleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminCampaigns');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const op = readString(formData, 'op', 20);
  if (!isLifecycleOp(op)) throw new Error('Invalid op');
  const slug = readString(formData, 'slug', 60);
  const token = await requireSessionToken();
  try {
    await campaignsApi.setCampaignLifecycle(token, id, LIFECYCLE[op]);
  } catch (err) {
    return toErrorState(err);
  }
  revalidateCampaign(id, slug);
  return { ok: true, message: t(`manage.done.${op}`) };
}

/** Posts a public update on the campaign page. */
export async function postCampaignUpdateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminCampaigns');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const slug = readString(formData, 'slug', 60);
  const token = await requireSessionToken();
  try {
    await campaignsApi.postCampaignUpdate(token, id, {
      bodyAr: readString(formData, 'bodyAr', 2000),
      bodyEn: readOptional(formData, 'bodyEn', 2000),
    });
  } catch (err) {
    return toErrorState(err);
  }
  revalidateCampaign(id, slug);
  return { ok: true, message: t('manage.updatePosted') };
}
