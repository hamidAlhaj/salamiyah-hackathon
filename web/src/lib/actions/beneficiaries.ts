'use server';

import { getTranslations } from 'next-intl/server';
import * as beneficiariesApi from '../api/admin-beneficiaries';
import { requireSessionToken } from '../session';
import { toErrorState, type FormState } from './errors';
import { readOptional, readString, safeRevalidate } from './validation';

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
    safeRevalidate('/dashboard/admin/campaigns/new');
    return { ok: true, message: t('beneficiaryCreated', { code: b.publicCode }) };
  } catch (err) {
    return toErrorState(err);
  }
}
