import 'server-only';
import { listNotifications, unreadCount } from '@/lib/api/notifications';
import { getSessionToken } from '@/lib/session';
import { NotificationBell } from './NotificationBell';

/**
 * Server half of the bell: the signed-in user's unread count and latest notifications, fetched on
 * every render of the layout. Guests, or any API failure, simply get no bell.
 */
export async function HeaderBell() {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const [{ unread }, items] = await Promise.all([unreadCount(token), listNotifications(token)]);
    return <NotificationBell initialUnread={unread} initialItems={items.slice(0, 8)} />;
  } catch {
    return null;
  }
}
