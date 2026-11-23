'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { buttonClasses } from '@/components/ui/Button';
import { useAppSelector } from '@/store/hooks';

/** Chrome / Edge / Samsung Internet event (not in the DOM typings). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'majlis-install-dismissed';
const DISMISS_DAYS = 30;

function dismissedRecently(): boolean {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Donor install prompt: when the browser offers to install the site (secure origins only), guests and
 * donors see one small banner to add «مجلس فند» to the home screen. Staff never see it. Hidden for 30
 * days after "Not now"; nothing renders until the browser fires the event.
 */
export function InstallPrompt() {
  const t = useTranslations('install');
  const role = useAppSelector((state) => state.currentUser.user?.role);
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      if (!dismissedRecently()) setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!event || (role && role !== 'DONOR')) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Storage blocked: the banner simply comes back next visit.
    }
    setEvent(null);
  }

  async function install() {
    if (!event) return;
    await event.prompt();
    await event.userChoice.catch(() => null);
    setEvent(null);
  }

  return (
    <aside
      aria-label={t('title')}
      data-testid="install-prompt"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-lift print:hidden"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white dark:bg-brand-600">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M12 4v11M8 11l4 4 4-4M5 19h14" />
        </svg>
      </span>
      <p className="min-w-0 flex-1 text-sm">
        <span className="block font-semibold">{t('title')}</span>
        <span className="block text-muted">{t('body')}</span>
      </p>
      <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
        <button type="button" onClick={install} className={buttonClasses('primary', 'sm')}>
          {t('action')}
        </button>
        <button type="button" onClick={dismiss} className={buttonClasses('ghost', 'sm')}>
          {t('dismiss')}
        </button>
      </div>
    </aside>
  );
}
