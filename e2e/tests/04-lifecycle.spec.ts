import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { API_URL, contextFor, PNG, SLUGS } from './helpers';

/**
 * P18 campaign lifecycle and the beneficiary violations log, on a fresh `npm run demo:reset`
 * (runs after the scenario and the admin setup):
 * - ADMIN pauses donations on a campaign → the public page and the donate page refuse → resume.
 * - ADMIN changes the cover and the summary and posts a public update → the public page shows them.
 * - ADMIN places a beneficiary on administrative hold → intake for that national ID gets only the
 *   generic error (nothing reveals the hold) → reactivate → the same intake works.
 * It changes the database: reset it again before the live demo.
 */
test.describe.configure({ mode: 'serial' });

const SHOTS = process.env.E2E_SCREENSHOTS === '1';
async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  await page.screenshot({
    path: join(__dirname, '..', '..', 'docs', 'screenshots', 'p18', `${name}.png`),
    fullPage: true,
  });
}

const SLUG = SLUGS.roof;
const NEW_SUMMARY = 'ترميم سقف منزل أسرة في حي البعث تضرر من أمطار الشتاء، مع عزل مائي كامل.';
const UPDATE = 'وصلت مواد العزل إلى الموقع وبدأ العمل هذا الأسبوع.';
// Seeded overdue case MF-2026-DEMO5 (fictional national ID, see api/prisma/seed.ts).
const HELD = { code: 'B-0105', nationalId: '04010100205' };
const GENERIC_REFUSAL = 'تعذّر تسجيل الطلب. راجع المجلس المحلي.';

async function openManagePage(page: Page) {
  await page.goto('/dashboard/admin/campaigns?status=ACTIVE');
  await page.locator(`tr[data-slug="${SLUG}"]`).getByTestId('manage-campaign').click();
  await expect(page.getByTestId('campaign-manage-page')).toBeVisible();
}

async function publicAccepts(slug: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/campaigns/${slug}`);
  return ((await res.json()) as { acceptsPledges: boolean }).acceptsPledges;
}

test('ADMIN pauses donations: the public campaign and donate pages refuse', async ({ browser }) => {
  const { context, page } = await contextFor(browser, 'admin');
  await openManagePage(page);
  await page.getByTestId('lifecycle-pause').locator('button[type=submit]').click();
  await expect(page.getByTestId('donations-state')).toHaveText(/التبرعات متوقفة/);
  await expect(page.getByTestId('lifecycle-resume')).toBeVisible();
  await shot(page, 'manage-paused');
  expect(await publicAccepts(SLUG)).toBe(false);

  // The paused tab lists it.
  await page.goto('/dashboard/admin/campaigns?status=paused');
  await expect(page.locator(`tr[data-slug="${SLUG}"]`)).toBeVisible();
  await shot(page, 'tabs-paused');
  await context.close();

  const donor = await contextFor(browser, 'donor');
  await donor.page.goto(`/campaigns/${SLUG}`);
  await expect(donor.page.getByTestId('donate-cta')).toHaveCount(0);
  await donor.page.goto(`/campaigns/${SLUG}/donate`);
  await expect(donor.page.getByText('الحملة لا تستقبل تبرعات حالياً.')).toBeVisible();
  await shot(donor.page, 'donate-blocked');
  await donor.context.close();
});

test('ADMIN resumes donations: the donate button is back', async ({ browser }) => {
  const { context, page } = await contextFor(browser, 'admin');
  await openManagePage(page);
  await page.getByTestId('lifecycle-resume').locator('button[type=submit]').click();
  await expect(page.getByTestId('donations-state')).toHaveText(/التبرعات مفتوحة/);
  expect(await publicAccepts(SLUG)).toBe(true);
  await page.goto(`/campaigns/${SLUG}`);
  await expect(page.getByTestId('donate-cta')).toBeVisible();
  await context.close();
});

test('ADMIN edits cover and summary and posts an update; the public page shows them', async ({
  browser,
}) => {
  const { context, page } = await contextFor(browser, 'admin');
  await openManagePage(page);
  const form = page.getByTestId('campaign-edit-form');
  await form.locator('#edit-summaryAr').fill(NEW_SUMMARY);
  await form.locator('label[data-cover="community-1"]').click();
  await form.locator('button[type=submit]').click();
  await expect(page.getByText('حُفظت التعديلات على الحملة.')).toBeVisible();
  // React resets action forms: the reloaded form shows the saved values.
  await expect(form.locator('#edit-summaryAr')).toHaveValue(NEW_SUMMARY);
  await expect(form.locator('input[value="community-1"]')).toBeChecked();

  const post = page.getByTestId('campaign-update-form');
  await post.locator('#update-bodyAr').fill(UPDATE);
  await post.locator('button[type=submit]').click();
  await expect(page.getByTestId('campaign-update').first()).toContainText(UPDATE);
  await shot(page, 'manage-edited');

  await page.goto(`/campaigns/${SLUG}`);
  await expect(page.getByText(NEW_SUMMARY).first()).toBeVisible();
  await expect(page.getByText(UPDATE)).toBeVisible();
  const detail = (await (await fetch(`${API_URL}/campaigns/${SLUG}`)).json()) as {
    coverKey: string;
  };
  expect(detail.coverKey).toBe('community-1');
  await context.close();
});

/** Fills the STAFF intake form for the held beneficiary (fictional data). */
async function submitIntake(page: Page) {
  await page.goto('/dashboard/intake');
  const form = page.getByTestId('intake-form');
  await form.getByLabel('اسم المستفيد').fill('س. ن.');
  await form.getByLabel('هاتف المستفيد').fill('0933100205');
  await form.getByLabel('الرقم الوطني (يُخزَّن مشفّراً)').fill(HELD.nationalId);
  await form.getByLabel('المجلس المحلي').fill('السلمية');
  await form.getByLabel('الوصف').fill('مراجعة بعد عملية تثبيت الحوض، تحتاج جلسات علاج فيزيائي.');
  await form.getByLabel('المبلغ التقديري (ل.س)').fill('900000');
  await form.getByLabel('التقرير الطبي (صورة أو PDF)').setInputFiles(PNG);
  await form.locator('button[type=submit]').click();
}

async function setHold(page: Page, reason: string) {
  await page.goto(`/dashboard/admin/beneficiaries?q=${HELD.code}`);
  const row = page.locator(`[data-testid="beneficiary-row"][data-code="${HELD.code}"]`);
  const hold = row.getByTestId('beneficiary-hold');
  if (!(await hold.evaluate((el) => (el as HTMLDetailsElement).open))) {
    await hold.locator('summary').click();
  }
  await hold.getByRole('textbox').fill(reason);
  await hold.locator('button[type=submit]').click();
  return row;
}

test('ADMIN holds a beneficiary: intake gets only the generic error; reactivate → intake works', async ({
  browser,
}) => {
  const admin = await contextFor(browser, 'admin');
  const row = await setHold(admin.page, 'طلب المساعدة نفسها من مكتبين في الشهر نفسه.');
  await expect(row).toContainText('موقوف');
  await row.getByTestId('beneficiary-log').locator('summary').click();
  await expect(row.locator('[data-kind="SUSPENDED"]')).toContainText('مكتبين');
  await shot(admin.page, 'beneficiary-held');

  const staff = await contextFor(browser, 'staff');
  await submitIntake(staff.page);
  const alert = staff.page.getByTestId('intake-form').getByRole('alert');
  await expect(alert).toHaveText(GENERIC_REFUSAL);
  await expect(staff.page.getByTestId('intake-result')).toHaveCount(0);
  // Nothing on the intake screen or in the registry reveals the hold to intake staff.
  for (const word of ['موقوف', 'إيقاف', 'مشبوه', 'مراقبة', 'suspend']) {
    expect(await staff.page.locator('body').innerText()).not.toContain(word);
  }
  await shot(staff.page, 'intake-generic-error');
  await staff.page.goto(`/dashboard/admin/beneficiaries?q=${HELD.code}`);
  await expect(staff.page.getByTestId('beneficiary-row')).toHaveCount(1);
  expect(await staff.page.getByTestId('beneficiary-list').innerText()).not.toContain('موقوف');

  const back = await setHold(admin.page, 'راجعت لجنة الرعاية الملف وأُغلقت الملاحظة.');
  await expect(back.getByTestId('beneficiary-log')).toContainText('(2)');
  await expect(back.locator('span', { hasText: /^موقوف$/ })).toHaveCount(0);
  await admin.context.close();

  await submitIntake(staff.page);
  await expect(staff.page.getByTestId('intake-result')).toContainText('رقم التتبع');
  await shot(staff.page, 'intake-after-reactivate');
  await staff.context.close();
});
