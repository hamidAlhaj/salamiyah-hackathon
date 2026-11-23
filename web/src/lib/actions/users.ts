'use server';

import { getTranslations } from 'next-intl/server';
import { ROLES, type Role } from '@/shared';
import * as usersApi from '../api/admin-users';
import { requireSessionToken } from '../session';
import { toErrorState, type FormState } from './errors';
import { assertUuid, readString, readUuids, safeRevalidate } from './validation';

function readRole(formData: FormData): Role | undefined {
  const value = readString(formData, 'role', 20);
  return (ROLES as readonly string[]).includes(value) ? (value as Role) : undefined;
}

function revalidateUsers() {
  safeRevalidate('/dashboard/admin/users');
  safeRevalidate('/dashboard/admin/collection-points');
}

/** ADMIN creates an account; a collector gets their collection points at once. */
export async function createUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const role = readRole(formData) ?? 'STAFF';
  const fullName = readString(formData, 'fullName', 120);
  const token = await requireSessionToken();
  try {
    await usersApi.createUser(token, {
      fullName,
      phone: readString(formData, 'phone', 30),
      password: readString(formData, 'password', 200),
      role,
      collectionPointIds:
        role === 'COLLECTOR' ? readUuids(formData, 'collectionPointIds') : undefined,
    });
  } catch (err) {
    return toErrorState(err);
  }
  revalidateUsers();
  return { ok: true, message: t('users.created', { name: fullName }) };
}

/**
 * ADMIN edits name, role and (collectors) the assigned points. Points are only sent for a collector;
 * the API clears them when a collector moves to another role.
 */
export async function updateUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const role = readRole(formData);
  const token = await requireSessionToken();
  try {
    await usersApi.updateUser(token, id, {
      fullName: readString(formData, 'fullName', 120) || undefined,
      role,
      collectionPointIds:
        role === 'COLLECTOR' ? readUuids(formData, 'collectionPointIds') : undefined,
    });
  } catch (err) {
    return toErrorState(err);
  }
  revalidateUsers();
  return { ok: true, message: t('users.updated') };
}

/** ADMIN activates or deactivates an account (a deactivated account cannot sign in). */
export async function setUserActiveAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = await getTranslations('adminSetup');
  const id = formData.get('id');
  assertUuid(id, 'id');
  const isActive = readString(formData, 'isActive') === 'true';
  const token = await requireSessionToken();
  try {
    await usersApi.updateUser(token, id, { isActive });
  } catch (err) {
    return toErrorState(err);
  }
  revalidateUsers();
  return { ok: true, message: isActive ? t('users.activated') : t('users.deactivated') };
}
