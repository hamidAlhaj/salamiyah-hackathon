'use server';

import { getTranslations } from 'next-intl/server';
import { COLLECTION_POINT_TYPES } from '@/shared';
import * as lookupsApi from '../api/admin-lookups';
import { requireSessionToken } from '../session';
import { toErrorState, type FormState } from './errors';
import { assertUuid, readFlag, readOptional, readString, safeRevalidate } from './validation';

function readPointType(formData: FormData): string | undefined {
  const value = readString(formData, 'type', 20);
  return (COLLECTION_POINT_TYPES as readonly string[]).includes(value) ? value : undefined;
}

/** ADMIN adds an approved hospital (offered to case officers for new medical cases). */
export async function createHospitalAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const nameAr = readString(formData, 'nameAr', 120);
  const token = await requireSessionToken();
  try {
    await lookupsApi.createHospital(token, {
      nameAr,
      nameEn: readOptional(formData, 'nameEn', 120),
      city: readString(formData, 'city', 60),
      isPrivate: readFlag(formData, 'isPrivate'),
    });
  } catch (err) {
    return toErrorState(err);
  }
  safeRevalidate('/dashboard/admin/hospitals');
  return { ok: true, message: t('hospitals.created', { name: nameAr }) };
}

export async function updateHospitalAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const token = await requireSessionToken();
  try {
    await lookupsApi.updateHospital(token, id, {
      nameAr: readString(formData, 'nameAr', 120),
      nameEn: readOptional(formData, 'nameEn', 120),
      city: readString(formData, 'city', 60),
      isPrivate: readFlag(formData, 'isPrivate'),
    });
  } catch (err) {
    return toErrorState(err);
  }
  safeRevalidate('/dashboard/admin/hospitals');
  return { ok: true, message: t('saved') };
}

export async function setHospitalActiveAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const isActive = readString(formData, 'isActive') === 'true';
  const token = await requireSessionToken();
  try {
    await lookupsApi.updateHospital(token, id, { isActive });
  } catch (err) {
    return toErrorState(err);
  }
  safeRevalidate('/dashboard/admin/hospitals');
  return { ok: true, message: isActive ? t('activated') : t('deactivated') };
}

function revalidatePoints() {
  safeRevalidate('/dashboard/admin/collection-points');
  safeRevalidate('/dashboard/admin/users');
}

/** ADMIN adds a collection point where donors can hand over cash. */
export async function createCollectionPointAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const name = readString(formData, 'name', 120);
  const token = await requireSessionToken();
  try {
    await lookupsApi.createCollectionPoint(token, {
      name,
      type: readPointType(formData),
      contactName: readOptional(formData, 'contactName', 120),
      area: readString(formData, 'area', 60),
    });
  } catch (err) {
    return toErrorState(err);
  }
  revalidatePoints();
  return { ok: true, message: t('points.created', { name }) };
}

export async function updateCollectionPointAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const token = await requireSessionToken();
  try {
    await lookupsApi.updateCollectionPoint(token, id, {
      name: readString(formData, 'name', 120),
      type: readPointType(formData),
      // An empty contact name clears it.
      contactName: readString(formData, 'contactName', 120),
      area: readString(formData, 'area', 60),
    });
  } catch (err) {
    return toErrorState(err);
  }
  revalidatePoints();
  return { ok: true, message: t('saved') };
}

export async function setCollectionPointActiveAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const isActive = readString(formData, 'isActive') === 'true';
  const token = await requireSessionToken();
  try {
    await lookupsApi.updateCollectionPoint(token, id, { isActive });
  } catch (err) {
    return toErrorState(err);
  }
  revalidatePoints();
  return { ok: true, message: isActive ? t('activated') : t('deactivated') };
}
