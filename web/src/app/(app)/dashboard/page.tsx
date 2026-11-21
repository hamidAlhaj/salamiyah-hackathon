import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/Badge';
import { StarLattice } from '@/components/ui/StarLattice';
import * as authApi from '@/lib/api/auth';
import { requireSessionToken } from '@/lib/session';

interface Task {
  title: string;
  body: string;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('dashboard') };
}

/** Placeholder dashboard per role: who you are and what you will do here. Real screens: P05+. */
export default async function DashboardPage() {
  const token = await requireSessionToken();
  const user = await authApi.me(token);
  const t = await getTranslations('dash');
  const tRoles = await getTranslations('roles');
  const tCommon = await getTranslations('common');
  const tasks = t.raw(`tasks.${user.role}`) as Task[];

  return (
    <div
      className="mx-auto max-w-6xl px-4 py-10 sm:px-6"
      data-testid="dashboard"
      data-role={user.role}
    >
      <section className="relative isolate overflow-hidden rounded-[28px] border border-border bg-surface px-6 py-8 shadow-card sm:px-9">
        <StarLattice
          tone="soft"
          className="absolute inset-y-0 end-0 -z-10 h-full w-1/2 ltr:[mask-image:linear-gradient(to_left,black_30%,transparent)] rtl:[mask-image:linear-gradient(to_right,black_30%,transparent)]"
        />
        <h1 className="font-display text-3xl font-bold">
          {t('greeting', { name: user.fullName })}
        </h1>
        <p className="mt-2 text-muted" data-testid="dashboard-role">
          {t('signedInAs', { role: tRoles(user.role) })}
        </p>
      </section>

      <h2 className="mt-10 font-display text-xl font-bold">{t('tasksTitle')}</h2>
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {tasks.map((task) => (
          <li key={task.title} className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
            <div>
              <p className="font-semibold">{task.title}</p>
              <p className="mt-0.5 max-w-[65ch] text-sm text-muted">{task.body}</p>
            </div>
            <Badge className="mt-1 flex-shrink-0">{tCommon('soon')}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
