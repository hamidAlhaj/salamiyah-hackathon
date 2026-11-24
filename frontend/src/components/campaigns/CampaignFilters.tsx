import Link from 'next/link';
import type { Priority, PublicCategory } from '@/shared';
import { CategoryIcon } from './CategoryIcon';

/** Builds a home URL that keeps the other filter (links only, works without JavaScript). */
export function filterHref(filters: { category?: string; priority?: Priority }) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.priority) params.set('priority', filters.priority);
  const qs = params.toString();
  return `/${qs ? `?${qs}` : ''}#campaigns`;
}

const chip =
  'inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition duration-150';
const chipOn =
  'border-brand-600 bg-brand-600 text-white shadow-card dark:border-brand-500 dark:bg-brand-600';
const chipOff = 'border-border bg-surface text-ink hover:border-brand-600 hover:text-accent';

/**
 * Category tabs come from GET /categories (data managed by ADMIN): a new category appears here with
 * its icon without any code change.
 */
export function CategoryTabs({
  categories,
  active,
  priority,
  allLabel,
  label,
}: {
  categories: PublicCategory[];
  active?: string;
  priority?: Priority;
  allLabel: string;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      data-testid="category-tabs"
    >
      <Link
        href={filterHref({ priority })}
        aria-current={!active ? 'page' : undefined}
        className={`${chip} ${!active ? chipOn : chipOff}`}
      >
        {allLabel}
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={filterHref({ category: c.code, priority })}
          aria-current={active === c.code ? 'page' : undefined}
          data-category={c.code}
          className={`${chip} ${active === c.code ? chipOn : chipOff}`}
        >
          <CategoryIcon icon={c.icon} className="h-4 w-4" />
          {c.name}
        </Link>
      ))}
    </nav>
  );
}

export function PriorityFilter({
  active,
  category,
  options,
  label,
}: {
  active?: Priority;
  category?: string;
  options: { value?: Priority; label: string }[];
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center gap-1.5 text-sm"
      data-testid="priority-filter"
    >
      <span className="me-1 text-muted">{label}</span>
      {options.map((o) => {
        const on = o.value === active;
        return (
          <Link
            key={o.value ?? 'all'}
            href={filterHref({ category, priority: o.value })}
            aria-current={on ? 'page' : undefined}
            className={`rounded-lg px-2.5 py-1 ${on ? 'bg-accent-soft font-semibold text-accent-strong' : 'text-muted hover:bg-surface-muted hover:text-ink'}`}
          >
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}
