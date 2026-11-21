'use client';

import { useTranslations } from 'next-intl';
import type { ToastKind } from '@/context/ToastContext';
import { useToastInternal } from '@/context/ToastContext';

const KIND_CLASS: Record<ToastKind, string> = {
  success: 'border-brand-200 bg-accent-soft text-accent-strong dark:border-brand-800',
  error: 'border-danger-line bg-danger-soft text-danger',
  warning: 'border-warning-line bg-warning-soft text-warning',
  info: 'border-border bg-info-soft text-info',
};

const KIND_ICON: Record<ToastKind, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
};

/** Toasts sit at the reading end of the bottom edge (left in RTL, right in LTR). */
export function ToastViewport() {
  const { toasts, dismiss } = useToastInternal();
  const t = useTranslations('toast');

  return (
    <div
      className="pointer-events-none fixed bottom-4 end-4 z-[45] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.kind === 'error' ? 'alert' : 'status'}
          aria-live={toast.kind === 'error' ? 'assertive' : 'polite'}
          className={`pointer-events-auto flex animate-rise items-start gap-2 rounded-xl border p-3 text-sm shadow-lift ${KIND_CLASS[toast.kind]}`}
        >
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-current/15 text-xs font-bold"
          >
            {KIND_ICON[toast.kind]}
          </span>
          <p className="min-w-0 flex-1">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label={t('dismiss')}
            className="flex-shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
