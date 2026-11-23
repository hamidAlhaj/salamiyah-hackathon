import Link from 'next/link';

export type TabItem = { href: string; label: string; current: boolean };

/**
 * Pill tabs as plain links (filters live in the URL, so they work without JavaScript).
 * Scrolls sideways on narrow screens instead of wrapping into a tall block.
 */
export function Tabs({
  label,
  items,
  className = '',
  children,
}: {
  label: string;
  items: TabItem[];
  className?: string;
  /** Extra controls after the tabs (e.g. a "clear filter" link). */
  children?: React.ReactNode;
}) {
  return (
    <nav aria-label={label} className={`-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 ${className}`}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.current ? 'page' : undefined}
          className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition duration-150 ${
            item.current
              ? 'border-brand-600 bg-brand-600 text-white shadow-card dark:border-brand-500 dark:bg-brand-600'
              : 'border-border bg-surface text-ink hover:border-brand-600 hover:text-accent'
          }`}
        >
          {item.label}
        </Link>
      ))}
      {children}
    </nav>
  );
}
