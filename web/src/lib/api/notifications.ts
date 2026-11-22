import 'server-only';
import type { NotificationView, OutboxItem, OutboxTemplate, Paginated } from '@/shared';
import { apiFetch } from './client';

export function listNotifications(token: string) {
  return apiFetch<NotificationView[]>('/notifications', { token });
}

export function unreadCount(token: string) {
  return apiFetch<{ unread: number }>('/notifications/unread-count', { token });
}

export function markRead(token: string, id: string) {
  return apiFetch<{ ok: true }>(`/notifications/${id}/read`, { method: 'POST', token });
}

export function markAllRead(token: string) {
  return apiFetch<{ ok: true }>('/notifications/read-all', { method: 'POST', token });
}

export interface OutboxQuery {
  template?: OutboxTemplate;
  status?: 'QUEUED' | 'OPENED';
  page?: number;
}

/** ADMIN: the WhatsApp outbox with each row's prefilled wa.me link. */
export function listOutbox(token: string, query: OutboxQuery) {
  return apiFetch<Paginated<OutboxItem> & { queued: number }>('/outbox', {
    token,
    query: {
      template: query.template,
      status: query.status,
      page: query.page ? String(query.page) : undefined,
    },
  });
}

export function nextOutbox(token: string, template?: OutboxTemplate) {
  return apiFetch<{ item: OutboxItem | null }>('/outbox/next', { token, query: { template } });
}

export function markOutboxOpened(token: string, id: string) {
  return apiFetch<OutboxItem>(`/outbox/${id}/opened`, { method: 'POST', token });
}
