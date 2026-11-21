'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  show: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, show, dismiss }}>{children}</ToastContext.Provider>
  );
}

// Convenience wrapper - most call sites just want toast.success('...') /
// toast.error('...') rather than show('success', '...').
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return {
    success: (message: string) => ctx.show('success', message),
    error: (message: string) => ctx.show('error', message),
    warning: (message: string) => ctx.show('warning', message),
    info: (message: string) => ctx.show('info', message),
  };
}

// Internal - only the ToastViewport renders the raw list/dismiss.
export function useToastInternal() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastInternal must be used within ToastProvider');
  return ctx;
}
