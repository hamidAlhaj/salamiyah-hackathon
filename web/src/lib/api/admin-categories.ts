import 'server-only';
import type { AdminCategory } from '@/lib/types/staff';
import { apiFetch } from './client';

export interface CategoryInput {
  code?: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
  /** Create only: the beneficiary kind its campaigns link (omitted = any kind). */
  beneficiaryKind?: string;
}

/** ADMIN: every category with flags (read-only) and campaign counts. */
export function listAllCategories(token: string) {
  return apiFetch<AdminCategory[]>('/categories/all', { token });
}

export function createCategory(token: string, input: CategoryInput) {
  return apiFetch<AdminCategory>('/categories', { method: 'POST', token, body: input });
}

export function updateCategory(token: string, id: string, input: CategoryInput) {
  return apiFetch<AdminCategory>(`/categories/${id}`, { method: 'PATCH', token, body: input });
}
