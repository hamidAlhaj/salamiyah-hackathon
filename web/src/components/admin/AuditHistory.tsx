import { getFormatter, getTranslations } from 'next-intl/server';
import { DATE_TIME_SHORT } from '@/lib/format';
import type { AuditHistoryItem, AuditJson } from '@/lib/types/staff';

const MAX_FIELDS = 6;

function show(value: AuditJson | undefined): string {
  if (value === null || value === undefined) return '—';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return text.length > 60 ? `${text.slice(0, 59)}…` : text;
}

/** The fields an entry changed or set: before → after where both exist, otherwise the new value. */
function changes(item: AuditHistoryItem): { key: string; before?: string; after: string }[] {
  const obj = (v: AuditJson) =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, AuditJson>) : {};
  const before = obj(item.before);
  const after = obj(item.after);
  const keys = [...new Set([...Object.keys(after), ...Object.keys(before)])];
  return keys
    .slice(0, MAX_FIELDS)
    .map((key) =>
      key in before && key in after
        ? { key, before: show(before[key]), after: show(after[key]) }
        : { key, after: show(key in after ? after[key] : before[key]) },
    );
}

/**
 * ADMIN-only history panel (campaign or case): who did what and when, read from the audit log.
 * Phones, national IDs and private names arrive masked from the API; pages render this only for
 * ADMIN, and the API refuses every other role.
 */
export async function AuditHistory({ items }: { items: AuditHistoryItem[] }) {
  const t = await getTranslations('audit');
  const tRoles = await getTranslations('roles');
  const format = await getFormatter();
  const label = (action: string) => {
    const key = `actions.${action.replace(/\./g, '_')}`;
    return t.has(key) ? t(key) : action;
  };

  return (
    <details
      className="group rounded-2xl border border-border bg-surface shadow-card"
      data-testid="audit-history"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl p-5 sm:p-6">
        <span>
          <span className="block font-display text-lg font-bold">{t('title')}</span>
          <span className="mt-1 block text-sm text-muted">
            {t('hint', { count: items.length })}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-muted transition group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      {items.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted sm:px-6">{t('empty')}</p>
      ) : (
        <ol className="space-y-4 border-t border-border px-5 py-5 sm:px-6">
          {items.map((item) => (
            <li
              key={item.id}
              className="border-s-2 border-border ps-4"
              data-testid="audit-entry"
              data-action={item.action}
            >
              <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-semibold">{label(item.action)}</span>
                {item.reference && (
                  <span dir="ltr" className="text-xs font-semibold text-muted">
                    {item.reference}
                  </span>
                )}
              </p>
              <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                <span>
                  {item.actor ? `${item.actor.fullName} (${tRoles(item.actor.role)})` : t('system')}
                </span>
                <time dateTime={item.createdAt}>
                  {format.dateTime(new Date(item.createdAt), DATE_TIME_SHORT)}
                </time>
              </p>
              {changes(item).length > 0 && (
                <dl className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  {changes(item).map((c) => (
                    <div
                      key={c.key}
                      dir="ltr"
                      className="flex max-w-full gap-1 rounded-lg bg-surface-muted px-2 py-1"
                    >
                      <dt className="text-muted">{c.key}:</dt>
                      <dd className="min-w-0 break-words">
                        {c.before !== undefined ? `${c.before} → ${c.after}` : c.after}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}
