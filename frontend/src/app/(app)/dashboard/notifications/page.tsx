import type { Metadata } from 'next';
import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { NotificationGlyph } from '@/components/layout/NotificationBell';
import { WorkspacePage } from '@/components/layout/WorkspacePage';
import { listNotifications } from '@/lib/api/notifications';
import { requireUser } from '@/lib/auth';
import { DATE_TIME_SHORT } from '@/lib/format';
import { MarkAllRead } from './MarkAllRead';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notifications');
  return { title: t('title') };
}

/** Every notification of the signed-in user (the bell's "see all"). */
export default async function NotificationsPage() {
  const { token } = await requireUser();
  const [items, t, format] = await Promise.all([
    listNotifications(token),
    getTranslations('notifications'),
    getFormatter(),
  ]);
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <WorkspacePage
      title={t('title')}
      intro={t('intro')}
      actions={unread > 0 ? <MarkAllRead label={t('markAll')} /> : undefined}
      testId="notifications-page"
    >
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-muted">
          {t('empty')}
        </p>
      ) : (
        <ol className="space-y-3" data-testid="notification-list">
          {items.map((n) => (
            <li
              key={n.id}
              className={`flex gap-4 rounded-2xl border p-4 shadow-card sm:p-5 ${
                n.readAt
                  ? 'border-border bg-surface'
                  : 'border-brand-200 bg-accent-soft/50 dark:border-brand-800'
              }`}
              data-type={n.type}
              data-unread={n.readAt ? undefined : 'true'}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-accent shadow-card">
                <NotificationGlyph type={n.type} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="font-semibold">{n.title}</h2>
                  <time className="text-xs text-muted" dateTime={n.createdAt}>
                    {format.dateTime(new Date(n.createdAt), DATE_TIME_SHORT)}
                  </time>
                </div>
                <p className="mt-1 max-w-[70ch] text-sm leading-relaxed text-muted">{n.body}</p>
                {n.link && (
                  <Link
                    href={n.link}
                    className="mt-2 inline-block text-sm font-semibold text-accent hover:underline"
                  >
                    {t('open')}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </WorkspacePage>
  );
}
