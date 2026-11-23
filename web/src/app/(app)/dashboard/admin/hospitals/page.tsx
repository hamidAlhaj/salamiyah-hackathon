import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { ActiveBadge, ActiveToggle } from '@/components/admin/ActiveToggle';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { setHospitalActiveAction } from '@/lib/actions/lookups';
import { listAllHospitals } from '@/lib/api/admin-lookups';
import { requireWorkspace } from '@/lib/auth';
import { formatNumber } from '@/shared';
import { HospitalForm } from './HospitalForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('adminSetup');
  return { title: t('hospitals.title') };
}

/** ADMIN: approved hospitals for medical cases (deactivate instead of delete). */
export default async function HospitalsPage() {
  const { token, allowed } = await requireWorkspace('hospitals');
  if (!allowed) return <NotForYourRole />;
  const t = await getTranslations('adminSetup');
  const tCommon = await getTranslations('common');
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const hospitals = await listAllHospitals(token);
  const n = (count: number) => formatNumber(count, locale);

  return (
    <WorkspacePage
      title={t('hospitals.title')}
      intro={t('hospitals.intro')}
      testId="hospitals-page"
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <ul className="space-y-3" data-testid="hospital-list">
          {hospitals.length === 0 && <li className="text-muted">{t('hospitals.empty')}</li>}
          {hospitals.map((h) => (
            <li
              key={h.id}
              data-testid="hospital-row"
              className={`rounded-2xl border bg-surface p-5 shadow-card ${h.isActive ? 'border-border' : 'border-dashed border-control opacity-80'}`}
            >
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold">{h.nameAr}</h2>
                    {h.nameEn && (
                      <span dir="ltr" className="text-sm text-muted">
                        {h.nameEn}
                      </span>
                    )}
                    <ActiveBadge isActive={h.isActive} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {h.city} — {h.isPrivate ? t('hospitals.private') : t('hospitals.public')}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5 text-xs text-muted">
                    <li className="rounded-lg border border-border px-2 py-0.5">
                      {t('hospitals.usageCases', { count: n(h._count.cases) })}
                    </li>
                    <li className="rounded-lg border border-border px-2 py-0.5">
                      {t('hospitals.usageCampaigns', { count: n(h._count.campaigns) })}
                    </li>
                    <li className="rounded-lg border border-border px-2 py-0.5">
                      {t('hospitals.usagePayments', { count: n(h._count.expenditures) })}
                    </li>
                  </ul>
                  {!h.isActive && (
                    <p className="mt-2 text-xs text-muted">{t('hospitals.inactiveNote')}</p>
                  )}
                </div>
                <ActiveToggle
                  action={setHospitalActiveAction}
                  fields={{ id: h.id }}
                  isActive={h.isActive}
                  testId={`hospital-toggle-${h.id}`}
                />
              </div>
              <details className="mt-4 border-t border-border pt-3">
                <summary className="cursor-pointer text-sm font-medium text-accent">
                  {tCommon('edit')}
                </summary>
                <div className="mt-4">
                  <HospitalForm key={JSON.stringify(h)} hospital={h} />
                </div>
              </details>
            </li>
          ))}
        </ul>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">{t('hospitals.add')}</h2>
            <div className="mt-4">
              <HospitalForm />
            </div>
          </section>
        </aside>
      </div>
    </WorkspacePage>
  );
}
