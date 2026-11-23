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

## P17

**Status:** merged to `main` (fast-forward) and pushed; branch `p17-admin-setup` pushed.
Commit `f5fea5a` — `feat(web): admin setup screens for users, collection points, hospitals, payment methods and the beneficiary registry with PATCH endpoints`.

### What was built
Existing before P17 (kept): `POST/GET/PATCH /users`, `POST /hospitals`, `POST /collection-points`, `PUT/DELETE
/campaigns/:id/payment-accounts/:method`, `POST /beneficiaries`, `POST /campaigns/:id/beneficiaries`; no web screens
except beneficiary create/link and account overrides inside "new campaign".
- **api** (no schema change, no migration):
  - users: DTOs moved to `users.dto.ts`; `GET /users?role=`; `PATCH` now 404s unknown ids (`ParseUUIDPipe`), refuses
    points for non-collectors (`collection_points_collector_only`), checks point ids exist, clears a collector's points
    when the role changes, blocks an admin demoting/deactivating themself (`cannot_change_own_account`), audits
    before/after.
  - hospitals: `GET /hospitals/all` (inactive too, usage counts), `PATCH /hospitals/:id`; create now audited.
  - collection points: `PATCH /collection-points/:id` (name, type, `contactName` — empty clears, area, isActive);
    create now audited. DTOs moved to `lookups.dto.ts`.
  - payment methods: `GET /payment-methods/config`, `PATCH /payment-methods/config/:method` (labels, holder names,
    number, instructions, isActive, sortOrder; kind and receipt/demo flags never editable), `GET
    /campaigns/:id/payment-accounts/overrides` (any campaign status). All ADMIN, audited.
  - beneficiaries: `PATCH /beneficiaries/:id` (ADMIN; audit row holds only public fields + `privateFieldsChanged`),
    `PATCH /campaigns/:id/beneficiaries/:beneficiaryId` (monthly amount by the category flag, or `end`); linking an
    ended link reopens it; the staff list returns active campaign links.
- **web** (ADMIN "الإعداد / Setup" group in the Sidebar + beneficiary registry for ADMIN/STAFF):
  `/dashboard/admin/users` (staff by role / donors tabs, create, edit role + collector points checklist,
  activate/deactivate), `/collection-points` (type, area, contact person, collectors, donations count),
  `/hospitals`, `/payment-methods` (default accounts + per-campaign account picker → override/remove, link to the
  donate page), `/beneficiaries` (search, code + private record, linked campaigns, edit, link, change monthly amount,
  end link). Server Actions `lib/actions/{users,lookups,payment-methods,beneficiaries}.ts`, new paths in the
  `safeRevalidate` whitelist (+ `/campaigns/<slug>/donate`), `adminSetup` namespace (AR/EN) in
  `STAFF_CLIENT_NAMESPACES`, new `apiErrors` codes.
- **e2e:** `e2e/tests/03-admin-setup.spec.ts` (runs after the scenario): add point → create collector → assign the point
  (role select keeps COLLECTOR after save) → the collector logs in at 375 px and sees the point in the PWA → override
  Sheikh Badr's Syriatel Cash number → public campaign page and the donor's transfer details show it. `helpers.ts`
  gained `loginWithPhone`.

### Checks
- api: lint ✓ · **292** tests ✓ (+40: users, lookups, payment-method config, beneficiary update/link) · build ✓
- web: lint ✓ · prettier ✓ · **40** tests ✓ (+4: workspace setup links, revalidate whitelist, form helpers) · build ✓
- mobile (unchanged): `tsc --noEmit` ✓ · `expo lint` ✓ · `expo-doctor` 20/20 ✓
- e2e: **27 passed, 1 skipped** (the LAN login test skips without `E2E_LAN_URL`, as in P16), twice on fresh resets.
- Screenshots: `docs/screenshots/p17/` (users, collector assigned, donors tab, English, collection points + dark,
  hospitals, payment defaults, override, 375 px, beneficiary registry + edit/link, collector PWA, donate page).

### Decisions made alone
- No schema change: every field the spec names already existed.
- Collection points are assigned on the user (collector) form; the point list shows its collectors and links to Users.
- Card (PayPal/Visa) and cash methods get no account box and no campaign override (cards are simulated checkout, cash
  goes to a point); only TRANSFER/WALLET methods can be overridden.
- Beneficiary edit and link are ADMIN-only (STAFF can only register, as before); the private name/phone never enter the
  audit log.
- Found and fixed while testing: React 19 resets action forms after submit, which made a controlled role select show
  "متبرع" while the state said COLLECTOR (a second save would have demoted the user). Selects are now uncontrolled and
  edit forms are keyed by the saved values; the e2e test asserts it.

### Servers / cleanup
Dev DB reseeded (`demo:reset`). Stopped PIDs 18884 / 10096 (api :4000 and web :3000; 1208 and 4272 were earlier web
restarts); ports 3000/4000/8081 free (Expo not started: mobile unchanged). No `.playwright-mcp` folder was created.

### Needs human
- At 375 px every signed-in workspace page (also the pre-P17 categories page) scrolls ~32 px sideways: the signed-in
  site header row is wider than the phone. Pre-existing, not touched here; fits P19's 375 px pass.
- The collector PWA step was checked in Playwright at phone size, not on a physical phone.

## P18

**Status:** merged to `main` (fast-forward) and pushed; branch `p18-campaign-lifecycle` pushed.
Commit `8ad9a67` — `feat(web): campaign lifecycle (status tabs, pause/resume, complete, close, edit cover/summary, updates) and beneficiary hold with internal violations log`.

### What was built
Existing before P18 (kept): `acceptsPledges` + `PATCH /campaigns/:id/status` (no rules, no web screen), `POST
/campaigns/:id/updates` (no audit), `Beneficiary.isSuspended`/`suspensionNote` with a silent intake refusal
(`cannot_submit_request`), public `acceptsPledges` gating on the web donate page and the mobile campaign screen, and the
mobile category + priority filter chips (verified, unchanged).
- **api:**
  - Schema: `BeneficiaryNote` (kind, body, author, createdAt; cascade with the beneficiary) + enum `BeneficiaryNoteKind`
    (NOTE, VIOLATION, SUSPENDED, REACTIVATED) in `schema.prisma` and all three shared copies (enum-sync test extended).
    Migration `20261123011837_beneficiary_notes` (generated by `prisma migrate dev`, not edited).
  - Campaign lifecycle: `PATCH /campaigns/:id/status` now takes a status and/or `acceptsPledges` and enforces
    `lifecycleProblem`: CLOSED is final, COMPLETED does not reopen, a published campaign never returns to DRAFT, CLOSED
    only without verified money and without pledges on their way (`campaign_has_money`, because CLOSED leaves every
    public page and total), a medical campaign whose case is back under review does not resume (`case_review_pending`);
    COMPLETED/CLOSED stop pledges and close the case. CASE_OFFICER only for case-pipeline campaigns.
  - `PATCH /campaigns/:id` (titles, anonymised summaries, cover key, area, priority; '' clears optional texts; diff-only
    audit; `campaign_unchanged`), `GET /campaigns/staff/:id` (management page: all updates + open pledge count),
    `POST /campaigns/:id/updates` now audited and refused on CLOSED.
  - Beneficiaries: `POST /beneficiaries/:id/suspend|reactivate` (ADMIN, required reason → record + `SUSPENDED/
    REACTIVATED` log entry + audit) and `POST /beneficiaries/:id/notes` (ADMIN, NOTE/VIOLATION). The staff list no longer
    sends the suspension state to STAFF; ADMIN gets it plus the last 20 log entries.
  - Intake: the suspension check now runs before the report file is stored; the refusal stays the generic
    `cannot_submit_request` and writes an ADMIN-only audit row `case.submit_refused`.
- **web:** campaign status tabs with counts (All / Published / Donations paused / Drafts / Target reached / Completed /
  Closed) and a "Manage" link; `/dashboard/admin/campaigns/[id]`: stage band (Draft → Published → Target reached →
  Completed, closed shown apart), donations open/paused pill, only the moves allowed from the current stage (publish,
  pause/resume, mark completed, close behind a disclosure or an explanation why it cannot close), edit form (titles,
  summaries, area, priority, cover picker; keyed so it shows saved values after React's form reset), updates form +
  timeline. Beneficiary registry (ADMIN): «إيقاف إداري» panel with reason, reactivate, and the internal log with
  note/violation form. AR/EN messages, new `apiErrors` codes, `/dashboard/admin/campaigns/<uuid>` in the revalidate
  whitelist. DEMO.md: one optional 30-second pause/resume extra (seed and expected numbers unchanged).
- **mobile:** no code change needed (shared enum copy only).
- **e2e:** `e2e/tests/04-lifecycle.spec.ts`: pause → API, public page and donor donate page refuse → resume; edit
  summary + cover and post an update → public page/API show them; hold `B-0105` → STAFF intake with its national ID
  shows only «تعذّر تسجيل الطلب. راجع المجلس المحلي.» (no hold wording visible, registry shows no badge to STAFF) →
  reactivate → the same intake succeeds.

### Checks
- api: lint ✓ · **333** tests ✓ (+41: lifecycle rules, pause/close/edit/update audit, suspend/reactivate/notes, STAFF
  select, intake refusal) · build ✓
- web: lint ✓ · prettier ✓ · **41** tests ✓ (+1 whitelist) · build ✓
- mobile: `tsc --noEmit` ✓ · `expo lint` ✓ · `expo-doctor` 20/20 ✓
- e2e: **31 passed, 1 skipped** (LAN login without `E2E_LAN_URL`, as before) on a fresh reset.
- Mobile in Expo web at 390 px: paused campaign shows «الحملة لا تستقبل تبرعات حالياً.» and no donate button; after
  resume the button is back; category + priority chips filter (HOME_RENOVATION + URGENT → only the roof campaign).
- Screenshots: `docs/screenshots/p18/` (manage page paused/edited, paused tab, donate blocked, beneficiary on hold,
  intake generic error, intake after reactivation, mobile paused/resumed/filters at 390 px — the mobile paused shot is
  the viewport only; the notice sits below the fold and was asserted by text).

### Decisions made alone
- "Close" = status CLOSED, which hides the campaign from public pages and totals, so it is allowed only for a campaign
  with no verified money and no open pledges; otherwise the UI offers «تم الإنجاز». COMPLETED and CLOSED are final.
- Suspension wording on admin screens is «إيقاف إداري» / "Administrative hold"; never "suspicious"/"monitoring". Intake
  staff (STAFF) no longer receive `isSuspended` at all, so the P17 "موقوف" badge is ADMIN-only now.
- A suspended beneficiary keeps existing campaign links and stays on public pages (codes only); monthly runs already
  skip them and new links are refused, as before.
- Campaign edit is ADMIN (CASE_OFFICER only for case-pipeline campaigns); posting updates keeps STAFF/CASE_OFFICER/ADMIN.
- New code `campaign_unchanged` instead of reusing `nothing_to_change` (its text is about hospital/amount).

### Servers / cleanup
Dev DB reseeded (`demo:reset`; transparency start numbers 39,600,000 / 18,300,000 / 16 verified). Stopped PIDs 532
(web :3000), 21000 (api :4000), 2016 (Expo :8081) plus their npm/npx parents 18104, 3252; ports 3000/4000/8081 free.
`.playwright-mcp` deleted. The e2e run overwrote P16/P17 screenshots (`E2E_SCREENSHOTS=1` runs all specs); they were
restored with `git checkout` before committing.

### Needs human
- Pause → donate blocked was checked in Expo **web**, not in Expo Go on a physical phone.
- The full e2e run took 13 min wall time although every test took seconds (long idle after the last test, not
  investigated; the suite itself is green).

## P19

**Status:** merged to `main` (fast-forward) and pushed; branch `p19-trust-polish` pushed.
Commit `08f1180` — `feat(web): trust polish with ADMIN audit history, SLA overdue alerts, donor codes, OG card and share links, install prompt, beneficiary kind per category and 375 px fixes`,
then `c405d7b` … `27b2bc7` — `docs(docs): P19 route and feature screenshots (part 1–7)` (the 9 MB of screenshots
were split into seven ~1.4 MB commits because every single push of them timed out with HTTP 408 on a ~100 KB/s
uplink; same branch, no force-push).

### What was built
Existing before P19 (kept): `GET /audit?entityType&entityId` (ADMIN, no UI), `Case.slaDueAt` + the "overdue" filter
(no alert), one WhatsApp share link on the campaign page, manifest + offline service worker + PNG icons, the
notification bell.
- **api** (migration `20261123015439_trust_polish`: generated with `prisma migrate diff` because `migrate dev` refuses
  non-interactive runs, then `migrate deploy` + `generate`; not edited):
  - **Audit history:** `GET /audit/campaigns/:id` (the campaign's rows + its medical case + its pledges; pledge rows
    named by `P-XXXXXX`) and `GET /audit/cases/:id` (the case + its campaign once published). ADMIN only (403 for
    every other role, 404 unknown id), newest first, max 200. `maskPersonal` replaces any value whose key looks like a
    phone, national ID, password, full name or donor name with `•••` at any depth — even for ADMIN.
  - **SLA alert:** `CaseSlaService`, a plain unref'd timer (no scheduler library): first check 5 s after start, then
    every `SLA_CHECK_MINUTES` (default 10, `0` = off; in `.env.example`). A reviewable case past `slaDueAt` with
    `overdueNotifiedAt` null is claimed by a conditional `updateMany` (two API processes never alert twice); every
    active CASE_OFFICER and ADMIN gets one in-app notification in their language (`case.overdue`, link
    `/dashboard/cases/<id>`, new pattern in `links.ts` + spec); audit row `case.overdue_alert` (actor null).
  - **Donor code:** `User.donorCode` `D-XXXXXX` (unique, the unambiguous code alphabet) for every new account
    (register, ADMIN create); seed codes `D-000001…` in creation order (DONOR A = `D-000006`; generated codes never
    contain 0/1). In `CurrentUser` (`/auth/me`, login) and on the public official receipt (`OfficialReceipt.donorCode`);
    shared types changed in all three copies.
  - **Beneficiary kind per category:** `CampaignCategory.beneficiaryKind` (nullable) + shared
    `categoryBeneficiaryKind()`: flags first (`requiresMedicalCase` → PATIENT, `supportsMonthlySponsorship` → ORPHAN),
    then the category's own `beneficiaryKind` (seed: HOME_RENOVATION = FAMILY; set explicitly on the other two system
    categories too), else any kind. `POST /campaigns/:id/beneficiaries` refuses another kind (409
    `beneficiary_kind_mismatch`); `POST /categories` takes an optional `beneficiaryKind`; the staff campaign list
    returns the category flags so the registry can filter.
- **web:**
  - `AuditHistory` (server component, collapsible «سجل التغييرات») on `/dashboard/admin/campaigns/[id]` and
    `/dashboard/cases/[id]`, fetched and rendered only for ADMIN. Translated action names (`audit.actions.*`),
    «النظام (تلقائي)» for the SLA job, changed fields as LTR chips.
  - **OG card** `campaigns/[slug]/opengraph-image.tsx` (1200×630 PNG): the campaign's cover illustration (the same
    vector scenes — `CampaignCover` now takes a paint so the image gets fixed colours; fragments are flattened for
    Satori), verified %, progress bar, "verified of target SYP", beneficiary count "shown by code only". Latin text and
    Western digits only: the bundled OG font cannot shape Arabic; the Arabic title/summary go out as
    `og:title`/`og:description`. `generateMetadata` adds `metadataBase` (SITE_URL), canonical, Open Graph and Twitter.
  - **Share block** (`ShareButtons`, server component): WhatsApp, Telegram, Facebook as plain links + the URL with the
    existing `CopyButton` (the only client JS). The old single WhatsApp button / `shareWhatsapp` key removed.
  - **Install prompt** (`InstallPrompt`, root layout): only when the browser fires `beforeinstallprompt` (HTTPS or
    localhost), only for guests and donors; «ليس الآن» hides it 30 days (localStorage, try/catch). 4 Vitest tests.
  - **Donor code** card in «تبرعاتي» and «رمز المتبرع» under the donor on the official receipt.
  - **Beneficiary picker** (new campaign) shows only the category's kind with a note; switching category unticks the
    others; the registry's "link to campaign" lists only campaigns that take that beneficiary's kind; categories screen:
    optional «نوع المستفيدين» on create, and each category shows its kind rule.
  - **375 px:** the signed-in header fits (logout is an icon button below `sm`, its label stays the accessible name;
    desktop unchanged). Two more sideways scrolls found and fixed: `/dashboard/admin/campaigns` (+325 px: the table's
    absolutely positioned `sr-only` labels escaped the `overflow-x-auto` wrapper → wrapper `relative`) and the public
    campaign page (+40 px with the new share row: the single-column grid used an auto track → `minmax(0,1fr)`).
  - **a11y / states:** home ledger `<dl>` had invalid children → two `<dl>`; the language switch's `aria-label` hid
    its visible «ع / EN» (WCAG 2.5.3) → visible text + `sr-only` label; `error.tsx` in `(public)` and `(app)` so an
    error keeps the header and navigation (the root one replaced the whole layout). Glyph for `case.overdue`.
  - AR/EN messages for everything new (Arabic copy reviewed: «منذ يومين / 3 أيام / 11 يوماً» in the SLA alert).
- **mobile:** «رمز المتبرع: D-…» on «تبرعاتي»; shared copies.
- **e2e:** `05-trust-polish.spec.ts` (6 tests, runs after 03/04): OG meta + image route + share links (guest); the SLA
  alert exactly once and `case.overdue_alert` in the case history; the roof campaign's history (status/edit/update
  rows, no phone number); STAFF gets no history panel; picker only orphans / only families; DONOR A's donor code;
  seven signed-in pages + home + a campaign page without sideways scroll at 375 px.
- DEMO.md: the SLA alert after API start and the donor codes (seed and expected numbers unchanged).

### Checks
- api: lint ✓ · **353** tests ✓ (+20) · build ✓
- web: lint ✓ · prettier ✓ · **47** tests ✓ (+6) · build ✓
- mobile: `tsc --noEmit` ✓ · `expo lint` ✓ · `expo-doctor` 20/20 ✓ · Expo web at 390 px: DONOR A sees
  «رمز المتبرع: D-000006» (`mobile-390-donations-donor-code.png`).
- e2e: **37 passed, 1 skipped** (LAN login without `E2E_LAN_URL`) on a fresh `demo:reset`, twice (the second after the
  last CSS fix); wall time 14 min, of which ~12 min idle after the last test (see Needs human).
- **Lighthouse accessibility** (`npx lighthouse@12.6.1 --only-categories=accessibility`, installed Chrome, one-off,
  not in any package.json), mobile + desktop: home **100** (93 before the `<dl>` fix), campaign **100**, completed
  campaign **100**, transparency **100**, track **100**, login **100**, official receipt **100**. The 404 page cannot be
  audited (Lighthouse refuses non-200 documents) — reviewed by screenshot.
- Screenshots: `docs/screenshots/p19/` — every route as guest and per role (admin, case officer, finance, staff,
  collector, donor) at 1280 and 375 px, dark mode (public pages + admin campaigns), English (home + campaign), the e2e
  shots (share block, case/campaign history, picker, 375 px admin), the OG cards and the mobile shot. Reviewed: after
  the fixes above every route has 0 px horizontal overflow at 375 px.
- No unused JS on public pages: the share block and receipt are server components; the only new client code on public
  pages is the install prompt (renders nothing until the browser offers an install). `/campaigns/[slug]` 4.1 kB.
- WhatsApp preview: the OG tags and the image are correct on `http://localhost:3000`; a real WhatsApp preview needs a
  public HTTPS URL (WhatsApp's crawler cannot reach localhost or a LAN IP).

### Decisions made alone
- Beneficiary kind: flags first (never the code), then a new nullable category column for categories without a
  natural flag (HOME_RENOVATION = FAMILY in the seed); no kind = any beneficiary. Enforced on the API (409) because
  linking already validates the category (monthly amounts); the case pipeline creates PATIENT beneficiaries itself.
  New categories set the kind at creation only (no edit path, so existing links never become invalid).
- Every new account gets a donor code (staff can donate too); rows created before the migration stay null and the UI
  hides it — `demo:reset` recreates every demo account with one.
- The OG card has no Arabic text and no beneficiary data beyond the count; amounts are verified money only.
- SLA alert = in-app notification only (no WhatsApp outbox for staff); it fires ~5 s after the API starts. Seeded cases
  have no `case.submit` audit rows (written by the seed directly), so a seeded case's history starts with the alert.
- No `loading.tsx`: a Suspense boundary at group level makes `notFound()` answer 200 instead of 404 for streamed
  pages; the pages are server-rendered and fast.
- Manifest `start_url` stays `/dashboard` (P10 choice for collectors); the «الحملات» shortcut opens the public home.
- Tracing in `e2e/playwright.config.ts` left as it was (`retain-on-failure`): it is not the cause of the idle time.

### Servers / cleanup
Dev DB reseeded (`demo:reset`). Stopped the last instances: api :4000 PID 20032, web :3000 PID 9964, Expo :8081 PID
1556 (earlier restarts: api 7760/16868/7060/21768/10436, web 15240/20044/20212/8648/9184/14600, hung Playwright runner
and worker 4308/10376); ports 3000/4000/8081 verified free. No `.playwright-mcp` folder was created. The e2e runs
rewrote the P16–P18 screenshots (`E2E_SCREENSHOTS=1`); restored with `git checkout` before committing. A test of SSH
push (`ssh -T git@github.com`, no key) added github.com to `~/.ssh/known_hosts`.

### Needs human
- **e2e idle time (P18 item) — cause found, not fixable in the test config:** after the last test (and after any failed
  test, when Playwright replaces the worker) the worker spends ~12 min at 100 % CPU in Node's recursive `fs.rm`
  retries (CPU profile via the inspector: `rimraf`/`chmod`/`unlink`/`lstat` in a timer loop) deleting Chrome's
  temporary profile `%TEMP%\playwright_chromiumdev_profile-*`. After Chrome has exited (no chrome.exe left) every file
  in that folder is still locked (exclusive open fails for 124/124 files), most likely by the antivirus or the search
  indexer; with `maxRetries: 10` per directory level the retries multiply. It also happens with tracing off.
  Suggested: exclude `%TEMP%\playwright_chromiumdev_profile-*` from real-time scanning (or test once with it paused)
  and delete the ~12 leftover profile folders in `%TEMP%` (I did not touch files outside the repo). Test results are
  printed as each test finishes, so the outcome is known before the idle period.
- A real WhatsApp link preview needs a public HTTPS URL (tunnel or hosting).
- The install prompt appears only on HTTPS or localhost (browser rule), so not on the plain-HTTP LAN demo; not checked
  on a physical phone. The donor code in the native app was checked in Expo web only.
- GitHub uploads from this machine run at ~100 KB/s and pushes over ~2 MB time out (HTTP 408); large commits need
  splitting or a better connection.
