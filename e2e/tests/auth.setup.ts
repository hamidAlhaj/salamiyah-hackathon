import { existsSync, statSync } from 'node:fs';
import { expect, test as setup } from '@playwright/test';
import { authFile, loginWithForm, ROLE_LABELS, USERS, type UserKey } from './helpers';

// The API allows 10 logins a minute, so a session saved less than 6 hours ago (tokens last 8 h)
// is reused unless E2E_FRESH_LOGIN=1. A reset database invalidates old sessions: the check below
// then falls back to the login form.
const MAX_AGE_MS = 6 * 60 * 60 * 1000;
const fresh = (file: string) =>
  process.env.E2E_FRESH_LOGIN !== '1' &&
  existsSync(file) &&
  Date.now() - statSync(file).mtimeMs < MAX_AGE_MS;

// Login per role through the form: the dashboard greets each role, and the session cookie is
// HttpOnly (never readable from page JavaScript). The sessions are reused by the other tests.
for (const user of Object.keys(USERS) as UserKey[]) {
  setup(`login as ${USERS[user].role} (${user})`, async ({ browser }) => {
    setup.setTimeout(240_000); // room for one throttle wait
    const file = authFile(user);
    if (fresh(file)) {
      const context = await browser.newContext({ storageState: file });
      const page = await context.newPage();
      await page.goto('/dashboard');
      const ok = /\/dashboard/.test(page.url());
      await context.close();
      if (ok) return;
    }
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginWithForm(page, user);
    await expect(page.getByTestId('dashboard-role')).toContainText(ROLE_LABELS[user]);
    expect(await page.evaluate(() => document.cookie)).not.toContain('session=');
    const session = (await context.cookies()).find((c) => c.name === 'session');
    expect(session?.httpOnly).toBe(true);
    await context.storageState({ path: file });
    await context.close();
  });
}
