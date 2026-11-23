import type { ButtonHTMLAttributes } from 'react';

/** `give` is reserved for donate actions and funding progress (CLAUDE.md); everything else uses brand or neutrals. */
export type ButtonVariant = 'primary' | 'give' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition duration-150 ease-out ' +
  'active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-card hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-700',
  // give-700 / give-800 keep white text at 4.9:1 / 7.1:1 in both themes (give-600 is only 3.4:1).
  give: 'bg-give-700 text-white shadow-card hover:bg-give-800',
  secondary: 'border border-border bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-ink hover:bg-surface-muted',
  danger: 'bg-danger text-surface hover:opacity-90',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

/** Shared classes so links (next/link) can look like buttons. */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}
