# Overnight report

Unattended run of 2026-11-23: P16 → P17 → P18 → P19 → P21 → P22 → P20 (SAFE). Every prompt was merged; none is WIP.
Every number below was re-checked after each prompt (`git log`, `main` = `origin/main`, no `.env`/uploads tracked,
ports 3000/4000/8081 free).

| Prompt | Status | Branch | Commit (feature / report) | api tests | web tests | mobile checks | e2e | needs me? |
|---|---|---|---|---|---|---|---|---|
| P16 Demo seed + LAN fix | merged | `p16-demo-seed` | `f3bef9c` / `16ad077` | 252 ✓ | 36 ✓ | tsc · expo lint · doctor ✓ | 23/23 | yes: 2-phone test, firewall 3000, VPN off |
| P17 Admin setup screens | merged | `p17-admin-setup` | `f5fea5a` / `1ba9d5f` | 292 ✓ | 40 ✓ | ✓ | 27 + 1 skipped | no |
| P18 Campaign lifecycle | merged | `p18-campaign-lifecycle` | `8ad9a67` / `531e82e` | 333 ✓ | 41 ✓ | ✓ | 31 + 1 skipped | no |
| P19 Trust polish | merged | `p19-trust-polish` | `08f1180` / `bbc0219` | 353 ✓ | 47 ✓ | ✓ | 37 + 1 skipped | yes: WhatsApp preview needs public HTTPS; antivirus exclusion for e2e idle |
| P21 Light mode | merged | `p21-light-mode` | `a88eabd` / `7a4d8ef` | 353 ✓ | 47 ✓ | ✓ | 37 + 1 skipped | yes: look at it on a phone/projector |
| P22 Google sign-in | merged | `p22-google-signin` | `960d8f6` / `2bf81ee` | 392 ✓ | 53 ✓ | ✓ | 40 + 1 skipped | yes: create the Google OAuth client and fill `api/.env` |
| P20 Final checks (SAFE) | done (no branch, checks only) | `main` | `95640e9` README / `e1d702d` | 392 ✓ (fresh clone) | 53 ✓ (fresh clone) | ✓ (fresh clone) | 40 + 1 skipped | yes: real-device walk, then run the deletion list |

The one skipped e2e test is the LAN login. It needs `E2E_LAN_URL` set to the PC's LAN address.
Branch names are as pushed; `git branch -a` lists them all (21 local branches, all on origin at the same commits).

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

## P21 — Light mode redesign

**Status:** merged to `main` (fast-forward) and pushed; branch `p21-light-mode` pushed.
Commit `a88eabd` — `feat(web): light mode redesign with near-white page, pure-white cards, soft green-tinted shadow and fresh Salamiyah green accents`,
then `2a6447d` … `3de0a1f` — `docs(docs): P21 light mode before/after screenshots (part 1–11 of 11)` (~14 MB of new
blobs in ~1.4 MB commits because of the slow uplink; the 62 dark JPEGs that are byte-identical before and after are
stored once by git).

### What was built
Direction (frontend-design skill, inside the brief): "clean morning white". A near-white page with a breath of mint
instead of the grey limestone, pure-white cards lifted by a hairline border and a soft green-tinted shadow, and the
fresher brand-600 green for accents and primary actions. The one bold element stays the deep green panel (home
ledger, transparency hero, login, receipt header), now a slightly fresher `#0e4a33`.
- **`web/src/app/globals.css`, `:root` only** (old → new): page `#eef2ef` → `#f6f9f7`; surface `#f9fbf9` → `#ffffff`;
  surface-muted `#e4eae5` → `#eff5f1` (mint, not grey); border `#d3dcd5` → `#dee7e2`; track `#cbd5cd` → `#dce7e0`;
  control `#7b8a80` → `#6e8278`; ink `#16231d` → `#0d1c15`; muted `#4f5f56` → `#45574e`; ring brand-600 → brand-500;
  accent brand-700 → brand-600; accent-strong brand-800 → brand-700; accent-soft `#dceee5` → `#e1f4e9`; cleaner
  danger/warning/info soft and line tints (danger text `#a3271c` → `#a8241a`; warning and info text unchanged); panel
  `#0f3d2a` → `#0e4a33`, panel-ink and lattice nudged to match; card and lift shadows softer, tinted with the panel
  green. Chart series values unchanged (they now pass 3:1 everywhere). The header comment records the measured ratios.
- The `@media print` copy of the light tokens (receipt printing: "paper is always light") follows the new values.
- **Light-only classes** (12 files): the primary button and the solid green chips/pills (`Button` primary, `Tabs`,
  `CampaignFilters`, the card «تم الإنجاز» badge, the method tabs on the campaign page / finance / admin campaign, the
  cases "all" chip, the category radio on «حملة جديدة», donate step numbers, the install-prompt tile, the notification
  count) go from `bg-brand-700` to `bg-brand-600` (white text 5.85:1); primary hover brand-800 → brand-700. Each one
  already had a `dark:` override, left as it was. Where the old non-dark class also drew the **dark** border
  (`border-brand-700` on the cases chip and the category radio), `dark:border-brand-700` was added so dark keeps it.
- **`.dark` block, every `dark:` class, `tailwind.config.ts`: untouched.** Mobile has its own palette copy in
  `mobile/src/ui/theme.ts` (not shared with web) and was left as it is (out of scope).

### Checks
- api: lint ✓ · **353** tests ✓ · build ✓ (untouched)
- web: lint ✓ · prettier ✓ · **47** tests ✓ · build ✓
- mobile: `tsc --noEmit` ✓ · `expo lint` ✓ · `expo-doctor` 20/20 ✓ (untouched)
- e2e: **37 passed, 1 skipped** (LAN login without `E2E_LAN_URL`) on a fresh `demo:reset`, against `next start` of
  the redesigned build; 13.4 min wall time (the known ~12 min idle at the end). The p16–p19 screenshot folders were not
  modified by the run.
- **Screenshots:** `docs/screenshots/p21/before/` and `docs/screenshots/p21/after/`: 32 routes (guest 8, admin 17,
  case officer, finance, staff, collector, donor 3) × 1280 and 375 px × light and dark = 128 JPEGs per folder
  (`<theme>-<role>-<width>-<route>.jpg`, full page, quality 55). Taken with a scratch Playwright script (the e2e
  `node_modules`, installed Chrome, `reducedMotion: reduce`, deterministic `demo:reset` seed, one login per role)
  against `next start` of the HEAD build (before) and of the new build (after), same DB, 14 min apart.
- **Dark mode unchanged — evidence:**
  1. Lossless PNGs of all 64 dark shots, before vs after: **55/64 byte-identical** (sha256). The other 9 were diffed
     pixel by pixel (canvas in Chrome): 7 differ in 1–63 anti-aliased text pixels by **±1 in a single channel**
     (Chrome text rasterisation noise: a second dark run of the *same* build against the first shows the same ±1
     noise on the same pages), and the 2 transparency pages differ only in the "last updated" clock text
     (10:28 → 10:42). Of the committed dark JPEGs **62/64 are byte-identical** (only the two transparency shots differ).
  2. Compiled CSS (Tailwind CLI on HEAD vs the branch): the `.dark { … }` token block is identical; the only rule
     differences that mention `.dark` are the print block (`@media print { :root, .dark }`, paper only) and the two new
     `dark:border-brand-700` rules that keep the previous dark border.
- **Contrast (light, computed by a small Python script over the `:root` tokens, WCAG 2.x relative luminance):**
  **0 failures.** Lowest text pair: white on give-700 **4.94:1** (donate button, unchanged); lowest token text pair:
  accent on accent-soft 5.10:1; lowest non-text pair: series-collected on surface-muted (bar base) **3.05:1**. Before
  the redesign two chart pairs failed 3:1 (series-collected on page 2.98, on surface-muted 2.76). Dark (unchanged, for
  reference): 0 failures, lowest text pair 5.82:1.

| Foreground | Background | Ratio | Needs | Use |
|---|---|---:|---:|---|
| `text` #0d1c15 | `page` #f6f9f7 | 16.59 | 4.5 | text |
| `text` #0d1c15 | `surface` #ffffff | 17.59 | 4.5 | text |
| `text` #0d1c15 | `surface-muted` #eff5f1 | 15.91 | 4.5 | text |
| `text-muted` #45574e | `page` #f6f9f7 | 7.27 | 4.5 | text |
| `text-muted` #45574e | `surface` #ffffff | 7.70 | 4.5 | text |
| `text-muted` #45574e | `surface-muted` #eff5f1 | 6.97 | 4.5 | text |
| `accent` #18734b | `page` #f6f9f7 | 5.51 | 4.5 | text |
| `accent` #18734b | `surface` #ffffff | 5.85 | 4.5 | text |
| `accent` #18734b | `surface-muted` #eff5f1 | 5.29 | 4.5 | text |
| `accent-strong` #135b3c | `page` #f6f9f7 | 7.65 | 4.5 | text |
| `accent-strong` #135b3c | `surface` #ffffff | 8.11 | 4.5 | text |
| `accent-strong` #135b3c | `surface-muted` #eff5f1 | 7.34 | 4.5 | text |
| `danger` #a8241a | `page` #f6f9f7 | 6.76 | 4.5 | text |
| `danger` #a8241a | `surface` #ffffff | 7.16 | 4.5 | text |
| `danger` #a8241a | `surface-muted` #eff5f1 | 6.48 | 4.5 | text |
| `warning` #85460b | `page` #f6f9f7 | 6.88 | 4.5 | text |
| `warning` #85460b | `surface` #ffffff | 7.30 | 4.5 | text |
| `warning` #85460b | `surface-muted` #eff5f1 | 6.60 | 4.5 | text |
| `info` #0f4c6e | `page` #f6f9f7 | 8.69 | 4.5 | text |
| `info` #0f4c6e | `surface` #ffffff | 9.21 | 4.5 | text |
| `info` #0f4c6e | `surface-muted` #eff5f1 | 8.34 | 4.5 | text |
| `accent-strong` #135b3c | `accent-soft` #e1f4e9 | 7.07 | 4.5 | success badge |
| `accent` #18734b | `accent-soft` #e1f4e9 | 5.10 | 4.5 | link on selected chip |
| `text` #0d1c15 | `accent-soft` #e1f4e9 | 15.34 | 4.5 | text on callout |
| `text-muted` #45574e | `accent-soft` #e1f4e9 | 6.72 | 4.5 | muted on callout |
| `danger` #a8241a | `danger-soft` #fdece9 | 6.26 | 4.5 | danger badge |
| `text` #0d1c15 | `danger-soft` #fdece9 | 15.37 | 4.5 | text on danger callout |
| `warning` #85460b | `warning-soft` #fef3db | 6.62 | 4.5 | warning badge |
| `text` #0d1c15 | `warning-soft` #fef3db | 15.96 | 4.5 | text on warning callout |
| `info` #0f4c6e | `info-soft` #e4f1f8 | 8.00 | 4.5 | info badge |
| `text` #0d1c15 | `info-soft` #e4f1f8 | 15.27 | 4.5 | text on info callout |
| `text-muted` #45574e | `surface-muted` #eff5f1 | 6.97 | 4.5 | neutral badge |
| `panel-ink` #e6f5ed | `panel` #0e4a33 | 9.11 | 4.5 | panel text |
| `white` #ffffff | `panel` #0e4a33 | 10.26 | 4.5 | white on panel |
| `surface` #ffffff | `danger` #a8241a | 7.16 | 4.5 | danger button |
| `white` #ffffff | `brand-600` #18734b | 5.85 | 4.5 | primary button / active chip |
| `white` #ffffff | `give-700` #b45512 | 4.94 | 4.5 | donate button |
| `control` #6e8278 | `surface` #ffffff | 4.10 | 3 | non-text |
| `control` #6e8278 | `page` #f6f9f7 | 3.86 | 3 | non-text |
| `ring` #1f8a5b | `surface` #ffffff | 4.33 | 3 | non-text |
| `ring` #1f8a5b | `page` #f6f9f7 | 4.09 | 3 | non-text |
| `series-collected` #d96f1a | `surface` #ffffff | 3.37 | 3 | non-text |
| `series-collected` #d96f1a | `page` #f6f9f7 | 3.18 | 3 | non-text |
| `series-spent` #18734b | `surface` #ffffff | 5.85 | 3 | non-text |
| `series-spent` #18734b | `page` #f6f9f7 | 5.51 | 3 | non-text |
| `series-spent` #18734b | `surface-muted` #eff5f1 | 5.29 | 3 | bar on HBar base |
| `series-collected` #d96f1a | `surface-muted` #eff5f1 | 3.05 | 3 | bar on HBar base |

### Decisions made alone
- Page `#f6f9f7` rather than pure white, so the white cards still separate from the page; the separation comes from
  the hairline border and the soft shadow, as the brief asks.
- Accent moves from brand-700 to brand-600 ("fresh green"): brand-600 is the brightest brand step that still gives
  white text ≥ 4.5:1 (5.85); brand-500 would not (≈ 4.3). Primary buttons follow, so light and dark now share the
  same button green.
- The print token copy follows the new light values (it is the light theme on paper; screens are unaffected).
- Literal light colours that already pass and are not part of the brief were kept (`bg-brand-200 text-brand-800`
  status pill, `border-brand-200` callouts, `accent-brand-700` checkboxes, cover illustrations); some of them have no
  dark override, so changing them would have touched dark.
- Screenshots as full-page JPEG q55 to keep the size down; the dark comparison used lossless PNGs kept outside the
  repo. The screenshot, comparison and contrast scripts stayed in the session scratchpad (not committed: no unused
  code, and Python is not a project tool).
- Before/after were shot against production builds (`next build` + `next start`) instead of `next dev`, so the dev
  indicator and on-demand compilation could not disturb the pixel comparison.

### Servers / cleanup
Dev DB reseeded (`demo:reset`). Stopped the last instances: api :4000 PID 4740, web :3000 PID 10780 (+ its `npx next
start` parent 4880); earlier restarts: api 20776, web 1848/21084; the first screenshot script (PID 11160) hung in
Playwright's temp-profile deletion after finishing all shots and was killed. Expo was not started. Ports 3000/4000/8081
verified free. No `.playwright-mcp` folder was created. Untouched: four `@playwright/mcp` node processes started at
~03:00 by another session.

### Needs human
- A team look at the new light theme on a real phone and on the demo projector (the tints are subtle by design).
- Mobile (Expo) still uses the old light palette (`mobile/src/ui/theme.ts`); aligning it is a separate decision.
- The killed screenshot script may have left a `playwright_chromiumdev_profile-*` folder in `%TEMP%` (same cause as
  the e2e idle time in P19).

## P22 — Google sign-in

**Status:** merged to `main` (fast-forward) and pushed; branch `p22-google-signin` pushed.
Commit `960d8f6` — `feat(api): optional Google sign-in (off unless GOOGLE_* set), phone_required on every donate path, donor profile phone form`,
then `64dff83` / `b9faffc` — `docs(docs): P22 Google sign-in screenshots (part 1–2 of 2)`.

### What was built
Built fully but **disabled by default**: everything switches on only when `api/.env` has `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET` and `GOOGLE_CALLBACK_URL` (empty keys added to `api/.env.example`). No real keys exist or were
committed. Phone + password (`POST /auth/login` → `{ accessToken, user }`, Bearer, 8h) is unchanged; `user` only gained
two additive fields.
- **Packages** (README "Additions beyond b4f" first, exact): `passport-google-oauth20` 2.0.0 + `@types/passport-google-oauth20`
  2.0.17 (dev). Checked against the installed `passport` 0.7.0 / `@nestjs/passport` 10.0.3 (already present) and the
  `.d.ts` files (`Strategy`, `Profile`, `StrategyOptions`, passport-oauth2 state handling); `@types/express` stays deduped
  at 4.17.25; transitive `passport-oauth2` 1.8.0.
- **Schema / migration `20261123081944_google_sign_in`:** `User.phone` nullable (still unique), new `googleSub`
  (`google_sub`, unique); `email` already existed. Generated with `prisma migrate diff` (DB → schema) because
  `migrate dev` refuses non-interactive runs, then `migrate deploy` + `generate`; not edited.
- **api:** `GoogleStrategy` (registered by a factory provider only when configured), `GoogleAuthGuard` (404
  `google_sign_in_disabled` when off; 400 `google_state_required` without a valid CSRF state; any OAuth failure →
  401 `google_sign_in_failed`), `GoogleAuthService.signIn` (matching rules below), `GET /auth/google/enabled`
  (`{ enabled, callbackOrigin }`, never the id or secret), `GET /auth/google?state=` (302 to Google),
  `GET /auth/google/callback?code=` (exchanges Google's one-time code, returns the same session as login),
  `PATCH /auth/me/phone` (DONOR only, same `NormalizePhone` + regex as registration, unique → `phone_taken`, audited
  without the number). Shared `issueSession` / `toCurrentUser`. `CurrentUser.phone` is `string | null`, plus
  `whatsappOptIn` and `googleLinked` (all three shared copies byte-identical). Urgent WhatsApp alerts now query
  `phone not null`; receipts and the outbox already skipped phone-less donors; `Pledge.donorPhone` was already nullable.
- **Stable code `phone_required` (403)** on every donor donate endpoint: `POST /pledges` (transfer + receipt),
  `POST /pledges/demo` (simulated e-payment), `POST /pledges/cash` (collection point). Council and collector pledges are
  staff paths with their own donor fields; receipt upload only follows an existing pledge.
- **web:** route handlers `/auth/google/start` (random 32-byte state in an HttpOnly cookie, 10 min, path
  `/auth/google`, then 303 to the consent URL the API builds, accepted only if it is `https://accounts.google.com`)
  and `/auth/google/callback` (constant-time state check, cookie deleted, code exchanged server-side, session set in
  the HttpOnly `session` cookie; a phone-less donor lands on «ملفي»). Login page: "or" divider + "Continue with
  Google" button with the Google mark, shown only when configured **and** on the callback host; `?google=` notices
  (unavailable, cancelled, failed, expired, staff, mismatch). New «ملفي» / *My profile* (`/dashboard/profile`, DONOR
  workspace link): account card (name, donor code, sign-in method, current number) + phone/WhatsApp form. The donate
  page shows an "Add your phone number first" callout instead of the flow, linking to the profile with `next`; the
  profile offers "Continue to donate" after saving. The admin user list shows `—` for a missing phone. AR/EN messages,
  new `apiErrors` codes. Button and profile UI designed with the frontend-design skill inside the existing tokens.
- **mobile:** `phone_required` message in AR/EN (shown in the existing donate error notice); no native Google sign-in.
- **Seed:** one fictional Google donor without phone or password (fixed id `22222222-…-000000000022`, `D-000099`,
  `google.donor@example.com`), created after all other users so existing donor codes and demo numbers are unchanged.
- **Docs:** README §5a (Google Cloud console steps, origins and redirects for localhost, why LAN IPs cannot be
  registered, how the handshake works, linking rules); one line in DEMO.md about the seeded Google donor.

### Checks
- api: lint ✓ · **392** tests ✓ (+39: mocked Google profiles → identity; strategy validate → new DONOR, linked
  account, DONOR email link, staff refused ×5, mismatch, inactive, unverified email; passport start redirect and
  callback code exchange with Google's token and profile endpoints stubbed; config on/off; guard 404/400/options/error
  mapping; profile phone add/change/unique/role ×5; `phone_required` on the transfer, demo and cash paths) · build ✓
- web: lint ✓ · prettier ✓ · **53** tests ✓ (+6 Google handshake helpers; DONOR workspace list updated) · build ✓
- mobile: `tsc --noEmit` ✓ · `expo lint` ✓ · `expo-doctor` 20/20 ✓
- e2e: **40 passed, 1 skipped** in 15.7 min (baseline 37 + 1 skipped, plus 3 new in `06-google-signin.spec.ts`: no button and the
  Google routes off when unconfigured; the seeded phone-less donor gets 403 `phone_required` on all three donate
  endpoints; donate page callout → «ملفي» → save phone → the donate flow appears). Against `next start` of the build.
- Manual with dummy env values (process env only, never written to a file): `/auth/google/enabled` → enabled,
  `/auth/google/start` → 303 to `accounts.google.com` with the client id, the web callback, `openid email profile` and
  the state; the callback with a bogus code → `/login?google=failed` (API 401 `google_sign_in_failed`).
- **Screenshots:** `docs/screenshots/p22/`: 32 JPEGs (`<theme>-<lang>-<width>-<page>.jpg`): login with the button
  hidden, login with the button shown (dummy env), the profile phone form, and the donate page phone-required callout,
  each in AR/EN × light/dark × 1280/375 (1.2 MB, two commits). The p16–p21 folders were not touched.

### Deviations
- The first full e2e run failed one P19 test (SLA alert missing) because `demo:reset` ran while the API was already up,
  so the API's one-time startup SLA check had run against the old data. The rerun, with the API started after the
  reset, is green. Not a P22 regression.
- The e2e test signs the seeded Google donor's session itself (HS256 with `JWT_SECRET` read from `api/.env` or
  `E2E_JWT_SECRET`, never printed): real Google cannot run in Playwright, and the seeded account has no password.

### Decisions made alone
- The Google redirect goes to the **web** (`GOOGLE_CALLBACK_URL` = `http://localhost:3000/auth/google/callback`), and the
  web hands Google's one-time code to the API server-side. The browser never talks to the API, the app JWT never
  appears in a URL, and no extra one-time code store was needed (Google's code is already one-time and short-lived).
  The CSRF state lives in the web's HttpOnly cookie; the API passes it through (passport-oauth2 without sessions).
- Linking: match on the Google `sub` only. If nothing is linked yet, a Google-**verified** email that belongs to an
  existing **DONOR** is linked once (audited `user.google_link`). Staff, collector and admin accounts are never linked
  or entered through Google (`google_staff_account`). An email already linked to another Google id →
  `google_account_mismatch`. Unverified emails are neither stored nor used.
- `phone_required` is 403 and checked before any other donation rule. `PATCH /auth/me/phone` is DONOR-only (staff
  phones are logins managed by ADMIN). A password donor may change their phone, which also changes their login (the
  form says so).
- The button is hidden on any host other than the callback's, so LAN phones never see a button that cannot work.
- Native Google sign-in on mobile was skipped: it needs new libraries (`expo-auth-session` / `expo-web-browser`) and
  Android/iOS OAuth clients. Mobile users keep phone + password, which always comes with a phone.
- A Google donor's name: the Google display name, else the email's local part, else «متبرع Google». Locale `en` only
  if Google says so. WhatsApp consent stays off until the donor ticks it on the profile.

### Servers / cleanup
Dev DB reseeded (`demo:reset`). Stopped: web :3000 PID 6080 (the last `next start`; earlier web PIDs 11700, 6184); api instances 14764, 3876, 13968, 18504 (restarts
around resets and the dummy-env screenshots); the first, interrupted e2e run (PIDs 21404, 19716, 14352). Expo was not
started. Ports 3000/4000/8081 verified free. No `.playwright-mcp` folder was created. Untouched: the `@playwright/mcp`
node processes started at ~03:00 by another session.

### Needs human
- Create the Google Cloud OAuth client (README §5a): External consent screen in Testing with test users, a Web
  client with origin `http://localhost:3000` and redirect `http://localhost:3000/auth/google/callback`. Put the three
  values in `api/.env`, restart the API and check `/auth/google/enabled`.
- Test the real flow once with a real Gmail account: new donor → «ملفي» → add phone → donate; sign in again (linked);
  try a staff email (refused). This could not be tested here.
- LAN and phones: Google cannot redirect to `http://<LAN-IP>`; using Google from phones needs an HTTPS host name.
- A Google donor has no password, so they cannot use the mobile app (phone + password only) unless a "set password"
  feature is added later.

## P20 — Final checks and backup (SAFE)

**Status:** all Std checks green from a fresh GitHub clone; e2e **40 passed, 1 skipped** (after one web rebuild, see
"Flaky `next build`"); backup zip created and verified; README fixes `95640e9`; tag `v1.0-hackathon` on this report's
commit, pushed. Gate item 2 (real devices) is still open.
Run as the SAFE version: **nothing outside the temporary clone was deleted**. The deletion list and the exact commands are
below, for the team to run by hand.

### Fresh-clone checks
Cloned `https://github.com/hamidAlhaj/salamiyah-hackathon.git` (main `2bf81ee`, 970 files, network clone in ~60 s, no
retry or local fallback needed) into `%TEMP%\majlis-p20-clone-iqltjw`. Copied only the untracked `api/.env` and
`web/.env` from the working repo (contents never printed; `mobile/.env` = `copy .env.example .env` as README says).
`npm ci` ✓ in api, web, mobile and e2e (4 in parallel; no lockfile change).
- api: lint ✓ (no `--fix` changes, clone tree clean) · **392** tests in 31 suites ✓ (58 s) · build ✓ ·
  `prisma validate` ✓ · `prisma migrate status`: 6 migrations, "Database schema is up to date" (local `majlis_fund`)
- web: lint ✓ · prettier ✓ (`../api/node_modules/.bin/prettier --check "src/**/*.{ts,tsx,css}"` with `web/.prettierrc`;
  web has no Prettier of its own, as in b4f) · **53** tests in 13 files ✓ · build ✓
- mobile: `tsc --noEmit` ✓ · `expo lint` ✓ · `expo install --check` ✓ (typescript excluded by design) · `expo-doctor` 20/20 ✓
- e2e (from the clone, against the clone's `node dist/main` on :4000 started after `demo:reset`, and `next start` of
  the clone's build on :3000): first run stopped after step 2 failed (flaky build, below). After a rebuild, a
  fresh `demo:reset` and an API restart: **40 passed, 1 skipped** (LAN login, `E2E_LAN_URL` unset) in 13.5 min (the
  tests take about a minute; the rest is Playwright's known idle while it deletes the Chrome profiles).
- The real repo's working tree was not touched by the e2e run (`git status` before/after: clean, apart from this prompt's own README edit; no screenshots, `E2E_SCREENSHOTS` unset).
- **Flaky `next build` (found here, not fixed):** the clone's first web build (exit 0, "Compiled successfully", run
  while the api tests and mobile checks were also running) left one client component out of every
  `*_client-reference-manifest.js`: `src/app/(app)/dashboard/outbox/SendButton.tsx` (43 client modules instead of 44).
  `/dashboard/outbox` then answered with the error page ("Could not find the module … SendButton.tsx#SendButton in the
  React Client Manifest") and e2e step 2 failed (outbox list 0 instead of 3). A rebuild of the same sources produced
  the full manifest (44) and everything passed. SendButton is imported by both a Server Component (`page.tsx`) and a
  Client Component (`NextMode.tsx`), which is the likely trigger. No code change tonight (checks-only prompt). The real
  repo's current `web/.next` (13:06) is complete. See "Needs human" for the one-line check after every demo build.
- Environment note (not a repo issue): `next build` warns that it picked `C:\Users\Dragon\package-lock.json` as the
  workspace root because a stray lockfile sits in the user profile. Harmless; it also applies to the real repo. Remove
  that file if nothing in the home folder needs it.

### README fixes (newcomer walk-through)
Commit `95640e9` — `docs(readme): fresh-clone walkthrough fixes (repo URL, cd from root, API after demo:reset, status)`:
- §2 `git clone <repo-url>` → the real URL.
- §5 / §6 / §7 / §9 / "Checks before every push": every `cd` now says where it starts. Before, a newcomer still in
  `api/` after §4 typed `cd web` and failed; §9 and the checks chained `cd api …` then `cd web`/`cd e2e` in one shell.
- §9: start (or restart) the API **after** `demo:reset`; the overdue-case check runs 5 s after start and then every
  10 minutes, so an API started before the reset fails the SLA-alert test (the P22 first-run failure).
- Status line (P16 → `v1.0-hackathon`, P01–P22), docs list (reports 01–06, overnight report, screenshots).
- Everything else worked as written (env keys in `.env.example` match what the code reads; DB script, `migrate`,
  `demo:reset`, `start:prod`, `next start`).

### Backup zip
- **Use `C:\Users\Dragon\Desktop\hackathon-backup-2026-11-23-2.zip`** — 89,571,829 bytes (85.4 MB), **3,136 entries**
  (2,374 files = exactly the files on disk outside `node_modules/.next/dist/.turbo`; 0 entries from those folders).
- The plan's command (`tar.exe -a -c -f … --exclude=…`) produced `hackathon-backup-2026-11-23.zip` (89,553,853 bytes)
  but **lost every Arabic name**: Windows `tar.exe` wrote the names in the ANSI code page (Windows-1252), so the SAL
  folder and both root PDFs became `?????` (328 entries; contents intact, names not restorable, and `?` cannot be
  extracted on Windows). The `-2` zip adds `--options hdrcharset=UTF-8`; it was not overwritten, only superseded:
  ```powershell
  tar.exe -a -c -f "$HOME\Desktop\hackathon-backup-2026-11-23-2.zip" --options hdrcharset=UTF-8 --exclude=node_modules --exclude=.next --exclude=dist --exclude=.turbo .
  ```
- Verified: `tar.exe -tf` lists 3,136 entries; .NET `ZipFile` opens it with 328 Arabic names and 0 `?`; key paths present
  for every top-level item (`salamiyah-hackathon/.git/HEAD`, `README.md`, `api/prisma/schema.prisma`, `web/package.json`,
  `mobile/app.json`, `e2e/playwright.config.ts`, `sanad-crowdfunding/.git/HEAD`, `b4f-board-final/.git/HEAD`,
  `_analysis/05-execution-plan.md`, the SAL folder (324 entries = 230 files, same as on disk), both root PDFs).
  Extracted the PoC PDF, `schema.prisma`, SANAD and b4f READMEs and `api/.env` (.NET) plus the SAL README (`tar -x`) to a
  temp folder: all SHA-256 equal to the originals; temp folder deleted.
- The zip was made before this report's commits (they are on GitHub anyway).
- **It contains real `.env` files** (6: SAL `apps/api/.env`, SANAD `api/.env` and `web/.env`, NEW `api/.env`,
  `web/.env`, `mobile/.env`) and SANAD's/SAL's uploads. Keep it private; never upload or share it.

### §4 gate
| # | Gate | Status |
|---|---|---|
| 1 | Std checks green | ✓ from a fresh clone (above): api, web, mobile, prisma; e2e 40 + 1 skipped after one rebuild |
| 2 | 7-step demo walked on real devices | **Pending (human)**: not possible unattended. Playwright covers it in a browser |
| 3 | NEW pushed | ✓ `git fetch --prune`: `main` = `origin/main`; all 21 local branches (`docs-scope-change`, `p02`–`p19`, `p21`, `p22`) exist on origin at the same commit; tag `demo-ready` on origin; no stash. Origin also has `Badr's-branch` (not local; untouched) |
| 4 | Backup outside `hackathon/` | ✓ `hackathon-backup-2026-11-23-2.zip` (verified) |

### Read-only checks for the deletion list
- **Root PDFs:** both byte-identical to `docs/input/` (SHA-256): PoC `BB7E8900…E3D34F` (255,640 B); full spec `F77887DC…027528`
  (329,950 B; the copy in `docs/input/` dropped the " (1)").
- **`hackathon/_analysis/`:** 6 files. 01, 02, 02b, 03, 04 byte-identical to `docs/_analysis/`. `05-execution-plan.md`
  differs only because NEW kept editing it: the old file is an exact prefix of NEW's first commit `1f842f2` (which only
  appended "Decision updates (P01)"), so nothing is lost.
- **SANAD:** `main` clean, no stash, no tags; `git ls-remote` (read-only) shows all 12 local branches (`main`,
  `phase-1`…`phase-11`) on `github.com/hamidAlhaj/sanad-crowdfunding` at the same commits. Nothing fetched or pushed.
- **b4f:** clean, one branch, `main` = `origin/main` (`8eb592e`, `github.com/b4f-cohort8-salamiyah/b4f-board-final`).
  Its rule files are `README.md`, `api/README.md`, `web/README.md`, `.eslintrc.*`, `.prettierrc` (no CLAUDE.md). The four
  config files are identical to NEW's (apart from CRLF). The architecture rules, versions, commands, seed safety and
  session design are in `01-reference-b4f.md` (§1–§5, the 20 rules verbatim) and condensed in `CLAUDE.md`. Gaps, all
  minor and all kept in `01`: `CLAUDE.md` does not repeat the `LoggingInterceptor` rule (never log bodies/tokens), bcrypt
  10 rounds, or "same 401 for unknown phone and wrong password" (the code follows them). Nothing needs copying first.

### Deletion list (for the team, in the morning) — run in PowerShell, one block at a time
Each step has a "verify first" line; delete only if it prints the expected result. Nothing here has been run.

**0. Backup verified**
```powershell
Get-Item -LiteralPath "C:\Users\Dragon\Desktop\hackathon-backup-2026-11-23-2.zip" | Select-Object Name, Length
```
```powershell
(tar.exe -tf "C:\Users\Dragon\Desktop\hackathon-backup-2026-11-23-2.zip" | Measure-Object).Count
```
Expect 89571829 bytes and 3136. Optionally copy the zip to a private USB drive first. Then remove the broken first zip
(Arabic names lost):
```powershell
Remove-Item -LiteralPath "C:\Users\Dragon\Desktop\hackathon-backup-2026-11-23.zip" -Force
```

**1. Root PDFs** (verify: each line must print `True`)
```powershell
(Get-FileHash -LiteralPath "C:\Users\Dragon\Desktop\hackathon\مقترح مشروع منصة التمويل الجماعي الطبي ونموذج الهاكاثون (PoC).pdf").Hash -eq (Get-FileHash -LiteralPath "C:\Users\Dragon\Desktop\hackathon\salamiyah-hackathon\docs\input\مقترح مشروع منصة التمويل الجماعي الطبي ونموذج الهاكاثون (PoC).pdf").Hash
```
```powershell
(Get-FileHash -LiteralPath "C:\Users\Dragon\Desktop\hackathon\الوثيقة الشاملة لهندسة المنظومة والتحول الرقمي - المجلس الوطني الإسماعيلي في السلمية (1).pdf").Hash -eq (Get-FileHash -LiteralPath "C:\Users\Dragon\Desktop\hackathon\salamiyah-hackathon\docs\input\الوثيقة الشاملة لهندسة المنظومة والتحول الرقمي - المجلس الوطني الإسماعيلي في السلمية.pdf").Hash
```
```powershell
Remove-Item -LiteralPath "C:\Users\Dragon\Desktop\hackathon\مقترح مشروع منصة التمويل الجماعي الطبي ونموذج الهاكاثون (PoC).pdf" -Force
```
```powershell
Remove-Item -LiteralPath "C:\Users\Dragon\Desktop\hackathon\الوثيقة الشاملة لهندسة المنظومة والتحول الرقمي - المجلس الوطني الإسماعيلي في السلمية (1).pdf" -Force
```

**2. `hackathon/_analysis/`** (verify: `True` for 01, 02, 02b, 03, 04; `False` only for `05-execution-plan.md`, see above)
```powershell
Get-ChildItem -LiteralPath "C:\Users\Dragon\Desktop\hackathon\_analysis" -File | ForEach-Object { "{0} {1}" -f $_.Name, ((Get-FileHash -LiteralPath $_.FullName).Hash -eq (Get-FileHash -LiteralPath "C:\Users\Dragon\Desktop\hackathon\salamiyah-hackathon\docs\_analysis\$($_.Name)").Hash) }
```
```powershell
Remove-Item -LiteralPath "C:\Users\Dragon\Desktop\hackathon\_analysis" -Recurse -Force
```

**3. SAL `منصة التمويل الجماعي في السلمية/`** (1.3 GB with its pnpm `node_modules`; its `.env` and uploads go with it and
stay only in the zip; verify: prints 324)
```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem; $z = [IO.Compression.ZipFile]::OpenRead("C:\Users\Dragon\Desktop\hackathon-backup-2026-11-23-2.zip"); ($z.Entries | Where-Object { $_.FullName.StartsWith("./منصة التمويل الجماعي في السلمية/") }).Count; $z.Dispose()
```
```powershell
Remove-Item -LiteralPath "C:\Users\Dragon\Desktop\hackathon\منصة التمويل الجماعي في السلمية" -Recurse -Force
```

**4. SANAD `sanad-crowdfunding/`** (verify: the first prints nothing; the second prints 12 lines, all `same`)
```powershell
git -C "C:\Users\Dragon\Desktop\hackathon\sanad-crowdfunding" status --short
```
```powershell
$r = (git -C "C:\Users\Dragon\Desktop\hackathon\sanad-crowdfunding" ls-remote --heads origin) -replace "\t", " "; git -C "C:\Users\Dragon\Desktop\hackathon\sanad-crowdfunding" for-each-ref --format="%(objectname) refs/heads/%(refname:short)" refs/heads | ForEach-Object { if ($r -match [regex]::Escape($_)) { "same    $_" } else { "MISSING $_" } }
```
Optionally archive the GitHub repo afterwards (§4). Then:
```powershell
Remove-Item -LiteralPath "C:\Users\Dragon\Desktop\hackathon\sanad-crowdfunding" -Recurse -Force
```

**5. b4f `b4f-board-final/`** (P01 decision 5; verify: the first prints nothing, the second prints `True`)
```powershell
git -C "C:\Users\Dragon\Desktop\hackathon\b4f-board-final" status --short
```
```powershell
(git -C "C:\Users\Dragon\Desktop\hackathon\b4f-board-final" rev-parse main) -eq ((git -C "C:\Users\Dragon\Desktop\hackathon\b4f-board-final" ls-remote origin refs/heads/main) -split "\s+")[0]
```
```powershell
Remove-Item -LiteralPath "C:\Users\Dragon\Desktop\hackathon\b4f-board-final" -Recurse -Force
```

If a `Remove-Item` stops on a long or locked path inside `node_modules`, close editors/terminals in that folder and run
`cmd /c rd /s /q "\\?\<the same full path>"`. Afterwards `Get-ChildItem -LiteralPath "C:\Users\Dragon\Desktop\hackathon"`
should show only `salamiyah-hackathon`.

**Optional cleanup:** 25 leftover `%TEMP%\playwright_chromiumdev_profile-*` folders from e2e runs (Chrome
profiles Playwright did not finish deleting):
```powershell
Get-ChildItem -Path "$env:TEMP" -Directory -Filter "playwright_chromiumdev_profile-*" | Remove-Item -Recurse -Force
```

### Tag
Annotated tag `v1.0-hackathon` on `main` HEAD (this report's commit), pushed to origin. Why it is green: every Std
check passed from the fresh clone, and the e2e suite passed in full against a correct build; the one failure came from a
build that left a module out (an environmental flake, documented above, with a check for demo day). Backup verified.
Gate 2 (real devices) is a human step and does not block the tag; it does block the deletions. No tag was moved or
deleted (`demo-ready` stays on `f3bef9c`), no force-push, no branch deleted.

### Servers / cleanup
- Stopped by PID: first run api :4000 `11020` (`node dist/main`), web :3000 `18616` (`next start`), and the stuck first
  Playwright run `21728`/`12984`/`11840`; second run api `21604`, web `5708`. Ports 3000/4000/8081 verified free. Expo
  was not started. Untouched: the `@playwright/mcp` node processes from ~03:00 (another session).
- DB: `demo:reset` from the clone after the e2e, then **again from the real repo's `api/`**, because the clone's reset
  wrote the seed's 37 proof/receipt files into the clone's `api/uploads/` (now deleted); the second reset makes the DB
  match the real `api/uploads/` again (37 files).
- Temp clone `%TEMP%\majlis-p20-clone-iqltjw` deleted completely (first try, no locked files, no leftovers); the zip
  check folder was deleted too. Nothing else was deleted.

### Needs human
- Walk the 7-step demo once on two real phones (Expo Go + phone browser + collector page), DEMO.md checklist: gate 2.
- After **every** `npm run build` in `web/` (including `scripts/demo-start.ps1`), check the build before the demo; it
  must print `True`, otherwise run `npm run build` again:
  ```powershell
  Select-String -LiteralPath "C:\Users\Dragon\Desktop\hackathon\salamiyah-hackathon\web\.next\server\app\(app)\dashboard\outbox\page_client-reference-manifest.js" -Pattern "SendButton" -SimpleMatch -Quiet
  ```
  Or simply open `/dashboard/outbox` as the case officer once. A lasting fix (e.g. importing `SendButton` only from
  client code) is a small follow-up for the team.
- Run the deletion list above, in order, after gate 2.
- Keep `hackathon-backup-2026-11-23-2.zip` private (real `.env` files).
- §4's backup command in `05-execution-plan.md` loses Arabic names on Windows; use the `--options hdrcharset=UTF-8`
  version above for any future backup.

---

## Overall state (end of run)

- **Tags:**
  - `demo-ready` is on `f3bef9c` (P16) and pushed.
  - `v1.0-hackathon` is an annotated tag on `e1d702d` (P20 report commit) and pushed.
  - The commit that adds this summary comes after the tag. It changes only this report.
- **`main` = `origin/main`:**
  - Contains P01–P22.
  - All 21 local branches are on origin at the same commits.
  - No branch was deleted. Nothing was force-pushed.
  - No `.env` and no uploads are tracked.
- **Latest checks, from a fresh GitHub clone in P20:**
  - api: 392 tests.
  - web: 53 tests.
  - mobile: tsc, expo lint and expo-doctor 20/20.
  - e2e: 40 passed, 1 skipped (LAN login).
- **Backup:**
  - Use `C:\Users\Dragon\Desktop\hackathon-backup-2026-11-23-2.zip` (89,571,829 bytes, 3,136 entries, verified).
  - The first zip, `hackathon-backup-2026-11-23.zip`, lost the Arabic names. Delete it.
  - The backup holds real `.env` files, so keep it private.
- **Nothing outside the repo was deleted:** only the P20 temp clone and its temp extraction folder. All old folders and both root PDFs are still in `Desktop\hackathon\`.
- **Servers:**
  - All stopped. Ports 3000/4000/8081 are free.
  - The DB was reset with `demo:reset` from the real repo.
  - Some `@playwright/mcp` node processes started around 03:00 by a browser-tool session were left running. They are harmless; close them or reboot.

## What is left

1. **§4 gate item 2:** walk the 7-step demo once on two real phones (DEMO.md). This also covers the items no machine could check:
   - Expo Go on a phone;
   - the PWA install prompt;
   - the donor code in the native app;
   - the LAN login (`E2E_LAN_URL`).
2. **Run the deletion list**, only after item 1 (exact commands with verify-first checks are in the P20 section above):
   1. confirm the backup zip and delete the broken first zip;
   2. the two root PDFs;
   3. `hackathon\_analysis\`;
   4. `منصة التمويل الجماعي في السلمية\`;
   5. `sanad-crowdfunding\`, after the branch check;
   6. `b4f-board-final\`.
3. **Google sign-in** (P22):
   - Create the OAuth client per README §5a.
   - Fill `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_CALLBACK_URL` in `api/.env`, then restart the API.
   - Test with a Gmail test user.
   - Google won't redirect to a plain-HTTP LAN IP, so phones need an HTTPS hostname.
   - Google donors have no password, so they can't use the mobile app.
4. **Flaky `next build`:** run the one-line `SendButton` manifest check from the P20 section after every web build, or open `/dashboard/outbox` once. The lasting fix (import `SendButton` only from client code) is a small follow-up.
5. **Demo configuration:**
   - `DEMO_WHATSAPP_NUMBERS` in `api/.env` is empty, so the seed uses fictional alert numbers. Fill it for the live demo and never commit it.
   - Keep the 120 req/min per-IP API limit in mind: every web device on the LAN shares the PC's IP.
6. **Machine housekeeping:**
   - Exclude `%TEMP%\playwright_chromiumdev_profile-*` from antivirus real-time scanning. That causes the ~12-minute idle at the end of every e2e run.
   - Remove the 25 leftover profile folders (command in P20).
   - Remove the stray `C:\Users\Dragon\package-lock.json` (it triggers a harmless Next workspace-root warning).
   - P19 added github.com to `~/.ssh/known_hosts`.
   - Pushes over ~2 MB time out on this connection.
7. **Small follow-ups, not blocking:**
   - The mobile app still has the old light palette (`mobile/src/ui/theme.ts`, outside P21's scope).
   - Fix the §4 backup command in `05-execution-plan.md` to add `--options hdrcharset=UTF-8`.
   - The P18 `mobile-paused-390` screenshot shows only the top of the screen.
   - WhatsApp link preview of the OG card needs a public HTTPS URL to check.

## First 3 things to do in the morning

1. **Prove the demo on real devices (gate 2):**
   1. Follow DEMO.md "قائمة التحقق قبل العرض": VPN off, firewall open for 3000/4000/8081.
   2. Run `npm run demo:reset` in `api/`, then start the API **after** the reset.
   3. Build and start web, then run the `SendButton` manifest check. It must print `True`.
   4. Walk the 7 steps with Expo Go on phone 1 and the phone browser on phone 2.
2. **Secure the backup and clean up:**
   - Copy `hackathon-backup-2026-11-23-2.zip` to a private drive.
   - Then run the P20 deletion list in order, one block at a time. Each delete has a verify line first.
3. **Decide on Google sign-in for the demo.** If yes:
   - Create the OAuth client (README §5a) and fill the three `GOOGLE_*` keys in `api/.env`.
   - Restart the API and sign in once at `http://localhost:3000/login`.
   - Otherwise leave it off: the button stays hidden and nothing else changes.
