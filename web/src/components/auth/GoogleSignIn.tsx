import { useTranslations } from 'next-intl';
import { GoogleMark } from './GoogleMark';

/**
 * "Continue with Google" under the phone + password form (which stays the main way in). A plain
 * link to the web route that starts the OAuth handshake, so it also works without JavaScript.
 */
export function GoogleSignIn({ next }: { next?: string }) {
  const t = useTranslations('auth.google');
  const href = next ? `/auth/google/start?next=${encodeURIComponent(next)}` : '/auth/google/start';
  return (
    <div className="mt-6" data-testid="google-signin">
      <div className="flex items-center gap-3 text-sm text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        {t('or')}
        <span className="h-px flex-1 bg-border" />
      </div>
      <a
        href={href}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-control bg-surface px-6 py-3 text-base font-medium text-ink shadow-card transition duration-150 ease-out hover:border-brand-600 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-[0.98]"
        data-testid="google-signin-button"
      >
        <GoogleMark className="h-5 w-5 flex-shrink-0" />
        {t('button')}
      </a>
      <p className="mt-3 text-center text-xs text-muted">{t('hint')}</p>
    </div>
  );
}

/** The outcome of a Google attempt that came back to the login page (?google=…). */
export function GoogleNotice({ notice }: { notice: string }) {
  const t = useTranslations('auth.google.notice');
  return (
    <p
      role="alert"
      data-testid="google-notice"
      className={`mt-6 rounded-xl border px-4 py-3 text-sm font-medium ${
        notice === 'cancelled'
          ? 'border-border bg-surface-muted text-ink'
          : 'border-warning-line bg-warning-soft text-warning'
      }`}
    >
      {t(notice)}
    </p>
  );
}
