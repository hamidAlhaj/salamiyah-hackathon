'use client';

import { useFormStatus } from 'react-dom';
import { buttonClasses, type ButtonVariant } from './Button';

/** Submit button that disables itself and shows `pendingLabel` while its form is submitting. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = 'primary',
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: ButtonVariant;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={buttonClasses(variant, 'lg', className)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Form-level error, announced to screen readers. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
    >
      {message}
    </p>
  );
}
