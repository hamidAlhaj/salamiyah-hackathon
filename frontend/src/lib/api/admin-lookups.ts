import 'server-only';
import type { AdminCollectionPoint, AdminHospital } from '@/lib/types/staff';
import { apiFetch } from './client';

export interface HospitalInput {
  nameAr?: string;
  nameEn?: string;
  city?: string;
  isPrivate?: boolean;
  isActive?: boolean;
}

export interface CollectionPointInput {
  name?: string;
  type?: string;
  contactName?: string;
  area?: string;
  isActive?: boolean;
}

/** ADMIN: every hospital, inactive ones too, with usage counts. */
export function listAllHospitals(token: string) {
  return apiFetch<AdminHospital[]>('/hospitals/all', { token });
}

export function createHospital(token: string, input: HospitalInput) {
  return apiFetch<AdminHospital>('/hospitals', { method: 'POST', token, body: input });
}

export function updateHospital(token: string, id: string, input: HospitalInput) {
  return apiFetch<AdminHospital>(`/hospitals/${id}`, { method: 'PATCH', token, body: input });
}

/** Staff list of every collection point with its collectors (ADMIN, FINANCE_VERIFIER, STAFF). */
export function listCollectionPoints(token: string) {
  return apiFetch<AdminCollectionPoint[]>('/collection-points', { token });
}

export function createCollectionPoint(token: string, input: CollectionPointInput) {
  return apiFetch<AdminCollectionPoint>('/collection-points', {
    method: 'POST',
    token,
    body: input,
  });
}

export function updateCollectionPoint(token: string, id: string, input: CollectionPointInput) {
  return apiFetch<AdminCollectionPoint>(`/collection-points/${id}`, {
    method: 'PATCH',
    token,
    body: input,
  });
}
