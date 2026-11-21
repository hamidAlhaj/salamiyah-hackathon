import { SiteHeader } from '@/components/layout/SiteHeader';
import * as authApi from '@/lib/api/auth';
import { requireSessionToken } from '@/lib/session';

/** Every page in (app) needs a valid session: no cookie → /login; a rejected token → /login. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = await requireSessionToken();
  // Confirms the token with the API (apiFetch redirects to /login on 401).
  await authApi.me(token);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
    </div>
  );
}
