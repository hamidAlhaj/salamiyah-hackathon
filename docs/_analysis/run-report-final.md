# Final run report — 24 November 2026 (deadline 16:00 Asia/Damascus)

Start: about 00:45 Damascus time. `main` at `2901304`, working tree clean (an untracked review draft of my own was
moved out of the repo first). `origin/codex/b4f-session-20261123` is left untouched and not merged.

## Step 1 — rename to `backend/` and `frontend/` · branch `p25-rename`

- `git mv api backend` and `git mv web frontend` in one commit (history preserved; git-ignored local files such as
  `.env`, `uploads/` and `node_modules` moved with the folders on this machine and were not committed).
- Path-sensitive places updated: `.gitignore` (`backend/uploads/`), `scripts/demo-start.ps1`, the e2e config, helpers
  and tests (`06-google-signin` reads `backend/.env`), the shared-copy sync tests (`frontend/src/shared/shared.test.ts`,
  `backend/src/common/shared/shared.spec.ts`, `backend/src/notifications/links.spec.ts`), comments in the three
  byte-identical `enums.ts` copies and other source comments, `README.md` (layout, commands, project column),
  `DEMO.md`, `CLAUDE.md`. Routes such as `/api/docs` and the `lib/api/` folder are unchanged.
- `grep` for old `api/` and `web/` paths outside `docs/_analysis`, `docs/analysis` and `docs/input`: none left.
- Checks (clean `npm ci` in backend and frontend):

| Project | lint | tests | build / types |
|---|---|---|---|
| backend | ✔ | ✔ 31 suites / 392 tests | ✔ `nest build` |
| frontend | ✔ | ✔ 13 files / 53 tests | ✔ `next build` |
| mobile | ✔ `expo lint` | — | ✔ `tsc --noEmit` |
| e2e (after `demo:reset`, API restarted, production web) | — | ✔ 40 passed, 1 skipped (LAN test, needs `E2E_LAN_URL`), 0 failed | — |

  Note: the Playwright process did not exit after the last test (browser close); it was stopped by hand after all
  results were printed.

## Step 2 — merge `docs-submission` into `main`

- `git merge --no-ff origin/docs-submission`: no conflicts (the branch only touched `docs/`).
- Old `api/` / `web/` paths inside the merged docs and tools changed to `backend/` / `frontend/`:
  `docs/postman/tools/compare-endpoints.cjs` (now reads `backend/src`), `docs/tools/swagger-audit.cjs`,
  `docs/postman/README.md`, `run-collection.cjs`, the system map (EN/AR), diagram labels, the swagger audit and the
  compliance checklist (folder structure row now **done**, commit `159edd4`). Next.js route handlers under
  `app/api/…` in the frontend map are real route names and stay.
- Re-run: `compare-endpoints.cjs` → 101 controllers = 101 collection requests; `swagger-audit.cjs` → 101 endpoints,
  376 gaps (unchanged); diagrams rebuilt; system map EN 9 / AR 9 pages; Word files rebuilt: Athar briefs 1 + 1 page,
  analysis 5 + 5 pages.
- Application code is unchanged by this step, so the Step 1 checks (lint, 392 + 53 tests, builds, e2e 40 passed /
  1 skipped) still apply.

## Step 3 — general council fund, minimal version · branch `p26-council-fund`

Contract first: `docs/fund-contract.md`. Then:

- **Migration `council_fund` (additive only):** `campaigns.is_general_fund` (default false), `pledges.fund_amount` and
  `pledges.held_amount` (Decimal(14,2), default 0). Old pledges keep everything with their campaign.
- **Backend:** `pledges/allocation.ts` (pure rules: remaining need, quote, plan, approval split) +
  `allocation.service.ts` (campaign row locked with `SELECT … FOR UPDATE`; unpaid transfer pledges reserve their share
  for 72 h). Two new endpoints: `GET /campaigns/{id}/allocation` (public preview) and
  `POST /pledges/{id}/allocation-decision` (held money → fund). Transfer, demo and cash pledges accept
  `surplusChoice` + `expectedCampaignShare` (409 `campaign_complete` / `surplus_choice_required` / `allocation_changed`).
  Finance approval (Serializable transaction) never takes a campaign above its target: the surplus goes to the fund
  only if the donor chose it, otherwise it is held for the donor's decision. Ledgers count campaign shares only; the
  fund also shows other campaigns' fund shares; the transparency counts exclude the fund (7 campaigns stay 7).
  Notifications mention the fund share and any held money. `PledgeView`, the official receipt and the finance queue
  show `campaignShare` / `fundShare` / `heldAmount`.
- **Seed:** an inactive system category `GENERAL_FUND` and the fund campaign `general-fund` (no target, ongoing,
  zero balance), so the seeded totals in DEMO.md are unchanged.
- **Web:** surplus notice before any pledge (`AllocationNotice`, `role="alertdialog"`, focus moved, AR/EN), split on
  the result, receipt, «تبرعاتي» (with the held-money button) and the finance queue; fund call to action on the home
  page and in the header; the fund page shows no target; a full campaign's donate page points to the fund;
  `?amount=` prefills the fund's donate page.
- **Mobile:** the same notice on the pledge screen, fund button on the home screen, fund page without target, split in
  «تبرعاتي» and on the result.
- **Tests:** new `allocation.spec.ts` (9 cases: 30,000
  remaining + 50,000 offered split, remaining-only, cancel, exact target, complete, stale quote, approval never
  overfunds, held money, uncapped fund). Web: `AllocationNotice.test.tsx` (2). e2e: `07-council-fund.spec.ts` (4).
- **Docs:** README «Main Features» + «Backend API Overview» (103 endpoints), DEMO.md fund section, Postman rebuilt
  (103 = 103 controllers), Swagger audit regenerated (103 endpoints, 384 gaps), ERD updated, Word files rebuilt
  (FR15; briefs 1 + 1, analysis 5 + 5 pages), system map 9 + 9 pages.

- **Checks on the branch (final):** backend lint ✔, 32 suites / **401 tests** ✔, build ✔ · frontend lint ✔,
  14 files / **55 tests** ✔, `next build` ✔ · mobile `tsc --noEmit` ✔, `expo lint` ✔ · e2e after `demo:reset`
  and an API restart: **44 passed, 1 skipped** (LAN test), 0 failed, exit 0 (13.4 min).
- Fixes on the way: the fund spec first reused the scenario's receipt image (the API correctly refused a duplicate
  receipt) and expected the roof campaign to become FUNDED although 250,000 of council cash is still reserved; the
  spec now uses its own image and checks the «اكتملت هذه الحملة» notice. On this machine a failing Playwright run
  does not exit by itself (browser close hangs); the hung runs were stopped by hand and rerun.

**Step 3 result:** merged into `main` (fast-forward) and pushed as `1d16e10`
`feat(api): general council fund with surplus allocation on web and mobile`.

## Part B — final rename to «أثر» / Athar with the new logo · branch `p28-athar-rename`

- **Brand files** (`docs/brand/`, 12 files) copied to `frontend/public/brand/` and `mobile/assets/brand/`.
- **Web:** `Logo` = the ripple mark (`/brand/athar-icon.svg`) + wordmark «أثر» (header, login brand panel, receipt);
  `app/icon.svg` and `app/apple-icon.png` = the Athar icon (the old `apple-icon.tsx` star renderer removed); PWA
  install icons render the Athar PNG (maskable on the brand green); manifest name «أثر: تبرعات المجلس المحلي في
  السلمية», short name «أثر»; OG image shows the Athar mark and "Athar"; the offline page has the mark inline (works
  without the network). The old eight-point-star logo mark is gone from the UI; the decorative `StarLattice` pattern on
  the green panels stays (it is not the logo).
- **Mobile:** `app.json` name «أثر», slug `athar`, scheme `athar`, icon / iOS icon / web favicon = Athar icon,
  Android adaptive icon (Athar icon on `#15803D`), splash = `athar-logo.png` on white and `athar-logo-dark.png` on
  `#0B3D2A` in dark mode; the home screen header shows the mark + «أثر».
- **Text:** web messages ar/en, mobile i18n, page metadata, `siteName`, Swagger title `Athar API` (and the startup
  log), the service-worker cache (`athar-offline-v1`; old caches are deleted on activate), theme / install-banner
  storage keys (`athar-theme`, `athar-install-dismissed`), CSV file name, demo-start window titles, README, DEMO.md,
  CLAUDE.md, package names (`athar-api`, `athar-web`, `athar-mobile`, `athar-e2e`, also in each lockfile's own name
  fields) and everything under `docs/` (Word files, system map AR/EN + PDFs, diagram tools, Postman name and README,
  Swagger audit, compliance checklist, submission README). The "app UI still shows the earlier name" notes were
  removed. `docs/_analysis/README.md` says: "Earlier working names: Majlis Fund, Madad — final name: Athar / أثر".
- **Internal, unchanged, not visible to users:** the database `majlis_fund` and its role `majlis` (`.env`,
  `.env.example`, `dev-db-setup.sql`, the seed-safety check), the shared demo password `Majlis@2026`, and the case
  tracking prefix `MF-YYYY-XXXXX` (stored data, the track page format and the tests depend on it). The study guide
  lives on the separate `docs-study` branch and was not changed here.
- **Grep** (`majlis fund|مجلس فند|madad|مدد`, case-insensitive) over backend/, frontend/, mobile/, docs/, e2e/,
  scripts/, README.md, DEMO.md, CLAUDE.md — excluding docs/_analysis, docs/analysis, node_modules, .next, dist and
  lockfiles: **no match**. The only remaining mention is the line in `docs/_analysis/README.md`.
- **Rebuilt:** Postman from the live API (title `Athar API`, 103 = 103 controllers), Swagger audit, diagrams, system
  map (EN 9 / AR 9 pages), Word files with `--team-en Athar --team-ar أثر`: briefs **1 + 1** page, analysis **5 + 5**.
- **Screenshots** in `docs/screenshots/athar/`: web home light/dark, login light/dark, web home on a phone, and the
  mobile home (Expo web, phone viewport).
- **Checks on the branch:** backend lint ✔, 32 suites / **401 tests** ✔, build ✔ · frontend lint ✔ (0 warnings),
  **55 tests** ✔, `next build` ✔ · mobile `tsc --noEmit` ✔, `expo lint` ✔, `expo config` resolves the new icon and
  splash · e2e after `demo:reset` and an API restart: **44 passed, 1 skipped** (LAN test), 0 failed, exit 0.
- All servers started for this run (API, web, Expo web) were stopped; the local database was left freshly reset.
