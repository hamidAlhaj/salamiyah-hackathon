import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { ActiveBadge, ActiveToggle } from '@/components/admin/ActiveToggle';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { Tabs } from '@/components/ui/Tabs';
import { setUserActiveAction } from '@/lib/actions/users';
import { listCollectionPoints } from '@/lib/api/admin-lookups';
import { listUsers } from '@/lib/api/admin-users';
import { requireWorkspace } from '@/lib/auth';
import type { AdminUser } from '@/lib/types/staff';
import { formatNumber, type Role } from '@/shared';
import { UserForm } from './UserForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('adminSetup');
  return { title: t('users.title') };
}

// Staff roles in the order the council thinks about them; donors live in their own tab.
const STAFF_ORDER: Role[] = ['ADMIN', 'CASE_OFFICER', 'FINANCE_VERIFIER', 'STAFF', 'COLLECTOR'];

/** ADMIN: accounts, roles, active state and each collector's collection points. */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { token, user: me, allowed } = await requireWorkspace('users');
  if (!allowed) return <NotForYourRole />;
  const t = await getTranslations('adminSetup');
  const tRoles = await getTranslations('roles');
  const tCommon = await getTranslations('common');
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const tab = (await searchParams).tab === 'donors' ? 'donors' : 'staff';
  const [users, points] = await Promise.all([listUsers(token), listCollectionPoints(token)]);

  const pointOptions = points.map((p) => ({
    id: p.id,
    name: p.name,
    area: p.area,
    isActive: p.isActive,
  }));
  const staff = users.filter((u) => u.role !== 'DONOR');
  const donors = users.filter((u) => u.role === 'DONOR');
  const groups: { role: Role; rows: AdminUser[] }[] =
    tab === 'donors'
      ? [{ role: 'DONOR', rows: donors }]
      : STAFF_ORDER.map((role) => ({
          role,
          rows: staff.filter((u) => u.role === role),
        }));

  return (
    <WorkspacePage title={t('users.title')} intro={t('users.intro')} testId="users-page">
      <Tabs
        label={t('users.title')}
        className="mb-6"
        items={[
          {
            href: '/dashboard/admin/users',
            label: `${t('users.tabStaff')} (${formatNumber(staff.length, locale)})`,
            current: tab === 'staff',
          },
          {
            href: '/dashboard/admin/users?tab=donors',
            label: `${t('users.tabDonors')} (${formatNumber(donors.length, locale)})`,
            current: tab === 'donors',
          },
        ]}
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-8" data-testid="user-list">
          {tab === 'donors' && <p className="text-sm text-muted">{t('users.donorsNote')}</p>}
          {groups.map(({ role, rows }) => (
            <section key={role} aria-labelledby={`role-${role}`}>
              <h2
                id={`role-${role}`}
                className="flex items-baseline gap-2 font-display text-base font-bold"
              >
                {tRoles(role)}
                <span className="text-xs font-normal text-muted">
                  {t('users.staffCount', { count: formatNumber(rows.length, locale) })}
                </span>
              </h2>
              {rows.length === 0 ? (
                <p className="mt-2 text-sm text-muted">{t('users.empty')}</p>
              ) : (
                <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
                  {rows.map((u) => {
                    const isSelf = u.id === me.id;
                    return (
                      <li
                        key={u.id}
                        data-phone={u.phone ?? undefined}
                        data-testid="user-row"
                        className={`p-4 ${u.isActive ? '' : 'bg-surface-muted/60'}`}
                      >
                        <div className="flex flex-wrap items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{u.fullName}</p>
                              {isSelf && (
                                <span className="rounded-full bg-info-soft px-2 py-0.5 text-xs font-semibold text-info">
                                  {t('users.you')}
                                </span>
                              )}
                              <ActiveBadge isActive={u.isActive} />
                            </div>
                            <p dir="ltr" className="mt-0.5 text-start text-sm text-muted">
                              {u.phone ?? '—'}
                            </p>
                            {u.role === 'COLLECTOR' && (
                              <ul
                                className="mt-2 flex flex-wrap gap-1.5"
                                aria-label={t('users.points')}
                                data-testid="user-points-list"
                              >
                                {u.collectionPoints.length === 0 ? (
                                  <li className="text-xs font-medium text-warning">
                                    {t('users.noAssigned')}
                                  </li>
                                ) : (
                                  u.collectionPoints.map((p) => (
                                    <li
                                      key={p.id}
                                      className="rounded-lg border border-border px-2 py-0.5 text-xs"
                                    >
                                      {p.name}
                                    </li>
                                  ))
                                )}
                              </ul>
                            )}
                          </div>
                          {!isSelf && (
                            <ActiveToggle
                              action={setUserActiveAction}
                              fields={{ id: u.id }}
                              isActive={u.isActive}
                              testId={`user-toggle-${u.id}`}
                            />
                          )}
                        </div>
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-medium text-accent">
                            {tCommon('edit')}
                          </summary>
                          <div className="mt-4">
                            <UserForm
                              key={`${u.role}-${u.fullName}-${u.collectionPoints.map((p) => p.id).join()}`}
                              user={u}
                              points={pointOptions}
                              isSelf={isSelf}
                            />
                          </div>
                        </details>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">{t('users.add')}</h2>
            <p className="mt-1 text-xs text-muted">{t('users.addNote')}</p>
            <div className="mt-4">
              <UserForm points={pointOptions} />
            </div>
          </section>
        </aside>
      </div>
    </WorkspacePage>
  );
}
