import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { ActiveBadge, ActiveToggle } from '@/components/admin/ActiveToggle';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { setCollectionPointActiveAction } from '@/lib/actions/lookups';
import { listCollectionPoints } from '@/lib/api/admin-lookups';
import { requireWorkspace } from '@/lib/auth';
import { formatNumber } from '@/shared';
import { PointForm } from './PointForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('adminSetup');
  return { title: t('points.title') };
}

/** ADMIN: where donors hand over cash, grouped by area, with the collectors serving each point. */
export default async function CollectionPointsPage() {
  const { token, allowed } = await requireWorkspace('collectionPoints');
  if (!allowed) return <NotForYourRole />;
  const t = await getTranslations('adminSetup');
  const tCommon = await getTranslations('common');
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const points = await listCollectionPoints(token);

  return (
    <WorkspacePage title={t('points.title')} intro={t('points.intro')} testId="points-page">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <ul className="space-y-3" data-testid="point-list">
          {points.length === 0 && <li className="text-muted">{t('points.empty')}</li>}
          {points.map((p) => (
            <li
              key={p.id}
              data-testid="point-row"
              data-name={p.name}
              className={`rounded-2xl border bg-surface p-5 shadow-card ${p.isActive ? 'border-border' : 'border-dashed border-control opacity-80'}`}
            >
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold">{p.name}</h2>
                    <span className="rounded-full bg-info-soft px-2 py-0.5 text-xs font-semibold text-info">
                      {t(`pointTypes.${p.type}`)}
                    </span>
                    <ActiveBadge isActive={p.isActive} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {p.area}
                    {p.contactName && (
                      <>
                        {' — '}
                        {t('points.contactName')}: {p.contactName}
                      </>
                    )}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium text-muted">
                      {t('points.collectors')}:
                    </span>
                    {p.collectors.length === 0 ? (
                      <Link
                        href="/dashboard/admin/users"
                        className="text-xs font-medium text-warning underline-offset-2 hover:underline"
                      >
                        {t('points.noCollectors')}
                      </Link>
                    ) : (
                      p.collectors.map((c) => (
                        <span
                          key={c.id}
                          className={`rounded-lg border border-border px-2 py-0.5 text-xs ${c.isActive ? '' : 'text-muted line-through'}`}
                        >
                          {c.fullName}
                        </span>
                      ))
                    )}
                    <span className="ms-auto text-xs tabular-nums text-muted">
                      {t('points.pledges', { count: formatNumber(p._count.pledges, locale) })}
                    </span>
                  </div>
                  {!p.isActive && (
                    <p className="mt-2 text-xs text-muted">{t('points.inactiveNote')}</p>
                  )}
                </div>
                <ActiveToggle
                  action={setCollectionPointActiveAction}
                  fields={{ id: p.id }}
                  isActive={p.isActive}
                  testId={`point-toggle-${p.id}`}
                />
              </div>
              <details className="mt-4 border-t border-border pt-3">
                <summary className="cursor-pointer text-sm font-medium text-accent">
                  {tCommon('edit')}
                </summary>
                <div className="mt-4">
                  <PointForm key={JSON.stringify(p)} point={p} />
                </div>
              </details>
            </li>
          ))}
        </ul>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">{t('points.add')}</h2>
            <div className="mt-4">
              <PointForm />
            </div>
          </section>
        </aside>
      </div>
    </WorkspacePage>
  );
}
