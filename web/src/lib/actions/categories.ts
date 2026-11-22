'use server';

import { getTranslations } from 'next-intl/server';
import * as categoriesApi from '../api/admin-categories';
import { requireSessionToken } from '../session';
import { toErrorState, type FormState } from './errors';
import { assertUuid, readOptional, readString, safeRevalidate } from './validation';

function readOrder(formData: FormData): number | undefined {
  const raw = readString(formData, 'sortOrder', 6);
  if (raw === '') return undefined;
  const n = Number(raw);
  return Number.isInteger(n) ? n : undefined;
}

function revalidateCategories() {
  safeRevalidate('/dashboard/admin/categories');
  safeRevalidate('/dashboard/admin/campaigns/new');
  safeRevalidate('/');
}

/** ADMIN adds a generic category (the API never sets behaviour flags on new categories). */
export async function createCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminCategories');
  const nameAr = readString(formData, 'nameAr', 60);
  const token = await requireSessionToken();
  try {
    await categoriesApi.createCategory(token, {
      code: readString(formData, 'code', 40).toUpperCase(),
      nameAr,
      nameEn: readString(formData, 'nameEn', 60),
      descriptionAr: readOptional(formData, 'descriptionAr', 500),
      descriptionEn: readOptional(formData, 'descriptionEn', 500),
      icon: readString(formData, 'icon', 30),
      sortOrder: readOrder(formData),
    });
  } catch (err) {
    return toErrorState(err);
  }
  revalidateCategories();
  return { ok: true, message: t('created', { name: nameAr }) };
}

/** ADMIN edits names, descriptions, icon and order (never the code or the flags). */
export async function updateCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminCategories');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const token = await requireSessionToken();
  try {
    await categoriesApi.updateCategory(token, id, {
      nameAr: readString(formData, 'nameAr', 60),
      nameEn: readString(formData, 'nameEn', 60),
      descriptionAr: readOptional(formData, 'descriptionAr', 500),
      descriptionEn: readOptional(formData, 'descriptionEn', 500),
      icon: readString(formData, 'icon', 30),
      sortOrder: readOrder(formData),
    });
  } catch (err) {
    return toErrorState(err);
  }
  revalidateCategories();
  return { ok: true, message: t('updated') };
}

/** ADMIN activates or deactivates a category (system categories too; nothing is deleted). */
export async function setCategoryActiveAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminCategories');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const isActive = readString(formData, 'isActive') === 'true';
  const token = await requireSessionToken();
  try {
    await categoriesApi.updateCategory(token, id, { isActive });
  } catch (err) {
    return toErrorState(err);
  }
  revalidateCategories();
  return { ok: true, message: isActive ? t('activated') : t('deactivated') };
}
