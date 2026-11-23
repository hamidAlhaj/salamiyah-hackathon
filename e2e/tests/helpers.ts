import {
  expect,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';

/** The API the web server talks to (read-only checks of the expected demo numbers). */
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:4000';

/** Fixed demo logins from api/prisma/seed.ts (fictional numbers, one shared demo password). */
export const PASSWORD = 'Majlis@2026';
export const USERS = {
  admin: { phone: '0900000001', role: 'ADMIN' },
  caseOfficer: { phone: '0900000002', role: 'CASE_OFFICER' },
  finance: { phone: '0900000003', role: 'FINANCE_VERIFIER' },
  staff: { phone: '0900000004', role: 'STAFF' },
  collector: { phone: '0900000005', role: 'COLLECTOR' },
  donor: { phone: '0900000006', role: 'DONOR' },
  diaspora: { phone: '+4915100000007', role: 'DONOR' },
} as const;
export type UserKey = keyof typeof USERS;

/** Seeded campaign slugs (deterministic). */
export const SLUGS = {
  sheikhBadr: 'orphans-sheikh-badr',
  jammasa: 'orphans-aljammasa',
  roof: 'roof-repair-albaath',
  rain: 'rain-damaged-homes',
  heart: 'heart-surgery-father',
  medication: 'chronic-medication-elder',
  chemo: 'chemotherapy-mother',
} as const;

/** A tiny valid PNG used as a transfer receipt and as an expenditure proof. */
export const PNG = {
  name: 'receipt.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABgAAAAgCAIAAACHPC9vAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAMUlEQVRIiWN48f4lVRDDqEEvRsPoxWg6ej+aRd6PFiMvR0vIl6O1yIvRCvLF0G5EAAA62kB5CjZqZgAAAABJRU5ErkJggg==',
    'base64',
  ),
};

export const PHONE_VIEWPORT = { width: 375, height: 812 };

export const ROLE_LABELS: Record<UserKey, string> = {
  admin: 'مدير النظام',
  caseOfficer: 'مدقق الحالات',
  finance: 'المدقق المالي',
  staff: 'موظف استقبال',
  collector: 'مكي',
  donor: 'متبرع',
  diaspora: 'متبرع',
};

/** Where auth.setup.ts keeps each role's session cookie. */
export const authFile = (user: UserKey) => `.auth/${user}.json`;

/** The login form's message when the API throttles logins (10 a minute). */
const THROTTLED = 'محاولات دخول كثيرة';

/**
 * Logs in through the real login form (auth.setup.ts uses it once per role). When the API throttles
 * logins (10 a minute, e.g. right after a previous run), it waits for the window to pass and retries.
 */
export async function loginWithForm(page: Page, user: UserKey, retries = 2): Promise<void> {
  return loginWithPhone(page, USERS[user].phone, user, retries);
}

/** Same, for an account created during a test (e.g. the P17 collector). */
export async function loginWithPhone(
  page: Page,
  phone: string,
  label: string = phone,
  retries = 2,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('رقم الهاتف').fill(phone);
  await page.getByLabel('كلمة المرور').fill(PASSWORD);
  await page.getByRole('button', { name: 'دخول' }).click();
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  } catch {
    const alert = (await page.getByRole('alert').allInnerTexts()).join(' ').trim();
    if (alert.includes(THROTTLED) && retries > 0) {
      await page.waitForTimeout(61_000);
      return loginWithPhone(page, phone, label, retries - 1);
    }
    throw new Error(`login failed for ${label} (${alert || 'no message'})`);
  }
}

/**
 * One browser context per role, signed in with the session saved by auth.setup.ts (the API
 * throttles logins at 10 a minute). `phone` opens it at 375 px with touch, like a phone browser.
 */
export async function contextFor(
  browser: Browser,
  user: UserKey,
  opts: { phone?: boolean } = {},
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    storageState: authFile(user),
    ...(opts.phone ? { viewport: PHONE_VIEWPORT, isMobile: true, hasTouch: true } : {}),
  });
  const page = await context.newPage();
  return { context, page };
}

export interface Totals {
  verifiedAmount: string;
  pendingAmount: string;
  spentAmount: string;
  remainingAmount: string;
  demoAmount: string;
  targetAmount: string;
  spentPercent: string;
}
export interface Transparency {
  totals: Totals;
  campaigns: { active: number; funded: number; completed: number; total: number };
  beneficiaries: { total: number };
}
export interface Ledger {
  verifiedAmount: string;
  pendingAmount: string;
  demoAmount: string;
  spentAmount: string;
  remainingAmount: string;
  targetAmount: string;
}

export async function transparency(request: APIRequestContext): Promise<Transparency> {
  const res = await request.get(`${API_URL}/stats/transparency`);
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as Transparency;
}

export async function campaignId(request: APIRequestContext, slug: string): Promise<string> {
  const res = await request.get(`${API_URL}/campaigns/${slug}`);
  expect(res.ok(), `campaign ${slug}`).toBeTruthy();
  return ((await res.json()) as { id: string }).id;
}

export async function ledger(request: APIRequestContext, slug: string): Promise<Ledger> {
  const id = await campaignId(request, slug);
  const res = await request.get(`${API_URL}/campaigns/${id}/ledger`);
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as Ledger;
}

/** "1550000.00" → 1550000 */
export const num = (v: string) => Number(v);

/** Western digits with thousands separators, as the UI prints SYP amounts (e.g. 39,600,000). */
export const grouped = (n: number) => n.toLocaleString('en-US');
