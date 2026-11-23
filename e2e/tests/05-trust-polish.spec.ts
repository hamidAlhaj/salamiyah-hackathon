import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { contextFor, PHONE_VIEWPORT, SLUGS } from './helpers';

/**
 * P19 trust polish, on a fresh `npm run demo:reset` (runs after the other specs):
 * - a campaign's link preview: og:image points at the campaign's OG card (a 1200×630 PNG) and the
 *   share buttons are plain links (WhatsApp, Telegram, Facebook) + copy link;
 * - ADMIN history panels on the overdue case and on the campaign 03/04 changed, and the SLA alert
 *   (once per case);
 * - the beneficiary picker of a new campaign shows only the category's kind;
 * - the donor sees their donor code (D-XXXXXX);
 * - signed-in workspace pages fit a 375 px phone (no sideways scroll).
 */
test.describe.configure({ mode: 'serial' });

const SHOTS = process.env.E2E_SCREENSHOTS === '1';
async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  await page.screenshot({
    path: join(__dirname, '..', '..', 'docs', 'screenshots', 'p19', `${name}.png`),
    fullPage: true,
  });
}

// Seeded overdue case (backend/prisma/seed.ts): the API alerts case officers and admins once.
const OVERDUE_CASE = 'MF-2026-DEMO5';

test('guest: the campaign page carries the OG card and plain share links', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`/campaigns/${SLUGS.heart}`);
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(new RegExp(`/campaigns/${SLUGS.heart}/opengraph-image`));
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');

  // The card itself renders (same path on this server; og:image uses SITE_URL).
  const path = new URL(og ?? '').pathname;
  const image = await page.request.get(`${baseURL}${path}`);
  expect(image.ok()).toBeTruthy();
  expect(image.headers()['content-type']).toBe('image/png');
  expect((await image.body()).length).toBeGreaterThan(10_000);

  const share = page.getByTestId('share-buttons');
  await expect(share.locator('[data-share="whatsapp"]')).toHaveAttribute(
    'href',
    /^https:\/\/wa\.me\/\?text=/,
  );
  await expect(share.locator('[data-share="telegram"]')).toHaveAttribute(
    'href',
    /^https:\/\/t\.me\/share\/url\?url=/,
  );
  await expect(share.locator('[data-share="facebook"]')).toHaveAttribute(
    'href',
    /^https:\/\/www\.facebook\.com\/sharer\/sharer\.php\?u=/,
  );
  await shot(page, 'campaign-share');
  await context.close();
});

test('ADMIN: history panels on a campaign and the overdue case; the SLA alert arrived once', async ({
  browser,
}) => {
  const { context, page } = await contextFor(browser, 'admin');

  // The SLA alert in the bell's notification list, linking to the case.
  await page.goto('/dashboard/notifications');
  const alerts = page
    .getByTestId('notification-list')
    .locator('li')
    .filter({ hasText: OVERDUE_CASE });
  await expect(alerts).toHaveCount(1);
  await alerts.getByRole('link').first().click();
  await expect(page.getByTestId('case-page')).toBeVisible();

  const caseHistory = page.getByTestId('audit-history');
  await caseHistory.locator('summary').click();
  await expect(
    caseHistory.locator('[data-testid="audit-entry"][data-action="case.overdue_alert"]'),
  ).toHaveCount(1);
  await shot(page, 'case-history');

  // The roof campaign that 03/04 changed (own account number, pause/resume, edit, update).
  await page.goto('/dashboard/admin/campaigns');
  await page.locator(`tr[data-slug="${SLUGS.roof}"]`).getByTestId('manage-campaign').click();
  const history = page.getByTestId('audit-history');
  await history.locator('summary').click();
  for (const action of ['campaign.status', 'campaign.update', 'campaign.post_update']) {
    await expect(history.locator(`[data-action="${action}"]`).first()).toBeVisible();
  }
  // Masked even for ADMIN: no phone number reaches the panel.
  expect(await history.innerText()).not.toMatch(/\+?9639\d{8}/);
  await shot(page, 'campaign-history');
  await context.close();
});

test('STAFF never gets a history panel on a case', async ({ browser }) => {
  const { context, page } = await contextFor(browser, 'staff');
  await page.goto('/dashboard/cases');
  await page.locator(`tr[data-tracking="${OVERDUE_CASE}"]`).getByRole('link').click();
  await expect(page.getByTestId('case-page')).toBeVisible();
  await expect(page.getByTestId('audit-history')).toHaveCount(0);
  await context.close();
});

test('the new-campaign picker shows only the category’s beneficiary kind', async ({ browser }) => {
  const { context, page } = await contextFor(browser, 'admin');
  await page.goto('/dashboard/admin/campaigns/new');
  const picker = page.getByTestId('beneficiary-picker');

  await page.locator('[data-category-option="كفالة أيتام"]').click();
  await expect(page.getByTestId('beneficiary-kind-filter')).toHaveAttribute('data-kind', 'ORPHAN');
  const orphans = await picker.locator('li').allInnerTexts();
  expect(orphans.length).toBeGreaterThanOrEqual(12);
  for (const row of orphans) expect(row).toContain('يتيم');

  await page.locator('[data-category-option="ترميم منازل"]').click();
  await expect(page.getByTestId('beneficiary-kind-filter')).toHaveAttribute('data-kind', 'FAMILY');
  const families = await picker.locator('li').allInnerTexts();
  expect(families.length).toBeGreaterThanOrEqual(3);
  for (const row of families) expect(row).toContain('أسرة');
  await shot(page, 'picker-families');
  await context.close();
});

test('DONOR A sees their donor code in «تبرعاتي»', async ({ browser }) => {
  const { context, page } = await contextFor(browser, 'donor');
  await page.goto('/dashboard/donations');
  await expect(page.getByTestId('donor-code')).toHaveText(/^D-[0-9A-Z]{6}$/);
  await context.close();
});

test('signed-in workspace pages and the campaign page fit a 375 px phone', async ({ browser }) => {
  const { context, page } = await contextFor(browser, 'admin', { phone: true });
  for (const path of [
    '/dashboard',
    '/dashboard/admin/campaigns',
    '/dashboard/admin/categories',
    '/dashboard/admin/users',
    '/dashboard/cases',
    '/dashboard/outbox',
    '/',
    `/campaigns/${SLUGS.heart}`,
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} scrolls sideways at ${PHONE_VIEWPORT.width} px`).toBeLessThanOrEqual(0);
  }
  await page.goto('/dashboard/admin/campaigns');
  await shot(page, 'admin-375');
  await context.close();
});
