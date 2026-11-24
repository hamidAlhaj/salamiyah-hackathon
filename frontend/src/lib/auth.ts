import 'server-only';
import type { CurrentUser } from '@/shared';
import * as authApi from './api/auth';
import { requireSessionToken } from './session';
import { canUse, type WorkspaceKey } from './workspace';

/** The signed-in staff member for a workspace page (redirects to /login without a session). */
export async function requireUser(): Promise<{ token: string; user: CurrentUser }> {
  const token = await requireSessionToken();
  const user = await authApi.me(token);
  return { token, user };
}

/** Same, plus whether the page belongs to the user's role (pages render a notice otherwise). */
export async function requireWorkspace(
  key: WorkspaceKey,
): Promise<{ token: string; user: CurrentUser; allowed: boolean }> {
  const { token, user } = await requireUser();
  return { token, user, allowed: canUse(user.role, key) };
}
