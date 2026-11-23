import { expect, test, type Page } from '@playwright/test';
import { API_URL, grouped, loginWithForm, ROLE_LABELS, SLUGS, transparency } from './helpers';

/**
 * Public pages on a fresh `npm run demo:reset`, as a guest: the seeded numbers, every campaign,
 * the completed campaign with public proofs, a verifiable receipt, and no beneficiary identity or
 * phone number anywhere public.
 */

// Private beneficiary fields from the seed (names, phones, national IDs) that must never be public.
const PRIVATE = [
  'م. ع.',
  'ر. ح.',
  'أبو سمير',
  'أم خالد',
  'س. ن.',
  'مستفيد B-',
  '933100',
  '04010100',
];
// Donor and council phone numbers from the seed.
const PHONES = ['955000', '900000006', '4915100000007', '999900001', '+9639'];

async function expectNoPrivateData(page: Page) {
  const html = await page.content();
  for (const s of [...PRIVATE, ...PHONES]) expect(html, `leaked "${s}"`).not.toContain(s);
}

test.describe('public pages (guest)', () => {
  test('home shows the platform totals and all seven campaigns', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(grouped(39_600_000));
    for (const slug of Object.values(SLUGS)) {
      await expect(page.locator(`a[href="/campaigns/${slug}"]`).first()).toBeVisible();
    }
    await expectNoPrivateData(page);
  });

  test('every seeded campaign shows its campaign account', async ({ page }) => {
    const verified: Record<string, number> = {
      [SLUGS.sheikhBadr]: 5_200_000,
      [SLUGS.jammasa]: 10_800_000,
      [SLUGS.roof]: 5_000_000,
      [SLUGS.rain]: 6_000_000,
      [SLUGS.heart]: 7_000_000,
      [SLUGS.medication]: 2_400_000,
      [SLUGS.chemo]: 3_200_000,
    };
    for (const [slug, amount] of Object.entries(verified)) {
      await page.goto(`/campaigns/${slug}`);
      await expect(page.getByTestId('campaign-ledger')).toContainText(grouped(amount));
      await expect(page.getByTestId('beneficiaries')).toContainText('B-0');
      await expectNoPrivateData(page);
    }
  });

  test('the completed campaign («تم الإنجاز») shows its public proofs', async ({ page }) => {
    await page.goto(`/campaigns/${SLUGS.rain}`);
    await expect(page.getByTestId('completed-banner')).toBeVisible();
    await expect(page.getByTestId('spending-timeline')).toContainText('ورشة ترميم');
    await expect(page.getByTestId('public-proof').first()).toBeVisible();
    // Completed: no donate button.
    await expect(page.getByTestId('donate-cta')).toHaveCount(0);
  });

  test('the roof campaign shows its own receiving account (per-campaign override)', async ({
    page,
  }) => {
    await page.goto(`/campaigns/${SLUGS.roof}`);
    await expect(page.getByTestId('receiving-accounts')).toContainText('0930 000 099 (FAKE)');
  });

  test('transparency dashboard: totals, demo apart, beneficiaries without identities', async ({
    page,
    request,
  }) => {
    const stats = await transparency(request);
    expect(stats.totals).toMatchObject({
      verifiedAmount: '39600000.00',
      spentAmount: '18300000.00',
      remainingAmount: '21300000.00',
      pendingAmount: '1550000.00',
      demoAmount: '1300000.00',
    });
    expect(stats.beneficiaries.total).toBe(16);
    expect(stats.campaigns).toEqual({ active: 4, funded: 2, completed: 1, total: 7 });

    await page.goto('/transparency');
    const hero = page.getByTestId('transparency-hero');
    await expect(hero).toContainText(grouped(39_600_000));
    await expect(hero).toContainText(grouped(18_300_000));
    await expect(page.getByTestId('transparency-page')).toContainText(grouped(1_300_000));
    await expectNoPrivateData(page);
  });

  test('the first official receipt is public and verifiable', async ({ page }) => {
    const now = new Date();
    const year = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 3),
    ).getUTCFullYear();
    await page.goto(`/receipts/R-${year}-000001`);
    await expect(page.getByTestId('official-receipt')).toBeVisible();
    await expect(page.getByTestId('receipt-qr')).toBeVisible();
    await expect(page.getByTestId('receipt-amount')).toContainText(grouped(1_500_000));
    await expectNoPrivateData(page);
  });

  test('public API endpoints never return identity fields', async ({ request }) => {
    const bodies: string[] = [];
    const list = await request.get(`${API_URL}/campaigns`);
    bodies.push(await list.text());
    for (const slug of Object.values(SLUGS)) {
      const c = await request.get(`${API_URL}/campaigns/${slug}`);
      const text = await c.text();
      bodies.push(text);
      const { id } = JSON.parse(text) as { id: string };
      for (const path of [
        'ledger',
        'beneficiaries',
        'spending',
        'transparency',
        'payment-accounts',
      ]) {
        const r = await request.get(`${API_URL}/campaigns/${id}/${path}`);
        if (r.ok()) bodies.push(await r.text());
      }
    }
    bodies.push(await (await request.get(`${API_URL}/stats/transparency`)).text());
    for (const body of bodies) {
      for (const s of [...PRIVATE, ...PHONES, 'fullName', 'nationalId', '"phone"']) {
        expect(body, `public API leaked "${s}"`).not.toContain(s);
      }
    }
  });
});

// Optional: the LAN demo (production build over plain HTTP, SESSION_COOKIE_SECURE="false").
// Run with E2E_LAN_URL=http://<LAN-IP>:3000.
test('login over the LAN address keeps the session (SESSION_COOKIE_SECURE)', async ({
  browser,
}) => {
  const lan = process.env.E2E_LAN_URL;
  test.skip(!lan, 'set E2E_LAN_URL=http://<LAN-IP>:3000 to check the LAN demo');
  test.setTimeout(240_000); // room for one login-throttle wait
  const context = await browser.newContext({ baseURL: lan });
  const page = await context.newPage();
  await loginWithForm(page, 'staff');
  await expect(page.getByTestId('dashboard-role')).toContainText(ROLE_LABELS.staff);
  const session = (await context.cookies()).find((c) => c.name === 'session');
  expect(session?.httpOnly).toBe(true);
  await context.close();
});
