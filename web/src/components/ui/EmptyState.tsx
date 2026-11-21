import Link from 'next/link';
import { buttonClasses } from './Button';

type Icon = 'inbox' | 'search' | 'heart' | 'check' | 'megaphone';

const paths: Record<Icon, React.ReactNode> = {
  inbox: <path d="M3 13h4l2 3h6l2-3h4M5 5h14l2 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5l2-8z" />,
  search: <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm9 16-4.35-4.35" />,
  heart: <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  megaphone: <path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1zm13-3a5 5 0 0 1 0 8" />,
};

/** Icon + one sentence + (optionally) one action. The same shape everywhere. */
export function EmptyState({
  icon = 'inbox',
  message,
  action,
  className = '',
}: {
  icon?: Icon;
  message: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center ${className}`}
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent"
        aria-hidden="true"
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {paths[icon]}
        </svg>
      </span>
      <p className="max-w-sm text-muted">{message}</p>
      {action && (
        <Link href={action.href} className={buttonClasses('secondary', 'sm')}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
