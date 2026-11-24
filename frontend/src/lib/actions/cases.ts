'use server';

import { getTranslations } from 'next-intl/server';
import type { CreateCaseResult } from '@/lib/types/staff';
import * as casesApi from '../api/staff-cases';
import { requireSessionToken } from '../session';
import { toErrorState, type FormState } from './errors';
import { assertUuid, readOptional, readString, safeRevalidate } from './validation';

export interface IntakeState extends FormState {
  result?: CreateCaseResult;
}

const INTAKE_FIELDS = [
  'beneficiaryName',
  'beneficiaryPhone',
  'nationalId',
  'localCouncil',
  'category',
  'description',
  'requestedAmount',
] as const;

/** STAFF/ADMIN register a medical request with its report; returns the tracking no. and warnings. */
export async function submitCaseAction(
  _prev: IntakeState,
  formData: FormData,
): Promise<IntakeState> {
  const t = await getTranslations('intake');
  const payload = new FormData();
  for (const key of INTAKE_FIELDS) payload.append(key, readString(formData, key, 4000));
  const file = formData.get('medicalReport');
  if (file instanceof File && file.size > 0) payload.append('medicalReport', file, file.name);
  const token = await requireSessionToken();
  try {
    const result = await casesApi.createCase(token, payload);
    safeRevalidate('/dashboard/cases');
    return { ok: true, result, message: t('done', { no: result.trackingNo }) };
  } catch (err) {
    return toErrorState(err);
  }
}

/** CASE_OFFICER: approve (priority, route, hospital, doctor, amount), reject or ask for info. */
export async function reviewCaseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations('cases');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const decision = readString(formData, 'decision', 20);
  const body: Record<string, string> =
    decision === 'approve'
      ? {
          decision,
          priority: readString(formData, 'priority', 20),
          route: readString(formData, 'route', 30),
          hospitalId: readString(formData, 'hospitalId', 36),
          doctorName: readString(formData, 'doctorName', 120),
          approvedAmount: readString(formData, 'approvedAmount', 20),
        }
      : { decision, reason: readString(formData, 'reason', 1000) };
  const token = await requireSessionToken();
  try {
    await casesApi.reviewCase(token, id, body);
  } catch (err) {
    return toErrorState(err);
  }
  safeRevalidate(`/dashboard/cases/${id}`);
  safeRevalidate('/dashboard/cases');
  return { ok: true, message: t('reviewed') };
}

export interface PublishState extends FormState {
  slug?: string;
}

/** CASE_OFFICER publishes an approved case → a campaign in the requiresMedicalCase category. */
export async function publishCaseAction(
  _prev: PublishState,
  formData: FormData,
): Promise<PublishState> {
  const t = await getTranslations('cases');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const body: Record<string, string | boolean> = {
    titleAr: readString(formData, 'titleAr', 160),
    redactedSummary: readString(formData, 'redactedSummary', 2000),
    isAnonymous: formData.get('isAnonymous') === 'on',
  };
  for (const key of ['titleEn', 'summaryEn', 'coverKey', 'area'] as const) {
    const value = readOptional(formData, key, 2000);
    if (value) body[key] = value;
  }
  const token = await requireSessionToken();
  try {
    const { slug } = await casesApi.publishCase(token, id, body);
    safeRevalidate(`/dashboard/cases/${id}`);
    safeRevalidate('/dashboard/cases');
    safeRevalidate('/');
    return { ok: true, slug, message: `${t('publishedLink')} /campaigns/${slug}` };
  } catch (err) {
    return toErrorState(err);
  }
}

/** CASE_OFFICER/ADMIN change the hospital or raise the amount → back to review, pledges paused. */
export async function changeHospitalAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('cases');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const body: Record<string, string> = { reason: readString(formData, 'reason', 500) };
  const hospitalId = readOptional(formData, 'hospitalId', 36);
  const approvedAmount = readOptional(formData, 'approvedAmount', 20);
  if (hospitalId) body.hospitalId = hospitalId;
  if (approvedAmount) body.approvedAmount = approvedAmount;
  const token = await requireSessionToken();
  try {
    const result = await casesApi.changeHospitalOrAmount(token, id, body);
    safeRevalidate(`/dashboard/cases/${id}`);
    safeRevalidate('/dashboard/cases');
    safeRevalidate('/');
    return { ok: true, message: result.pledgesPaused ? t('pledgesPaused') : t('changeApplied') };
  } catch (err) {
    return toErrorState(err);
  }
}
