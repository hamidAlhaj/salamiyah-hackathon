import { DATE_MEDIUM } from '@/lib/format';
import type { Metadata } from 'next';
import { getFormatter, getTranslations } from 'next-intl/server';
import { buttonClasses } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { ApiError } from '@/lib/api/client';
import { trackCase, type TrackResult, type TrackStage } from '@/lib/api/cases';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('track');
  return { title: t('title') };
}

/** The normal path of a request, in order. Other stages are shown as a single message. */
const PATH: TrackStage[] = ['RECEIVED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'DISBURSED'];
const NO_RE = /^[A-Za-z0-9-]{6,30}$/;
const LAST4_RE = /^\d{4}$/;

/** Public request tracking: a GET form, read on the server; only the stage is shown. */
export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const t = await getTranslations('track');
  const format = await getFormatter();
  const no = typeof params.no === 'string' ? params.no.trim() : '';
  const last4 = typeof params.phoneLast4 === 'string' ? params.phoneLast4.trim() : '';
  const submitted = no !== '' || last4 !== '';

  let result: TrackResult | null = null;
  let error: string | null = null;
  if (submitted) {
    if (!NO_RE.test(no) || !LAST4_RE.test(last4)) {
      error = t('invalid');
    } else {
      try {
        result = await trackCase(no, last4);
      } catch (err) {
        if (!(err instanceof ApiError)) throw err;
        error = err.statusCode === 404 ? t('notFound') : t('invalid');
      }
    }
  }

  const current = result ? PATH.indexOf(result.stage) : -1;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
      <p className="mt-2 text-muted">{t('intro')}</p>

      <form method="get" className="mt-8 space-y-4" data-testid="track-form">
        <Field label={t('no')} name="no" defaultValue={no} dir="ltr" required autoComplete="off" />
        <Field
          label={t('last4')}
          name="phoneLast4"
          defaultValue={last4}
          dir="ltr"
          inputMode="numeric"
          maxLength={4}
          required
          autoComplete="off"
        />
        <button type="submit" className={buttonClasses('primary', 'lg', 'w-full')}>
          {t('submit')}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      {result && (
        <section
          className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-card"
          data-testid="track-result"
        >
          <p dir="ltr" className="text-start font-display text-lg font-bold text-accent-strong">
            {result.trackingNo}
          </p>
          <p className="mt-1 text-sm text-muted">
            {t('stage')}: <strong className="text-ink">{t(`stages.${result.stage}`)}</strong> (
            {format.dateTime(new Date(result.updatedAt), DATE_MEDIUM)})
          </p>
          {current >= 0 && (
            <ol className="mt-5 space-y-3">
              {PATH.map((stage, i) => (
                <li key={stage} className="flex items-center gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className={`h-3 w-3 flex-shrink-0 rounded-full ${i <= current ? 'bg-brand-600 dark:bg-brand-400' : 'border border-control'}`}
                  />
                  <span
                    className={i === current ? 'font-semibold' : i < current ? '' : 'text-muted'}
                  >
                    {t(`stages.${stage}`)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
