'use server';

import type { ImportPreview, ImportValidation } from '@/lib/types/staff';
import * as importsApi from '../api/imports';
import { requireSessionToken } from '../session';
import { toErrorState } from './errors';
import { assertUuid } from './validation';

export type ImportResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

const FIELDS = ['fullName', 'phone', 'nationalId', 'localCouncil', 'otherPrograms'] as const;

/** Step 1: upload the file → headers, sample rows and a suggested column mapping. */
export async function previewImportAction(
  formData: FormData,
): Promise<ImportResult<ImportPreview>> {
  const file = formData.get('file');
  const payload = new FormData();
  if (file instanceof File && file.size > 0) payload.append('file', file, file.name);
  const token = await requireSessionToken();
  try {
    return { data: await importsApi.previewImport(token, payload) };
  } catch (err) {
    return { error: (await toErrorState(err)).error ?? '' };
  }
}

/** Step 2: dry run with the chosen mapping (valid / errors / duplicates). */
export async function validateImportAction(
  jobId: string,
  mapping: Record<string, string>,
): Promise<ImportResult<ImportValidation>> {
  assertUuid(jobId, 'jobId');
  const clean: Record<string, string> = {};
  for (const field of FIELDS) {
    const column = mapping[field];
    if (typeof column === 'string' && column.trim() !== '') clean[field] = column.slice(0, 200);
  }
  const token = await requireSessionToken();
  try {
    return { data: await importsApi.validateImport(token, jobId, clean) };
  } catch (err) {
    return { error: (await toErrorState(err)).error ?? '' };
  }
}

/** Step 3: save the valid rows in one transaction (duplicates are skipped). */
export async function commitImportAction(
  jobId: string,
): Promise<ImportResult<{ created: number; skipped: number }>> {
  assertUuid(jobId, 'jobId');
  const token = await requireSessionToken();
  try {
    const { created, skipped } = await importsApi.commitImport(token, jobId);
    return { data: { created, skipped } };
  } catch (err) {
    return { error: (await toErrorState(err)).error ?? '' };
  }
}
