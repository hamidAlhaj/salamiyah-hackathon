# Overnight report

<!-- summary table -->

## P16

**Status:** merged to `main` (fast-forward) and pushed; branch `p16-demo-seed` pushed; tag `demo-ready` created and pushed.
Commit `f3bef9c` — `feat(repo): final demo seed, demo:reset, LAN session cookie flag, DEMO.md walkthrough and Playwright e2e scenario`.

### What was done
- **STEP 0 — LAN demo fix:** `web/src/lib/session/cookie-secure.ts` (`sessionCookieSecure`) read by `lib/session`:
  `SESSION_COOKIE_SECURE` "true"/"false" overrides; empty = Secure in production only. Documented in `web/.env.example`,
  README §5 and DEMO.md (false for the LAN demo). Verified: `next start -H 0.0.0.0` (production build) with
  `SESSION_COOKIE_SECURE=false`, login from `http://192.168.1.112:3000` (host from `mobile/.env`) lands on the dashboard;
  the session cookie is `httpOnly`, not `secure`, and not readable from JS (Playwright MCP + committed e2e test
  `E2E_LAN_URL`). The web calls the API server-side, so `WEB_ORIGIN` only matters for Expo web in a browser; DEMO.md
  and `scripts/demo-start.ps1` add the LAN origins as process variables (no `.env` edits).
- **Deterministic demo seed** (`api/prisma/seed.ts`): 7 public campaigns (orphans ×2: ACTIVE ongoing + FUNDED; home
  renovation ×2: ACTIVE with the per-campaign Syriatel override + COMPLETED «تم الإنجاز» with public proofs; medical ×3
  from the case pipeline: ACTIVE, FUNDED, ACTIVE), incubator case `MF-2026-DEMO2` registered for step 2 + an overdue
  case, 12 unlinked orphans `B-0412…B-0423` for step 1; fixed `B-0xxx` codes (the generator never uses 0/1, so no
  collisions); 28 verified donations over 6 months on every channel (transfer/wallet with receipts, collection-point cash,
  council cash) with receipts `R-YYYY-000001…028` in date order; pending finance items (3) and collector items (2 for
  0900000005, 1 for a second OFFICE collector 0900000008); pledges in every status; orphan sponsorship paid through last
  month (this month unpaid); users per role + fictional donors; opted-in alert donors from `DEMO_WHATSAPP_NUMBERS`
  (empty here → 2 fictional numbers; real numbers never printed); CENTER/MOSQUE/OFFICE points. Consistency checks
  (spent ≤ verified, FUNDED/COMPLETED at target) throw if violated.
- **`npm run demo:reset`** (`api/prisma/demo-reset.ts`): seed-safety check → `prisma migrate reset --force --skip-seed`
  → empties `api/uploads/` (only when inside api/) → seed. ~7 s. Excluded from the Nest build (`tsconfig.build.json`).
- **`DEMO.md`** (Arabic): logins and devices, seeded state with start numbers, the 7 steps with clicks and expected
  numbers (all verified by the e2e suite), 2-minute version, pre-demo checklist (VPN, firewall 3000/4000/8081,
  `PUBLIC_WEB_URL` / `EXPO_PUBLIC_*` / `SESSION_COOKIE_SECURE` / `WEB_ORIGIN`, reset, start order), troubleshooting.
- **`scripts/demo-start.ps1`**: documented, syntax-checked with the PowerShell parser, **not executed**.
- **E2E:** `e2e/` = 4th, test-only npm project pinning `@playwright/test` **1.64.1** (README "Additions beyond b4f",
  CLAUDE.md, 05 "Decision updates (P16)"). Reason: `npx playwright@x test` without a local install cannot resolve
  `@playwright/test` from the test files (tried). Runs on the installed Chrome (`channel: "chrome"`, no browser
  download). Setup logs in each role once via the form (HttpOnly check) and reuses sessions; waits out the login throttle.

### Expected numbers (verified against the running app)
Start: verified 39,600,000 · spent 18,300,000 (46.2%) · remaining 21,300,000 · pending 1,550,000 · demo 1,300,000 ·
7 campaigns (4/2/1) · 16 beneficiaries. After the 7 steps: verified 40,550,000 · spent 21,100,000 · remaining
19,450,000 · demo 1,550,000 · 29 beneficiaries · 9 campaigns · receipts R-2026-000029/000030 · outbox 3 alerts.

### Checks
- api: lint ✓ · **252** tests ✓ · build ✓
- web: lint ✓ · **36** tests ✓ (incl. 4 new cookie-flag tests) · build ✓
- mobile: `tsc --noEmit` ✓ · `expo lint` ✓ · `expo-doctor` 20/20 ✓ (mobile code unchanged)
- e2e: **23/23** passed (7 role logins, 7 smoke incl. public identity/phone scans of pages and API, LAN login,
  scenario steps 1–7). Step 3 also checked by hand in the Expo **web** build (Syriatel Cash demo → «تم الدفع التجريبي»,
  campaign demo amount +250,000). Screenshots in `docs/screenshots/p16/`.

### Servers / cleanup
Dev DB reseeded (`demo:reset`, verified 39,600,000). Stopped PIDs 1080 (web :3000), 9896 (api :4000), 16664 (Expo
:8081); ports 3000/4000/8081 free. `.playwright-mcp` log folder deleted.

### Needs human
- The walkthrough on **2 physical phones** (Expo Go native app, phone browser, collector page) was not possible here;
  everything else in the scenario passed in Playwright (phone viewport) and the Expo web build.
- Before the demo: allow port **3000** in the firewall too (README's earlier rule covered only 4000/8081; DEMO.md has the
  new rule), turn the VPN off (an extra `10.2.0.2` adapter is present), and put team numbers in `DEMO_WHATSAPP_NUMBERS`
  if wanted (then the outbox count is 1 + their count; `E2E_ALERT_DONORS` for the test).
- Risk noted in DEMO.md: the API's global throttle (120 requests/min per IP) is shared by every device using the web
  app, because Next calls the API from the PC. Normal demo pace is fine; avoid rapid repeated refreshes.
