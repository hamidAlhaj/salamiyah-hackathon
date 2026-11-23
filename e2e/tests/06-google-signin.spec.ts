import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { API_URL, SLUGS } from './helpers';

/**
 * P22 Sign in with Google, on a fresh `npm run demo:reset` with Google NOT configured (no GOOGLE_*
 * keys in api/.env, the default):
 * - the login page shows no Google button and the Google routes are off (404 / login notice);
 * - the seeded Google donor without a phone is refused on every donate endpoint (`phone_required`),
 *   sees the "add your phone" notice instead of the donate flow, adds a phone on «ملفي», and can
 *   then donate. Real Google cannot run here, so that donor's session is signed locally with the
 *   API's JWT_SECRET (read from E2E_JWT_SECRET or api/.env, never printed): the same token the API
 *   issues after a Google sign-in.
 */
test.describe.configure({ mode: 'serial' });

/** Seeded in api/prisma/seed.ts (GOOGLE_DEMO_DONOR_ID): DONOR, Google-linked, no phone, no password. */
const GOOGLE_DONOR_ID = '22222222-0000-4000-8000-000000000022';
/** Fictional number the test saves on the profile (not used by the seed). */
const NEW_PHONE = '0999000222';

function jwtSecret(): string {
  if (process.env.E2E_JWT_SECRET) return process.env.E2E_JWT_SECRET;
  const env = readFileSync(join(__dirname, '..', '..', 'api', '.env'), 'utf8');
  const match = env.match(/^JWT_SECRET\s*=\s*"?([^"\r\n]+)"?/m);
  if (!match) throw new Error('JWT_SECRET not found (set E2E_JWT_SECRET)');
  return match[1];
}

/** HS256 token shaped like the API's own (sub + role, 8h), for the seeded Google donor. */
function googleDonorToken(): string {
  const b64 = (v: object) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    sub: GOOGLE_DONOR_ID,
    role: 'DONOR',
    iat: now,
    exp: now + 8 * 3600,
  })}`;
  return `${body}.${createHmac('sha256', jwtSecret()).update(body).digest('base64url')}`;
}

test('Google not configured: no button, the Google routes are off', async ({
  browser,
  request,
}) => {
  const config = await (await request.get(`${API_URL}/auth/google/enabled`)).json();
  test.skip(config.enabled === true, 'Google is configured in api/.env');
  expect(config).toEqual({ enabled: false, callbackOrigin: null });

  const start = await request.get(`${API_URL}/auth/google?state=${'S'.repeat(43)}`, {
    maxRedirects: 0,
  });
  expect(start.status()).toBe(404);
  expect((await start.json()).message).toBe('google_sign_in_disabled');
  const exchange = await request.get(`${API_URL}/auth/google/callback?code=x`);
  expect(exchange.status()).toBe(404);

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/login');
  await expect(page.getByLabel('رقم الهاتف')).toBeVisible();
  await expect(page.getByTestId('google-signin')).toHaveCount(0);
  await expect(page.getByText('المتابعة باستخدام Google')).toHaveCount(0);

  // Opening the start route by hand goes back to the login page with a notice.
  await page.goto('/auth/google/start');
  await expect(page).toHaveURL(/\/login\?google=unavailable$/);
  await expect(page.getByTestId('google-notice')).toContainText('غير متاح');
  // A callback without the state cookie is refused before anything reaches the API.
  await page.goto('/auth/google/callback?code=forged&state=' + 'S'.repeat(43));
  await expect(page).toHaveURL(/\/login\?google=expired$/);
  await context.close();
});

test('a Google donor without a phone is refused on every donate path (phone_required)', async ({
  request,
}) => {
  const token = googleDonorToken();
  const headers = { Authorization: `Bearer ${token}` };
  const me = await (await request.get(`${API_URL}/auth/me`, { headers })).json();
  expect(me).toMatchObject({ id: GOOGLE_DONOR_ID, role: 'DONOR', phone: null, googleLinked: true });

  const campaign = await (await request.get(`${API_URL}/campaigns/${SLUGS.roof}`)).json();
  const points = await (await request.get(`${API_URL}/collection-points/active`)).json();
  const base = { campaignId: campaign.id, amount: '50000' };
  const attempts = [
    ['/pledges', { ...base, method: 'BEMO_TRANSFER' }],
    ['/pledges/demo', { ...base, method: 'SHAM_CASH' }],
    ['/pledges/cash', { ...base, collectionPointId: points[0].id }],
  ] as const;
  for (const [path, data] of attempts) {
    const res = await request.post(`${API_URL}${path}`, { headers, data });
    expect(res.status(), path).toBe(403);
    expect((await res.json()).message, path).toBe('phone_required');
  }
  const mine = await (await request.get(`${API_URL}/pledges/mine`, { headers })).json();
  expect(mine).toEqual([]);
});

test('the donor adds a phone on «ملفي» and can then donate', async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  await context.addCookies([
    { name: 'session', value: googleDonorToken(), url: baseURL ?? 'http://localhost:3000' },
  ]);
  const page = await context.newPage();

  const donate = `/campaigns/${SLUGS.roof}/donate`;
  await page.goto(donate);
  await expect(page.getByTestId('phone-required')).toContainText('أضف رقم هاتفك أولاً');
  await expect(page.getByTestId('step-path')).toHaveCount(0);

  await page.getByTestId('add-phone').click();
  await expect(page).toHaveURL(/\/dashboard\/profile\?next=/);
  await expect(page.getByTestId('current-phone')).toHaveText('لم يُضف بعد');
  await expect(page.getByTestId('phone-required')).toBeVisible();
  await expect(page.getByTestId('continue-donating')).toHaveCount(0);

  await page.getByTestId('phone-form').getByLabel('رقم الهاتف').fill(NEW_PHONE);
  await page.getByTestId('whatsapp-opt-in').check();
  await page.getByRole('button', { name: 'حفظ رقم الهاتف' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'حُفظ رقم الهاتف.' })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('current-phone')).toHaveText('+963999000222');
  await expect(page.getByTestId('phone-required')).toHaveCount(0);
  await expect(page.getByTestId('whatsapp-opt-in')).toBeChecked();

  await page.getByTestId('continue-donating').click();
  await expect(page).toHaveURL(new RegExp(`${donate}$`));
  await expect(page.getByTestId('phone-required')).toHaveCount(0);
  await expect(page.getByTestId('step-path')).toBeVisible();
  await context.close();
});
