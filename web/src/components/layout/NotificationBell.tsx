'use client';

import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/lib/actions/notifications';
import { DATE_TIME_SHORT } from '@/lib/format';
import type { NotificationView } from '@/shared';

/** One small glyph per notification type (stroke icons, 24px grid). */
const GLYPHS: Record<string, React.ReactNode> = {
  'pledge.demo_confirmed': (
    <path d="M12 3l2.2 5.3L20 9l-4.4 3.9L17 19l-5-3-5 3 1.4-6.1L4 9l5.8-.7z" />
  ),
  'pledge.created': <path d="M7 4h7l4 4v12H7zM14 4v4h4M10 13h5M10 16h5" />,
  'pledge.receipt_uploaded': <path d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />,
  'pledge.cash_pledged': <path d="M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />,
  'pledge.verified': <path d="M5 13l4 4L19 7" />,
  'pledge.rejected': <path d="M12 8v5M12 16.5v.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />,
};
const FALLBACK = <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />;

export function NotificationGlyph({
  type,
  className = 'h-5 w-5',
}: {
  type: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {GLYPHS[type] ?? FALLBACK}
    </svg>
  );
}

/**
 * The header bell (b4f NotificationBell pattern): server-fetched count and latest items, synced from
 * props whenever the layout re-renders (a navigation, or router.refresh() after a donation). Marking
 * read updates local state at once and persists through a Server Action.
 */
export function NotificationBell({
  initialUnread,
  initialItems,
}: {
  initialUnread: number;
  initialItems: NotificationView[];
}) {
  const t = useTranslations('notifications');
  const format = useFormatter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState(initialItems);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUnread(initialUnread);
    setItems(initialItems);
  }, [initialUnread, initialItems]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function readOne(n: NotificationView) {
    setOpen(false);
    if (n.readAt) return;
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)),
    );
    setUnread((c) => Math.max(0, c - 1));
    void markNotificationReadAction(n.id);
  }

  function readAll() {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((x) => (x.readAt ? x : { ...x, readAt: now })));
    setUnread(0);
    void markAllNotificationsReadAction();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? t('bellUnread', { count: unread }) : t('bell')}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-testid="notification-bell"
      >
        <NotificationGlyph type="bell" />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 end-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-700 px-1 text-[0.75rem] font-bold leading-none text-white ring-2 ring-surface dark:bg-brand-500"
            data-testid="notification-unread"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute end-0 z-40 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-lift"
          data-testid="notification-menu"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <p className="font-display font-bold">{t('title')}</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={readAll}
                className="text-xs font-semibold text-accent hover:underline"
              >
                {t('markAll')}
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">{t('empty')}</p>
          ) : (
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {items.slice(0, 8).map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link ?? '/dashboard/notifications'}
                    onClick={() => readOne(n)}
                    className={`flex gap-3 px-4 py-3 transition hover:bg-surface-muted ${n.readAt ? '' : 'bg-accent-soft/60'}`}
                    data-unread={n.readAt ? undefined : 'true'}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-accent">
                      <NotificationGlyph type={n.type} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold">{n.title}</span>
                        {!n.readAt && (
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600"
                            aria-label={t('unread')}
                          />
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted">
                        {n.body}
                      </span>
                      <time
                        className="mt-1 block text-[0.8125rem] text-muted"
                        dateTime={n.createdAt}
                      >
                        {format.dateTime(new Date(n.createdAt), DATE_TIME_SHORT)}
                      </time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-3 text-center text-sm font-semibold text-accent hover:bg-surface-muted"
          >
            {t('seeAll')}
          </Link>
        </div>
      )}
    </div>
  );
}
