import 'server-only';
import type { ImportPreview, ImportValidation } from '@/lib/types/staff';
import { apiFetch } from './client';

export function previewImport(token: string, form: FormData) {
  return apiFetch<ImportPreview>('/imports/preview', { method: 'POST', token, form });
}

export function validateImport(token: string, jobId: string, mapping: Record<string, string>) {
  return apiFetch<ImportValidation>(`/imports/${jobId}/validate`, {
    method: 'POST',
    token,
    body: mapping,
  });
}

export function commitImport(token: string, jobId: string) {
  return apiFetch<{ jobId: string; created: number; skipped: number }>(`/imports/${jobId}/commit`, {
    method: 'POST',
    token,
  });
}
