import { useTranslations } from 'next-intl';

/** Common frame of a workspace page: title, one-line intro, optional actions, then the content. */
export function WorkspacePage({
  title,
  intro,
  actions,
  children,
  testId,
}: {
  title: string;
  intro?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" data-testid={testId}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
          {intro && <p className="mt-1 max-w-[70ch] text-sm text-muted">{intro}</p>}
        </div>
        {actions}
      </header>
      <div className="mt-6">{children}</div>
    </div>
  );
}

/** Shown when a signed-in user opens a page that is not part of their role. */
export function NotForYourRole() {
  const t = useTranslations('workspace');
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="rounded-2xl border border-border bg-surface px-6 py-8 text-muted shadow-card">
        {t('forbidden')}
      </p>
    </div>
  );
}
