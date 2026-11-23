import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { HeaderBell } from '@/components/layout/HeaderBell';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { requireUser } from '@/lib/auth';

/**
 * Message namespaces the staff Client Components use, sent only on workspace pages (public pages get
 * the smaller root set, so staff form labels never reach them).
 */
const STAFF_CLIENT_NAMESPACES = [
  'auth',
  'errors',
  'language',
  'nav',
  'roles',
  'theme',
  'toast',
  'workspace',
  'common',
  'adminCategories',
  'adminCampaigns',
  'adminSetup',
  'cases',
  'intake',
  'finance',
  'imports',
  'priority',
  'category',
  'campaign',
  'donate',
  'myDonations',
  'profile',
  'notifications',
  'outbox',
  'collector',
  'spending',
] as const;

/** Every page in (app) needs a valid session: no cookie → /login; a rejected token → /login. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();
  const all = await getMessages();
  const messages = Object.fromEntries(STAFF_CLIENT_NAMESPACES.map((ns) => [ns, all[ns]]));

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader bell={<HeaderBell />} />
        <div className="flex flex-1 flex-col lg:flex-row">
          <Sidebar role={user.role} />
          <main id="main" className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
