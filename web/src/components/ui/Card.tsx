import type { HTMLAttributes } from 'react';

/** The card surface: rounded-2xl, token border and the single card elevation. */
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-6 shadow-card ${className}`}
      {...props}
    />
  );
}
