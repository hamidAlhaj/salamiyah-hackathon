import { deflateSync } from 'node:zlib';
import { expect, test } from '@playwright/test';
import {
  API_URL,
  campaignId,
  contextFor,
  ledger,
  num,
  SLUGS,
  transparency,
} from './helpers';

/**
 * The general council fund and surplus allocation (docs/fund-contract.md), on top of the demo seed and
 * after specs 01–06. Runs last: it fills the roof campaign to its target.
 */
test.describe.configure({ mode: 'serial' });

const FUND = 'general-fund';

/** A receipt image of its own: the API refuses a receipt already uploaded for another pledge. */
function uniquePng(): { name: string; mimeType: string; buffer: Buffer } {
  const w = 16;
  const h = 16;
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const seed = Date.now();
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      raw.set([(seed + x) & 255, (seed >> 8) & 255, (y * 16) & 255], y * (w * 3 + 1) + 1 + x * 3);
  const buffer = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return { name: 'fund-receipt.png', mimeType: 'image/png', buffer };
}
const SURPLUS = 20_000;

async function remaining(request: Parameters<typeof ledger>[0], slug: string): Promise<number> {
  const id = await campaignId(request, slug);
  const res = await request.get(`${API_URL}/campaigns/${id}/allocation?amount=1`);
  expect(res.ok()).toBeTruthy();
  const preview = (await res.json()) as { remaining: string | null };
  return num(preview.remaining ?? '0');
}

test('the fund has its own call to action and page, without a target', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-fund-cta')).toHaveAttribute(
    'href',
    `/campaigns/${FUND}/donate`,
  );
  await page.goto(`/campaigns/${FUND}`);
  await expect(page.getByTestId('fund-no-target')).toBeVisible();
  await expect(page.locator('[data-ledger="target"]')).toHaveCount(0);
});

test('cancel in the surplus notice creates no record', async ({ browser, request }) => {
  const { context, page } = await contextFor(browser, 'donor');
  const pendingBefore = (await ledger(request, SLUGS.chemo)).pendingAmount;
  const need = await remaining(request, SLUGS.chemo);
  await page.goto(`/campaigns/${SLUGS.chemo}/donate`);
  await page.locator('label[data-path="transfer"]').click();
  await page.locator('label[data-method="BEMO_TRANSFER"]').click();
  await page.locator('#amount').fill(String(need + SURPLUS));
  await page.getByTestId('transfer-create').click();
  const notice = page.getByTestId('allocation-notice');
  await expect(notice).toHaveAttribute('data-state', 'SURPLUS');
  await expect(notice).toBeFocused();
  await notice.getByTestId('allocation-cancel').click();
  await expect(notice).toHaveCount(0);
  await expect(page.getByTestId('transfer-details')).toHaveCount(0);
  expect((await ledger(request, SLUGS.chemo)).pendingAmount).toBe(pendingBefore);
  await context.close();
});

test('surplus SPLIT: the campaign gets what it needs, the fund the rest, the platform counts it once', async ({
  browser,
  request,
}) => {
  const need = await remaining(request, SLUGS.roof);
  expect(need).toBeGreaterThan(0);
  const offered = need + SURPLUS;
  const roofBefore = num((await ledger(request, SLUGS.roof)).verifiedAmount);
  const fundBefore = num((await ledger(request, FUND)).verifiedAmount);
  const totalBefore = num((await transparency(request)).totals.verifiedAmount);

  // Donor: transfer more than the remaining need → notice → full amount with the split.
  const { context, page } = await contextFor(browser, 'donor');
  await page.goto(`/campaigns/${SLUGS.roof}/donate`);
  await page.locator('label[data-path="transfer"]').click();
  await page.locator('label[data-method="BEMO_TRANSFER"]').click();
  await page.locator('#amount').fill(String(offered));
  await page.getByTestId('transfer-create').click();
  await expect(page.getByTestId('allocation-notice')).toHaveAttribute('data-state', 'SURPLUS');
  await page.getByTestId('allocation-split').click();
  await expect(page.getByTestId('transfer-details')).toBeVisible();
  const ref = (await page.getByTestId('pledge-reference').innerText()).trim();
  await page.getByTestId('receipt-file').setInputFiles(uniquePng());
  await page.getByTestId('receipt-form').locator('button[type=submit]').click();
  await expect(page.getByTestId('donation-done')).toBeVisible();
  await expect(page.getByTestId('done-split')).toBeVisible();
  await context.close();

  // The campaign is now fully reserved: a new donation sees «اكتملت هذه الحملة».
  expect(await remaining(request, SLUGS.roof)).toBe(0);

  // Finance approves once: campaign + fund shares, one official receipt.
  const fin = await contextFor(browser, 'finance');
  await fin.page.goto('/dashboard/finance');
  await expect(fin.page.getByTestId('finance-split').first()).toBeVisible();
  await fin.page.getByTestId(`approve-${ref}`).locator('button[type=submit]').click();
  await expect(fin.page.locator('body')).toContainText(/R-\d{4}-\d{6}/);
  await fin.context.close();

  expect(num((await ledger(request, SLUGS.roof)).verifiedAmount)).toBe(roofBefore + need);
  expect(num((await ledger(request, FUND)).verifiedAmount)).toBe(fundBefore + SURPLUS);
  expect(num((await transparency(request)).totals.verifiedAmount)).toBe(totalBefore + offered);
});

test('a completed campaign sends the donor to the fund; a direct fund donation needs no choice', async ({
  browser,
}) => {
  // The roof campaign is fully reserved (verified + pending = target): a new donation is offered the fund.
  const { context, page } = await contextFor(browser, 'donor');
  await page.goto(`/campaigns/${SLUGS.roof}/donate`);
  await page.locator('label[data-path="transfer"]').click();
  await page.locator('label[data-method="BEMO_TRANSFER"]').click();
  await page.locator('#amount').fill('40000');
  await page.getByTestId('transfer-create').click();
  const notice = page.getByTestId('allocation-notice');
  await expect(notice).toHaveAttribute('data-state', 'COMPLETE');
  await expect(notice.getByTestId('allocation-remaining')).toHaveCount(0);
  await expect(notice.getByTestId('allocation-to-fund')).toHaveAttribute(
    'href',
    `/campaigns/${FUND}/donate?amount=40000`,
  );

  await page.goto(`/campaigns/${FUND}/donate?amount=40000`);
  await expect(page.locator('#amount')).toHaveValue('40000');
  await page.locator('label[data-path="transfer"]').click();
  await page.locator('label[data-method="BEMO_TRANSFER"]').click();
  await page.getByTestId('transfer-create').click();
  await expect(page.getByTestId('allocation-notice')).toHaveCount(0);
  await expect(page.getByTestId('transfer-details')).toBeVisible();
  await context.close();
});
