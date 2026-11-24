'use server';

import { getTranslations } from 'next-intl/server';
import type { CollectorPledge } from '@/shared';
import * as collectorApi from '../api/collector';
import { requireSessionToken } from '../session';
import { toErrorState, type FormState } from './errors';
import { assertUuid, readOptional, readString, safeRevalidate } from './validation';

export type CollectorResult<T> =
  { data: T; error?: undefined } | { data?: undefined; error: string };

const REFERENCE_RE = /^P-[A-Z0-9]{4,12}$/;

/** Every collector change also moves the campaign's "pending verification" segment. */
function refresh() {
  safeRevalidate('/dashboard/collector');
  safeRevalidate('/dashboard/finance');
  safeRevalidate('/');
}

/** «تأكيد الاستلام»: the cash is handed over to the council's books, pending finance matching. */
export async function confirmReceivedAction(
  pledgeId: string,
): Promise<CollectorResult<CollectorPledge>> {
  assertUuid(pledgeId, 'pledgeId');
  const token = await requireSessionToken();
  try {
    const data = await collectorApi.confirmReceived(token, pledgeId);
    refresh();
    return { data };
  } catch (err) {
    return { error: (await toErrorState(err)).error ?? '' };
  }
}

/** The reference the donor shows at the point (e.g. P-8T6NZ7). */
export async function findByReferenceAction(
  reference: string,
): Promise<CollectorResult<CollectorPledge>> {
  const t = await getTranslations('collector');
  const ref = reference.trim().toUpperCase().slice(0, 20);
  if (!REFERENCE_RE.test(ref)) return { error: t('referenceInvalid') };
  const token = await requireSessionToken();
  try {
    return { data: await collectorApi.findByReference(token, ref) };
  } catch (err) {
    const state = await toErrorState(err);
    return { error: state.error === undefined ? '' : t('referenceNotFound') };
  }
}

/** A box total or an anonymous cash amount for a campaign at one of my points. */
export async function recordCashAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations('collector');
  const campaignId = formData.get('campaignId');
  const collectionPointId = formData.get('collectionPointId');
  assertUuid(campaignId, 'campaignId');
  assertUuid(collectionPointId, 'collectionPointId');
  const amount = readString(formData, 'amount', 12).replace(/\D/g, '');
  if (!/^[1-9][0-9]{0,11}$/.test(amount)) return { error: t('amountInvalid') };
  const donorName = readOptional(formData, 'donorName', 120);
  const token = await requireSessionToken();
  try {
    await collectorApi.recordCash(token, { campaignId, collectionPointId, amount, donorName });
    refresh();
    return { ok: true, message: t('recorded') };
  } catch (err) {
    return toErrorState(err);
  }
}
