import { expect, test } from '@playwright/test';
import { API_URL, SLUGS } from './helpers';

test('a guest registers by phone and returns to the selected campaign donation', async ({ page, request }) => {
  const destination = `/campaigns/${SLUGS.roof}/donate`;
  await page.goto(destination);
  await page.getByTestId('donate-login').click();
  await page.locator('a[href^="/register"]').click();
  await expect(page).toHaveURL(/\/register\?next=/);
  await page.locator('[name="fullName"]').fill('متبرع تجريبي');
  await page.locator('[name="phone"]').fill('0999000271');
  await page.locator('[name="password"]').fill('Demo-Register-2026');
  await page.getByRole('button', { name: 'إنشاء الحساب', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(destination + '$'));

  const session = (await page.context().cookies()).find((cookie) => cookie.name === 'session');
  expect(session?.httpOnly).toBe(true);
  const me = await request.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${session?.value}` },
  });
  expect(me.ok()).toBe(true);
  expect((await me.json()).role).toBe('DONOR');
});
