'use server';

import type { CreatePledgeResult, PaymentMethod, PledgeView } from '@/shared';
import { DEMO_PAYMENT_METHODS, RECEIPT_PAYMENT_METHODS } from '@/shared';
import * as pledgesApi from '../api/pledges';
import { requireSessionToken } from '../session';
import { toErrorState } from './errors';
import { assertUuid, isUuid, readOptional, safeRevalidate } from './validation';

/** What the donate flow's actions return: the data, or a translated error. */
export type DonateResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

/** The fields every donation path shares (validated here for shape; the API decides the rest). */
export interface DonationInput {
  campaignId: string;
  campaignSlug: string;
  /** Whole currency units, digits only (e.g. "50000"). */
  amount: string;
  isAnonymousDisplay: boolean;
}

const AMOUNT_RE = /^[1-9][0-9]{0,11}$/;
const SLUG_RE = /^[a-z0-9_-]{3,60}$/;

function clean(input: DonationInput) {
  assertUuid(input.campaignId, 'campaignId');
  if (!SLUG_RE.test(input.campaignSlug)) throw new Error('Invalid campaignSlug');
  if (!AMOUNT_RE.test(input.amount)) throw new Error('Invalid amount');
  return {
    campaignId: input.campaignId,
    amount: input.amount,
    isAnonymousDisplay: input.isAnonymousDisplay === true,
  };
}

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

async function fail(err: unknown): Promise<{ error: string }> {
  return { error: (await toErrorState(err)).error ?? '' };
}

/** The campaign page and the donor's list show the new pledge (the bar also polls every 5 s). */
function refresh(slug: string) {
  safeRevalidate(`/campaigns/${slug}`);
  safeRevalidate('/dashboard/donations');
  safeRevalidate('/');
}

/**
 * Simulated e-payment (ShamCash, Syriatel Cash, MTN Cash, PayPal, Visa). The fake checkout data
 * (wallet phone, code, card fields) never leaves the browser: only method and amount are sent.
 */
export async function demoDonateAction(
  input: DonationInput & { method: PaymentMethod },
): Promise<DonateResult<PledgeView>> {
  const body = clean(input);
  if (!isOneOf(DEMO_PAYMENT_METHODS, input.method)) throw new Error('Invalid method');
  const token = await requireSessionToken();
  try {
    const data = await pledgesApi.createDemoPledge(token, { ...body, method: input.method });
    refresh(input.campaignSlug);
    return { data };
  } catch (err) {
    return fail(err);
  }
}

/** Transfer + receipt, part 1: the pledge, the campaign's receiving account and the reference. */
export async function transferPledgeAction(
  input: DonationInput & { method: PaymentMethod },
): Promise<DonateResult<CreatePledgeResult>> {
  const body = clean(input);
  if (!isOneOf(RECEIPT_PAYMENT_METHODS, input.method)) throw new Error('Invalid method');
  const token = await requireSessionToken();
  try {
    const data = await pledgesApi.createPledge(token, { ...body, method: input.method });
    safeRevalidate('/dashboard/donations');
    return { data };
  } catch (err) {
    return fail(err);
  }
}

/** Transfer + receipt, part 2: the receipt photo → pending verification (finance queue). */
export async function uploadReceiptAction(formData: FormData): Promise<DonateResult<PledgeView>> {
  const pledgeId = formData.get('pledgeId');
  assertUuid(pledgeId, 'pledgeId');
  const slug = formData.get('campaignSlug');
  // Two inputs share the name: the camera one (capture) and the gallery one; use whichever has a file.
  const file = formData.getAll('receipt').find((f): f is File => f instanceof File && f.size > 0);
  const payload = new FormData();
  if (file) payload.append('receipt', file, file.name);
  const transferRef = readOptional(formData, 'transferRef', 60);
  if (transferRef) payload.append('transferRef', transferRef);
  const token = await requireSessionToken();
  try {
    const data = await pledgesApi.uploadReceipt(token, pledgeId, payload);
    if (typeof slug === 'string' && SLUG_RE.test(slug)) refresh(slug);
    safeRevalidate('/dashboard/finance');
    return { data };
  } catch (err) {
    return fail(err);
  }
}

/** Cash at a collection point: the donor gets a reference to show the collector. */
export async function cashPledgeAction(
  input: DonationInput & { collectionPointId: string },
): Promise<DonateResult<PledgeView>> {
  const body = clean(input);
  if (!isUuid(input.collectionPointId)) throw new Error('Invalid collectionPointId');
  const token = await requireSessionToken();
  try {
    const data = await pledgesApi.createCashPledge(token, {
      ...body,
      collectionPointId: input.collectionPointId,
    });
    safeRevalidate('/dashboard/donations');
    return { data };
  } catch (err) {
    return fail(err);
  }
}
