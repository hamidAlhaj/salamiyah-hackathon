'use client';

import { useActionState, useRef } from 'react';
import type { FormState } from '@/lib/actions/errors';
import { FormError, SubmitButton } from '@/components/ui/FormParts';
import type { ButtonVariant } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

/**
 * A form bound to one Server Action: shows the action's error inline and toasts its success message
 * directly on the result (not from an effect). Optionally resets the fields after a success.
 */
export function ActionForm<S extends FormState>({
  action,
  submitLabel,
  pendingLabel,
  variant = 'primary',
  resetOnSuccess = false,
  className = '',
  submitClassName = '',
  onResult,
  children,
  testId,
}: {
  action: (prev: S, formData: FormData) => Promise<S>;
  submitLabel: string;
  pendingLabel: string;
  variant?: ButtonVariant;
  resetOnSuccess?: boolean;
  className?: string;
  submitClassName?: string;
  onResult?: (state: S) => void;
  children: React.ReactNode;
  testId?: string;
}) {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<S, FormData>(
    async (prev: Awaited<S>, formData: FormData) => {
      const next = await action(prev, formData);
      if (next.ok && next.message) toast.success(next.message);
      if (next.ok && resetOnSuccess) formRef.current?.reset();
      onResult?.(next);
      return next;
    },
    {} as Awaited<S>,
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`space-y-4 ${className}`}
      data-testid={testId}
    >
      <FormError message={state.error} />
      {children}
      <SubmitButton pendingLabel={pendingLabel} variant={variant} className={submitClassName}>
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
