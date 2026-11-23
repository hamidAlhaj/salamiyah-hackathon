import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against servers that are already running (see DEMO.md "ترتيب التشغيل"):
 * api on E2E_API_URL (default http://localhost:4000) and web on E2E_WEB_URL (default
 * http://localhost:3000). Point E2E_WEB_URL at http://<LAN-IP>:3000 to check the LAN demo.
 * Uses the installed Google Chrome (channel "chrome"), so no browser download is needed.
 *
 * The scenario mutates the database: run `npm run demo:reset` in api/ before it, and again after it.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  outputDir: './test-results',
  use: {
    baseURL: process.env.E2E_WEB_URL ?? 'http://localhost:3000',
    channel: 'chrome',
    locale: 'ar',
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Logs every demo role in once through the login form and keeps the session (login is throttled).
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { channel: 'chrome' } },
    {
      name: 'chrome',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], channel: 'chrome', locale: 'ar' },
    },
  ],
});
