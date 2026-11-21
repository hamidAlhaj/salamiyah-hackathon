'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  title,
  onClose,
  closeLabel,
  children,
  initialFocusRef,
}: {
  title: string;
  onClose: () => void;
  /** Accessible name of the close button, already translated. */
  closeLabel: string;
  children: React.ReactNode;
  // Element to focus when the dialog opens - defaults to the first focusable
  // element inside it (see ConfirmDialog, which points this at Cancel so a
  // destructive Confirm button is never the safe default focus).
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const target =
      initialFocusRef?.current ?? dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    target?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  return (
    // Topmost layer in the app's z-index hierarchy - see ToastViewport's
    // comment for the full ordering (dropdowns < navbar dropdown < toast <
    // modal).
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        // max-h + overflow-y-auto: a form with several fields (e.g. Create
        // issue's title/description/priority/assignee/points/sprint) can be
        // taller than a phone viewport - without this the modal simply
        // overflowed the screen with no way to reach the submit button.
        className="flex w-full max-w-lg flex-col overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-lift"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-muted"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
