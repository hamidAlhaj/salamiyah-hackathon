import 'server-only';
import type { AdminUser } from '@/lib/types/staff';
import type { Role } from '@/shared';
import { apiFetch } from './client';

/** ADMIN: accounts (never a password hash), optionally one role. */
export function listUsers(token: string, role?: Role) {
  return apiFetch<AdminUser[]>('/users', { token, query: { role } });
}

export function createUser(
  token: string,
  input: {
    fullName: string;
    phone: string;
    password: string;
    role: string;
    collectionPointIds?: string[];
  },
) {
  return apiFetch<AdminUser>('/users', { method: 'POST', token, body: input });
}

export function updateUser(
  token: string,
  id: string,
  input: { fullName?: string; role?: string; isActive?: boolean; collectionPointIds?: string[] },
) {
  return apiFetch<AdminUser>(`/users/${id}`, { method: 'PATCH', token, body: input });
}
