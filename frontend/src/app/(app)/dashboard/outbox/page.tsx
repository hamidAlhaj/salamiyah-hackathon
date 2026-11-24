import type { Metadata } from 'next';
import Link from 'next/link';
import { getFormatter, getTranslations } from 'next-intl/server';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { listOutbox } from '@/lib/api/notifications';
import { requireWorkspace } from '@/lib/auth';
import { DATE_TIME_SHORT } from '@/lib/format';
import { OUTBOX_TEMPLATES, type OutboxTemplate } from '@/shared';
import { NextMode } from './NextMode';
import { SendButton } from './SendButton';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('outbox');
  return { title: t('title') };
}

type Props = { searchParams: Promise<{ kind?: string; status?: string }> };

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm font-medium transition ${
    active
      ? 'border-brand-600 bg-accent-soft text-accent-strong dark:border-brand-500'
      : 'border-border bg-surface text-muted hover:text-ink'
  }`;

/**
 * The WhatsApp outbox (ADMIN): receipts, confirmations and urgent alerts waiting to be sent from the
 * council phone. Each row opens a prefilled wa.me link with one tap; nothing is sent by the server.
 */
export default async function OutboxPage({ searchParams }: Props) {
  const { token, allowed } = await requireWorkspace('outbox');
  if (!allowed) return <NotForYourRole />;
  const sp = await searchParams;
  const kind = OUTBOX_TEMPLATES.includes(sp.kind as OutboxTemplate)
    ? (sp.kind as OutboxTemplate)
    : undefined;
  const status = sp.status === 'QUEUED' || sp.status === 'OPENED' ? sp.status : undefined;
  const [data, t, format] = await Promise.all([
    listOutbox(token, { template: kind, status }),
    getTranslations('outbox'),
    getFormatter(),
  ]);
  const href = (k?: string, s?: string) => {
    const q = new URLSearchParams();
    if (k) q.set('kind', k);
    if (s) q.set('status', s);
    const qs = q.toString();
    return `/dashboard/outbox${qs ? `?${qs}` : ''}`;
  };

  return (
    <WorkspacePage title={t('title')} intro={t('intro')} testId="outbox-page">
      <div className="space-y-6">
        <NextMode template={kind} queued={data.queued} />

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2" aria-label={t('statusLabel')}>
            {([undefined, 'QUEUED', 'OPENED'] as const).map((s) => (
              <Link
                key={s ?? 'all'}
                href={href(kind, s)}
                className={chip(status === s)}
                aria-current={status === s ? 'true' : undefined}
              >
                {s ? t(`status.${s}`) : t('allStatuses')}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" aria-label={t('kindLabel')}>
            <Link
              href={href(undefined, status)}
              className={chip(!kind)}
              aria-current={!kind ? 'true' : undefined}
            >
              {t('allKinds')}
            </Link>
            {OUTBOX_TEMPLATES.map((k) => (
              <Link
                key={k}
                href={href(k, status)}
                className={chip(kind === k)}
                aria-current={kind === k ? 'true' : undefined}
                data-kind={k}
              >
                {t(`templates.${k.replace('.', '_')}`)}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted">
          {t('count', { total: data.total, queued: data.queued })}
        </p>

        {data.items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-muted">
            {t('empty')}
          </p>
        ) : (
          <ul className="space-y-3" data-testid="outbox-list">
            {data.items.map((m) => (
              <li
                key={m.id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5"
                data-template={m.template}
                data-status={m.status}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-muted">
                        {t(`templates.${m.template.replace('.', '_')}`)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          m.status === 'QUEUED'
                            ? 'bg-warning-soft text-warning'
                            : 'bg-accent-soft text-accent-strong'
                        }`}
                      >
                        {t(`status.${m.status}`)}
                      </span>
                    </div>
                    <p className="mt-2 font-semibold">
                      {m.recipientName ?? t('unknownRecipient')}{' '}
                      <span className="text-sm font-normal text-muted" dir="ltr">
                        {m.phone}
                      </span>
                    </p>
                  </div>
                  {m.openUrl && (
                    <SendButton
                      id={m.id}
                      openUrl={m.openUrl}
                      label={m.status === 'QUEUED' ? t('send') : t('sendAgain')}
                      opened={m.status === 'OPENED'}
                    />
                  )}
                </div>
                <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-muted">
                  {m.body}
                </p>
                <p className="mt-2 text-xs text-muted">
                  <time dateTime={m.createdAt}>
                    {format.dateTime(new Date(m.createdAt), DATE_TIME_SHORT)}
                  </time>
                  {m.openedAt && (
                    <>
                      {' — '}
                      {t('openedAt')}{' '}
                      <time dateTime={m.openedAt}>
                        {format.dateTime(new Date(m.openedAt), DATE_TIME_SHORT)}
                      </time>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </WorkspacePage>
  );
}
