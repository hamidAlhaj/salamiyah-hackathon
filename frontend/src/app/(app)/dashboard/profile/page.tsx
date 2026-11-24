import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { GoogleMark } from '@/components/auth/GoogleMark';
import { PhoneRequiredCallout } from '@/components/donate/PhoneRequiredCallout';
import { NotForYourRole, WorkspacePage } from '@/components/layout/WorkspacePage';
import { buttonClasses } from '@/components/ui/Button';
import { requireWorkspace } from '@/lib/auth';
import { safeNextPath } from '@/lib/next-path';
import { PhoneForm } from './PhoneForm';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('profile');
  return { title: t('title') };
}

/**
 * «ملفي» (DONOR): the account summary and the phone number receipts and alerts go to. A donor who
 * signed in with Google lands here first: donating is refused (`phone_required`) until a phone is set.
 */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { user, allowed } = await requireWorkspace('profile');
  if (!allowed) return <NotForYourRole />;
  const [t, { next }] = await Promise.all([getTranslations('profile'), searchParams]);
  const returnTo = typeof next === 'string' ? safeNextPath(next) : undefined;
  const hasPhone = user.phone !== null;

  return (
    <WorkspacePage title={t('title')} intro={t('intro')} testId="profile-page">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section
          aria-labelledby="account-heading"
          className="self-start rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
        >
          <h2 id="account-heading" className="font-display text-lg font-bold">
            {t('account')}
          </h2>
          <dl className="mt-4 divide-y divide-border text-sm">
            <Row label={t('name')}>{user.fullName}</Row>
            {user.donorCode && (
              <Row label={t('donorCode')}>
                <span
                  dir="ltr"
                  className="font-display font-bold tracking-wider text-accent-strong"
                >
                  {user.donorCode}
                </span>
              </Row>
            )}
            <Row label={t('signIn')}>
              <span className="inline-flex items-center gap-2">
                {user.googleLinked && <GoogleMark className="h-4 w-4" />}
                {user.googleLinked ? t('viaGoogle') : t('viaPassword')}
              </span>
            </Row>
            <Row label={t('current')}>
              {hasPhone ? (
                <span dir="ltr" data-testid="current-phone">
                  {user.phone}
                </span>
              ) : (
                <span className="font-medium text-warning" data-testid="current-phone">
                  {t('missing')}
                </span>
              )}
            </Row>
          </dl>
        </section>

        <section
          aria-labelledby="phone-heading"
          className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
        >
          <h2 id="phone-heading" className="font-display text-lg font-bold">
            {t('phoneSection')}
          </h2>
          {!hasPhone && (
            <PhoneRequiredCallout
              className="mt-4"
              title={t('requiredTitle')}
              body={t('requiredBody')}
            />
          )}
          <div className="mt-5">
            <PhoneForm
              key={`${user.phone ?? ''}|${user.whatsappOptIn}`}
              phone={user.phone}
              whatsappOptIn={user.whatsappOptIn}
              isLogin={!user.googleLinked}
            />
          </div>
          {hasPhone && returnTo && (
            <Link
              href={returnTo}
              className={buttonClasses('give', 'lg', 'mt-5 w-full sm:w-auto')}
              data-testid="continue-donating"
            >
              {t('continue')}
            </Link>
          )}
        </section>
      </div>
    </WorkspacePage>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-ink">{children}</dd>
    </div>
  );
}
