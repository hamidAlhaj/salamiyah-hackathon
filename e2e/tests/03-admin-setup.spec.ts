import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { campaignId, contextFor, loginWithPhone, PASSWORD, PHONE_VIEWPORT, SLUGS } from './helpers';

/**
 * P17 admin setup on a fresh `npm run demo:reset` (runs after the scenario): ADMIN adds a collection
 * point, creates a collector and assigns the point; the collector sees it in the PWA. ADMIN gives
 * a campaign its own Syriatel Cash number; the campaign and donate pages show it.
 * It changes the database: reset it again before the live demo.
 */
test.describe.configure({ mode: 'serial' });

const SHOTS = process.env.E2E_SCREENSHOTS === '1';
async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  await page.screenshot({
    path: join(__dirname, '..', '..', 'docs', 'screenshots', 'p17', `${name}.png`),
    fullPage: true,
  });
}

// Fictional test data (never a real number).
const POINT = {
  name: 'نقطة جمع حي السبيل',
  area: 'حي السبيل',
  contact: 'أبو علي (مثال)',
};
const COLLECTOR = {
  name: 'مكي نقطة السبيل',
  phone: '0900000099',
  e164: '+963900000099',
};
const OVERRIDE = {
  name: 'صندوق كفالة الشيخ بدر (مثال)',
  number: '0930 000 777 (FAKE)',
};

test('ADMIN adds a collection point (type, area, contact person)', async ({ browser }) => {
  const { context, page } = await contextFor(browser, 'admin');
  await page.goto('/dashboard/admin/collection-points');
  const form = page.getByTestId('point-create-form');
  await form.locator('#cp-new-name').fill(POINT.name);
  await form.locator('#cp-new-type').selectOption('SHOP');
  await form.locator('#cp-new-area').fill(POINT.area);
  await form.locator('#cp-new-contact').fill(POINT.contact);
  await form.locator('button[type=submit]').click();
  const row = page.locator(`[data-testid="point-row"][data-name="${POINT.name}"]`);
  await expect(row).toContainText(POINT.area);
  await expect(row).toContainText('محل');
  await expect(row).toContainText('لا يوجد مكي');
  await shot(page, 'collection-points');
  await context.close();
});

test('ADMIN creates a collector, then assigns the new point', async ({ browser }) => {
  const { context, page } = await contextFor(browser, 'admin');
  await page.goto('/dashboard/admin/users');
  const create = page.getByTestId('user-create-form');
  await create.locator('#user-new-name').fill(COLLECTOR.name);
  await create.locator('#user-new-phone').fill(COLLECTOR.phone);
  await create.locator('#user-new-password').fill(PASSWORD);
  await expect(create.locator('#user-new-role')).toHaveValue('COLLECTOR');
  await create.locator('button[type=submit]').click();

  const row = page.locator(`[data-testid="user-row"][data-phone="${COLLECTOR.e164}"]`);
  await expect(row).toContainText(COLLECTOR.name);
  await expect(row.getByTestId('user-points-list')).toContainText('لم تُسند له أي نقطة بعد');

  await row.locator('summary').click();
  const edit = row.getByTestId('user-edit-form');
  await edit.getByLabel(POINT.name).check();
  await edit.locator('button[type=submit]').click();
  await expect(row.getByTestId('user-points-list')).toContainText(POINT.name);
  // After the save the form still shows the saved role (React resets action forms).
  await expect(edit.locator('select[name="role"]')).toHaveValue('COLLECTOR');
  await expect(edit.getByLabel(POINT.name)).toBeChecked();
  await shot(page, 'users-collector-assigned');

  // The point now lists its collector.
  await page.goto('/dashboard/admin/collection-points');
  await expect(page.locator(`[data-testid="point-row"][data-name="${POINT.name}"]`)).toContainText(
    COLLECTOR.name,
  );
  await context.close();
});

test('the new collector signs in and sees only that point in the PWA', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: PHONE_VIEWPORT,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await loginWithPhone(page, COLLECTOR.phone, 'P17 collector');
  await page.goto('/dashboard/collector');
  const points = page.getByTestId('my-points');
  await expect(points).toContainText(POINT.name);
  // The seeded collector's points are not theirs.
  await expect(points).not.toContainText('الحي الشمالي');
  await shot(page, 'collector-pwa-new-point');
  await context.close();
});

test('ADMIN gives a campaign its own Syriatel Cash number', async ({ browser, request }) => {
  const id = await campaignId(request, SLUGS.sheikhBadr);
  const { context, page } = await contextFor(browser, 'admin');
  await page.goto(`/dashboard/admin/payment-methods?campaign=${id}`);
  const card = page.getByTestId('override-SYRIATEL_CASH');
  await expect(card.getByTestId('current-number')).toContainText('0930 000 002 (FAKE)');
  await card.locator('summary').click();
  await card.locator('#ov-SYRIATEL_CASH-name').fill(OVERRIDE.name);
  await card.locator('#ov-SYRIATEL_CASH-number').fill(OVERRIDE.number);
  await card.getByTestId('override-form-SYRIATEL_CASH').locator('button[type=submit]').click();
  await expect(card.getByTestId('current-number')).toContainText(OVERRIDE.number);
  await expect(card).toContainText('خاص بالحملة');
  await shot(page, 'payment-methods-override');
  await context.close();
});

test('the campaign and its donate page show the campaign number', async ({ page, browser }) => {
  await page.goto(`/campaigns/${SLUGS.sheikhBadr}`);
  await expect(page.getByTestId('receiving-accounts')).toContainText(OVERRIDE.number);

  const { context, page: donor } = await contextFor(browser, 'donor');
  await donor.goto(`/campaigns/${SLUGS.sheikhBadr}/donate`);
  await donor.locator('label[data-path="transfer"]').click();
  await donor.locator('label[data-method="SYRIATEL_CASH"]').click();
  await donor.locator('#amount').fill('50000');
  await donor.getByTestId('transfer-create').click();
  await expect(donor.getByTestId('transfer-details')).toContainText(OVERRIDE.number);
  await shot(donor, 'donate-page-override');
  await context.close();
});
