import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { campaignId, contextFor, grouped, ledger, PNG, SLUGS, transparency } from './helpers';

/**
 * The judges' 7-step scenario (DEMO.md, 06 §5) on a fresh `npm run demo:reset`, each role in its
 * own browser context. Step 3 (DONOR A in the Expo app) runs the same simulated Syriatel Cash
 * payment through the web donate page; the app itself needs a phone (see DEMO.md).
 * It changes the database: reset it again before the live demo.
 */
test.describe.configure({ mode: 'serial' });

const SHOTS = process.env.E2E_SCREENSHOTS === '1';
async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  await page.screenshot({
    path: join(__dirname, '..', '..', 'docs', 'screenshots', 'p16', `${name}.png`),
    fullPage: true,
  });
}

// Opted-in alert donors: the demo donor + 2 fictional numbers (or 1 + the count of
// DEMO_WHATSAPP_NUMBERS when it is set in backend/.env).
const ALERT_DONORS = Number(process.env.E2E_ALERT_DONORS ?? 3);
const ORPHAN_CODES = Array.from({ length: 12 }, (_, i) => `B-04${12 + i}`);
const NEW_ORPHAN_TITLE = 'كفالة 12 يتيماً لعام 2027';
const thisYear = new Date().getFullYear();

const state: { orphanSlug?: string; incubatorSlug?: string; transferRef?: string } = {};

test('seed is fresh (run `npm run demo:reset` in backend/ first)', async ({ request }) => {
  const stats = await transparency(request);
  expect(stats.totals.verifiedAmount, 'reset the demo database first').toBe('39600000.00');
  expect(stats.campaigns.total).toBe(7);
});

test('step 1 — ADMIN creates «كفالة 12 يتيماً لعام 2027» with 12 anonymised orphans', async ({
  browser,
}) => {
  const { context, page } = await contextFor(browser, 'admin');
  await page.goto('/dashboard/admin/campaigns/new');
  const form = page.getByTestId('create-campaign-form');
  await form.locator('[data-category-option="كفالة أيتام"]').click();
  await form.locator('[name=titleAr]').fill(NEW_ORPHAN_TITLE);
  await form.locator('[name=titleEn]').fill('Sponsoring 12 orphans for 2027');
  await form
    .locator('[name=summaryAr]')
    .fill('كفالة شهرية لاثني عشر يتيماً من السلمية طوال عام 2027، تُصرف لأسرهم في نهاية كل شهر.');
  await form
    .locator('[name=summaryEn]')
    .fill('Monthly sponsorship for twelve orphans in Salamiyah throughout 2027.');
  await form.locator('[name=targetAmount]').fill('28800000');
  await form.locator('[name=area]').fill('السلمية');
  await form.locator('label:has(input[name=coverKey][value="orphans-2"])').click();
  await form.getByRole('searchbox').fill('B-04');
  for (const code of ORPHAN_CODES) {
    const row = form.locator('li', { has: page.locator(`input[data-code="${code}"]`) });
    await row.locator(`input[data-code="${code}"]`).check();
    await row.locator('input[name^="monthly_"]').fill('200000');
  }
  await shot(page, 'step1-admin-new-campaign');
  await form.locator('button[type=submit]').click();
  const link = page.locator('a[href^="/campaigns/"]', { hasText: '/campaigns/' });
  await expect(link).toBeVisible();
  state.orphanSlug = (await link.getAttribute('href'))?.replace('/campaigns/', '');
  expect(state.orphanSlug).toBeTruthy();

  // It appears on the public home next to the renovation and medical campaigns.
  await page.goto('/');
  await expect(page.locator('body')).toContainText(NEW_ORPHAN_TITLE);
  await page.goto(`/campaigns/${state.orphanSlug}`);
  await expect(page.getByTestId('beneficiaries')).toContainText('B-0412');
  await shot(page, 'step1-public-campaign');
  await context.close();
});

test('step 2 — CASE_OFFICER approves and publishes the incubator case; alerts fill the outbox', async ({
  browser,
}) => {
  const { context, page } = await contextFor(browser, 'caseOfficer');
  await page.goto('/dashboard/cases');
  await page.locator('tr[data-tracking="MF-2026-DEMO2"] a').click();
  const review = page.getByTestId('review-form');
  await review.locator('[name=hospitalId]').selectOption({ label: 'المشفى الوطني بالسلمية' });
  await review.locator('[name=doctorName]').fill('د. ريم (مثال)');
  await review.locator('button[type=submit]').click();

  const publish = page.getByTestId('publish-form');
  await expect(publish).toBeVisible();
  await publish.locator('[name=titleAr]').fill('حاضنة لمولود خديج');
  await publish.locator('[name=titleEn]').fill('Incubator care for a premature newborn');
  await publish
    .locator('[name=redactedSummary]')
    .fill(
      'مولود خديج يحتاج حاضنة لمدة ثلاثة أسابيع في المشفى الوطني. الأسرة غير قادرة على تغطية التكلفة.',
    );
  await publish
    .locator('[name=summaryEn]')
    .fill('A premature newborn needs three weeks of incubator care at the National Hospital.');
  await publish.locator('button[type=submit]').click();
  const campaignLink = page.getByTestId('case-campaign-link');
  await expect(campaignLink).toBeVisible();
  state.incubatorSlug = (await campaignLink.getAttribute('href'))?.replace('/campaigns/', '');
  await shot(page, 'step2-case-published');
  await context.close();

  // The urgent campaign alerts every opted-in donor through the WhatsApp outbox.
  const admin = await contextFor(browser, 'admin');
  await admin.page.goto('/dashboard/outbox');
  await expect(admin.page.getByTestId('outbox-list').locator('li')).toHaveCount(ALERT_DONORS);
  await expect(admin.page.getByTestId('outbox-list')).toContainText('حاضنة لمولود خديج');
  await shot(admin.page, 'step2-outbox');
  await admin.context.close();
});

test('step 3 — DONOR A pays with Syriatel Cash (Demo): instant notification, demo segment', async ({
  browser,
  request,
}) => {
  const slug = state.orphanSlug ?? SLUGS.sheikhBadr;
  const { context, page } = await contextFor(browser, 'donor', { phone: true });
  await page.goto(`/campaigns/${slug}/donate`);
  await page.locator('label[data-path="demo"]').click();
  await page.locator('label[data-method="SYRIATEL_CASH"]').click();
  await page.locator('#amount').fill('250000');
  await page.locator('#wallet-phone').fill('0933000000');
  await page.getByRole('button', { name: 'أرسل رمز التأكيد' }).click();
  await page.locator('#wallet-code').fill('246810');
  await page.getByTestId('demo-pay').click();
  await expect(page.getByTestId('donation-done')).toBeVisible();
  await shot(page, 'step3-demo-paid');

  await page.goto('/dashboard/notifications');
  await expect(page.getByTestId('notification-list').locator('li').first()).toBeVisible();
  await context.close();

  const l = await ledger(request, slug);
  expect(l.demoAmount).toBe('250000.00');
  expect(l.verifiedAmount).toBe('0.00');
});

test('step 4 — DONOR B (phone browser) transfers to the renovation campaign and uploads the receipt', async ({
  browser,
  request,
}) => {
  const { context, page } = await contextFor(browser, 'diaspora', { phone: true });
  await page.goto(`/campaigns/${SLUGS.roof}/donate`);
  await page.locator('label[data-path="transfer"]').click();
  await page.locator('label[data-method="BANK_TRANSFER"]').click();
  await page.locator('#amount').fill('750000');
  await page.getByTestId('transfer-create').click();
  const details = page.getByTestId('transfer-details');
  await expect(details).toContainText('SY00 0000 0000 0000 (FAKE)');
  state.transferRef = (await page.getByTestId('pledge-reference').innerText()).trim();
  await page.getByTestId('receipt-file').setInputFiles(PNG);
  await shot(page, 'step4-transfer-details');
  await page.getByTestId('receipt-form').locator('button[type=submit]').click();
  await expect(page.getByTestId('donation-done')).toBeVisible();
  await shot(page, 'step4-receipt-uploaded');
  await context.close();

  const l = await ledger(request, SLUGS.roof);
  expect(l.pendingAmount).toBe('1000000.00'); // 250,000 council cash + 750,000 transfer
});

test('step 5 — COLLECTOR confirms cash at the collection point (phone PWA)', async ({
  browser,
  request,
}) => {
  const { context, page } = await contextFor(browser, 'collector', { phone: true });
  await page.goto('/dashboard/collector');
  const item = page.locator('li[data-reference="P-SD0032"]');
  await expect(item).toContainText(grouped(200_000));
  // The OFFICE point belongs to another collector: its pledge is not listed here.
  await expect(page.locator('li[data-reference="P-SD0034"]')).toHaveCount(0);
  await item.getByTestId('confirm-received').click();
  await page.getByRole('dialog').getByRole('button', { name: 'تأكيد الاستلام' }).click();
  await expect(page.locator('body')).toContainText('تم تأكيد استلام P-SD0032');
  await shot(page, 'step5-collector-confirmed');
  await context.close();

  const l = await ledger(request, SLUGS.heart);
  expect(l.pendingAmount).toBe('1200000.00'); // 1,000,000 transfer + 200,000 cash
});

test('step 6 — FINANCE verifies the transfer and the cash: official receipts with QR', async ({
  browser,
  request,
}) => {
  const ref = state.transferRef;
  expect(ref).toBeTruthy();
  const { context, page } = await contextFor(browser, 'finance');
  await page.goto('/dashboard/finance');
  await shot(page, 'step6-finance-queue');
  for (const [reference, no] of [
    [ref as string, 29],
    ['P-SD0032', 30],
  ] as const) {
    await page.getByTestId(`approve-${reference}`).locator('button[type=submit]').click();
    await expect(page.locator('body')).toContainText(
      `R-${thisYear}-${String(no).padStart(6, '0')}`,
    );
  }
  await context.close();

  expect((await ledger(request, SLUGS.roof)).verifiedAmount).toBe('5750000.00');
  expect((await ledger(request, SLUGS.heart)).verifiedAmount).toBe('7200000.00');

  const guest = await browser.newContext();
  const receipt = await guest.newPage();
  await receipt.goto(`/receipts/R-${thisYear}-000029`);
  await expect(receipt.getByTestId('receipt-qr')).toBeVisible();
  await expect(receipt.getByTestId('receipt-amount')).toContainText(grouped(750_000));
  await shot(receipt, 'step6-official-receipt');
  await guest.close();
});

test('step 7 — FINANCE records spending; the public transparency dashboard shows it all', async ({
  browser,
  request,
}) => {
  const { context, page } = await contextFor(browser, 'finance');
  await page.goto(`/dashboard/spending/${await campaignId(request, SLUGS.roof)}`);
  const form = page.getByTestId('expenditure-form');
  await form.locator('label[data-payee="CONTRACTOR"]').click();
  await form.locator('[name=payeeLabel]').fill('ورشة الأمانة للترميم (مثال)');
  await form.locator('[name=amount]').fill('2000000');
  await form.locator('[name=description]').fill('دفعة أولى لأعمال عزل وترميم السقف');
  await form.getByTestId('proof-file').setInputFiles(PNG);
  await form.getByTestId('proof-public').check();
  await form.locator('button[type=submit]').click();
  await expect(page.getByTestId('staff-expenditures')).toContainText('ورشة الأمانة للترميم');

  await page.goto(`/dashboard/spending/${await campaignId(request, SLUGS.sheikhBadr)}`);
  await page.getByTestId('monthly-form').locator('button[type=submit]').click();
  await expect(page.getByTestId('month-paid-note')).toBeVisible();
  await shot(page, 'step7-monthly-paid');
  await context.close();

  expect((await ledger(request, SLUGS.roof)).spentAmount).toBe('3800000.00');
  expect((await ledger(request, SLUGS.sheikhBadr)).spentAmount).toBe('4800000.00');

  const stats = await transparency(request);
  expect(stats.totals).toMatchObject({
    verifiedAmount: '40550000.00',
    spentAmount: '21100000.00',
    remainingAmount: '19450000.00',
    pendingAmount: '1550000.00',
    demoAmount: '1550000.00',
  });
  expect(stats.beneficiaries.total).toBe(29);
  expect(stats.campaigns).toEqual({ active: 6, funded: 2, completed: 1, total: 9 });

  const guest = await browser.newContext();
  const pub = await guest.newPage();
  await pub.goto('/transparency');
  await expect(pub.getByTestId('transparency-hero')).toContainText(grouped(40_550_000));
  await expect(pub.getByTestId('transparency-hero')).toContainText(grouped(21_100_000));
  await expect(pub.getByTestId('recent-spending')).toContainText('ورشة الأمانة للترميم');
  const html = await pub.content();
  for (const s of ['ر. ح.', 'م. ع.', 'مستفيد B-', '933100']) expect(html).not.toContain(s);
  await shot(pub, 'step7-transparency');
  await guest.close();
});
