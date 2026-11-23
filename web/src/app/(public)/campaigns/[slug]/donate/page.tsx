import type { Metadata } from 'next';
import Link from 'next/link';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { DonateFlow } from '@/components/donate/DonateFlow';
import { PhoneRequiredCallout } from '@/components/donate/PhoneRequiredCallout';
import { buttonClasses } from '@/components/ui/Button';
import * as authApi from '@/lib/api/auth';
import { getCampaign } from '@/lib/api/campaigns';
import { ApiError, orNotFound } from '@/lib/api/client';
import { getCampaignAccounts } from '@/lib/api/payment-methods';
import { listActiveCollectionPoints } from '@/lib/api/pledges';
import { getSessionToken } from '@/lib/session';
import type { CurrentUser } from '@/shared';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const campaign = await orNotFound(getCampaign(slug, locale));
  const t = await getTranslations('donate');
  return { title: t('title', { title: campaign.title }) };
}

/** The signed-in user, or null (no cookie, or an expired token). */
async function currentUser(): Promise<CurrentUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    return await authApi.me(token);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) return null;
    throw err;
  }
}

/**
 * Donate to a campaign on every path: simulated e-payment («Demo»), transfer + receipt, or cash at a
 * collection point. Donors only; guests are asked to log in and come back here.
 */
export default async function DonatePage({ params }: Props) {
  const { slug } = await params;
  const locale = (await getLocale()) === 'en' ? 'en' : 'ar';
  const campaign = await orNotFound(getCampaign(slug, locale));
  const [user, t] = await Promise.all([currentUser(), getTranslations('donate')]);

  let body: React.ReactNode;
  if (!campaign.acceptsPledges) {
    body = <Notice title={t('notAccepting')} />;
  } else if (!user) {
    body = (
      <Notice title={t('loginTitle')} text={t('loginBody')}>
        <Link
          href={`/login?next=${encodeURIComponent(`/campaigns/${campaign.slug}/donate`)}`}
          className={buttonClasses('primary', 'lg', 'mt-5')}
          data-testid="donate-login"
        >
          {t('loginCta')}
        </Link>
      </Notice>
    );
  } else if (user.role !== 'DONOR') {
    body = <Notice title={t('staffTitle')} text={t('staffBody')} />;
  } else if (!user.phone) {
    // A Google sign-in donor without a phone: the API refuses every donation (phone_required).
    body = (
      <PhoneRequiredCallout className="max-w-xl" title={t('phoneTitle')} body={t('phoneBody')}>
        <Link
          href={`/dashboard/profile?next=${encodeURIComponent(`/campaigns/${campaign.slug}/donate`)}`}
          className={buttonClasses('primary', 'md', 'mt-4')}
          data-testid="add-phone"
        >
          {t('phoneCta')}
        </Link>
      </PhoneRequiredCallout>
    );
  } else {
    const [accounts, points, messages] = await Promise.all([
      getCampaignAccounts(campaign.id, locale),
      listActiveCollectionPoints(),
      getMessages(),
    ]);
    body = (
      <NextIntlClientProvider messages={{ donate: messages.donate }}>
        <DonateFlow
          campaign={{
            id: campaign.id,
            slug: campaign.slug,
            title: campaign.title,
            currency: campaign.currency,
          }}
          accounts={accounts}
          points={points}
        />
      </NextIntlClientProvider>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6" data-testid="donate-page">
      <Link
        href={`/campaigns/${campaign.slug}`}
        className="text-sm font-medium text-accent hover:underline"
      >
        {t('back')}
      </Link>
      <h1 className="mt-4 max-w-[34ch] font-display text-2xl font-bold leading-snug sm:text-3xl">
        {t('title', { title: campaign.title })}
      </h1>
      <p className="mt-2 max-w-[65ch] text-muted">{t('intro')}</p>
      <div className="mt-8">{body}</div>
    </div>
  );
}

function Notice({
  title,
  text,
  children,
}: {
  title: string;
  text?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-card">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {text && <p className="mt-2 text-sm text-muted">{text}</p>}
      {children}
    </div>
  );
}
