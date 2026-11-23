import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { CategoryIcon } from '@/components/campaigns/CategoryIcon';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { listAllCategories } from '@/lib/api/admin-categories';
import { requireWorkspace } from '@/lib/auth';
import { categoryBeneficiaryKind, formatNumber } from '@/shared';
import { CategoryForm } from './CategoryForm';
import { ToggleActive } from './ToggleActive';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('adminCategories');
  return { title: t('title') };
}

/** ADMIN: campaign categories as data. A new category appears on the public site immediately. */
export default async function CategoriesPage() {
  const { token, allowed } = await requireWorkspace('categories');
  if (!allowed) return <NotForYourRole />;
  const t = await getTranslations('adminCategories');
  const tCommon = await getTranslations('common');
  const tKinds = await getTranslations('campaign.kinds');
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const categories = await listAllCategories(token);

  const flags = (c: (typeof categories)[number]) => {
    const list = [
      c.requiresMedicalCase && t('flagMedical'),
      c.lockedPayeeHospital && t('flagHospital'),
      c.supportsMonthlySponsorship && t('flagMonthly'),
    ].filter((f): f is string => Boolean(f));
    const kind = categoryBeneficiaryKind(c);
    return [
      ...(list.length ? list : [t('flagNone')]),
      kind ? t('kindOnly', { kind: tKinds(kind) }) : t('kindAny'),
    ];
  };

  return (
    <WorkspacePage title={t('title')} intro={t('intro')} testId="categories-page">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <ul className="space-y-3" data-testid="category-list">
          {categories.length === 0 && <li className="text-muted">{t('empty')}</li>}
          {categories.map((c) => (
            <li
              key={c.id}
              data-code={c.code}
              className={`rounded-2xl border bg-surface p-5 shadow-card ${c.isActive ? 'border-border' : 'border-dashed border-control opacity-80'}`}
            >
              <div className="flex flex-wrap items-start gap-4">
                <span
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${c.isActive ? 'bg-accent-soft text-accent-strong' : 'bg-surface-muted text-muted'}`}
                >
                  <CategoryIcon icon={c.icon} className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold">{c.nameAr}</h2>
                    <span dir="ltr" className="text-sm text-muted">
                      {c.nameEn}
                    </span>
                    {c.isSystem && (
                      <span className="rounded-full bg-info-soft px-2 py-0.5 text-xs font-semibold text-info">
                        {t('system')}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.isActive ? 'bg-accent-soft text-accent-strong' : 'bg-surface-muted text-muted'}`}
                      data-testid="category-state"
                    >
                      {c.isActive ? t('active') : t('inactive')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    <span dir="ltr">{c.code}</span> — {t('order')}{' '}
                    {formatNumber(c.sortOrder, locale)} —{' '}
                    {t('campaignsCount', { count: c._count.campaigns })}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t('flags')}>
                    {flags(c).map((f) => (
                      <li
                        key={f}
                        className="rounded-lg border border-border px-2 py-0.5 text-xs text-muted"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <ToggleActive id={c.id} isActive={c.isActive} code={c.code} />
              </div>
              <details className="mt-4 border-t border-border pt-3">
                <summary className="cursor-pointer text-sm font-medium text-accent">
                  {tCommon('edit')}
                </summary>
                <div className="mt-4">
                  <CategoryForm category={c} />
                </div>
              </details>
            </li>
          ))}
        </ul>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">{t('add')}</h2>
            <p className="mt-1 text-xs text-muted">{t('flagsNote')}</p>
            <div className="mt-4">
              <CategoryForm />
            </div>
          </section>
        </aside>
      </div>
    </WorkspacePage>
  );
}
