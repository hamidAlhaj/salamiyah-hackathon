'use server';

import { OUTBOX_TEMPLATES, type OutboxItem, type OutboxTemplate } from '@/shared';
import * as notificationsApi from '../api/notifications';
import { requireSessionToken } from '../session';
import { toErrorState } from './errors';
import { assertUuid, safeRevalidate } from './validation';

/** The bell marks a notification read locally first; this persists it. */
export async function markNotificationReadAction(id: string): Promise<void> {
  assertUuid(id, 'id');
  const token = await requireSessionToken();
  await notificationsApi.markRead(token, id);
  safeRevalidate('/dashboard/notifications');
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const token = await requireSessionToken();
  await notificationsApi.markAllRead(token);
  safeRevalidate('/dashboard/notifications');
}

export type OutboxResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

/** The wa.me link was opened for this row: QUEUED → OPENED. */
export async function markOutboxOpenedAction(id: string): Promise<OutboxResult<OutboxItem>> {
  assertUuid(id, 'id');
  const token = await requireSessionToken();
  try {
    const data = await notificationsApi.markOutboxOpened(token, id);
    safeRevalidate('/dashboard/outbox');
    return { data };
  } catch (err) {
    return { error: (await toErrorState(err)).error ?? '' };
  }
}

/** "Next" mode: the oldest queued message (optionally of one kind). */
export async function nextOutboxAction(
  template?: string,
): Promise<OutboxResult<OutboxItem | null>> {
  const kind = OUTBOX_TEMPLATES.includes(template as OutboxTemplate)
    ? (template as OutboxTemplate)
    : undefined;
  const token = await requireSessionToken();
  try {
    return { data: (await notificationsApi.nextOutbox(token, kind)).item };
  } catch (err) {
    return { error: (await toErrorState(err)).error ?? '' };
  }
}
