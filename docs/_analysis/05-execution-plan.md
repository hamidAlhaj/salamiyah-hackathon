# 05 — Phase 2 Execution Plan: `salamiyah-hackathon/`

> Plan only: nothing here has been executed. Inputs: 01 (b4f reference), 02 (alignment), 02b (Salamiyah inventory),
> 03 (Sanad salvage), 04 (requirements gap), plus the **final team decisions** in the request (not debated here).
> Short names: **SAL** = `منصة التمويل الجماعي في السلمية/`, **SANAD** = `sanad-crowdfunding/`, **B4F** = `b4f-board-final/`,
> **NEW** = `salamiyah-hackathon/` (does not exist yet; checked).

---

## 1. Security check: `sanad-crowdfunding/`

Commands used, all read-only and local: `git status`, `git branch -a`, `git remote -v`, `git ls-files`,
`git log --all -- '*.env*'`, `git log --all --name-only`, `git check-ignore -v`, and a `git grep` over every commit that
printed only **key names and value lengths**. No secret value was printed or written.

| Check | Finding |
|---|---|
| `.env` tracked now? | **No.** Tracked env files are only `api/.env.example` and `web/.env.example` |
| `.env` anywhere in history? | **No.** Across all 92 commits and all 12 branches, the only env paths ever committed are the two `.env.example` files (commits `8d8e91b`, `9adc724`, `931e361`) |
| Secret-looking values in history | `JWT_SECRET` (2 distinct values) and `DATABASE_URL` (2 distinct values) appear only in `api/.env.example` and `README.md`, and all four match placeholder patterns. The local `api/.env` values **differ** from the example: that file holds the real local secrets, on disk only |
| `.gitignore` | Root `.gitignore` lines 5–7: `.env`, `.env.*`, `!.env.example`; line 10: `api/uploads/`. `git check-ignore` confirms `api/.env`, `web/.env` and `api/uploads/private` are ignored |
| Uploads tracked? | No |
| Working tree | Clean; `main` is level with `origin/main` |
| Remote | `origin` = `https://github.com/hamidAlhaj/sanad-crowdfunding.git` (fetch + push). All 12 local branches also exist on the remote |
| Repo visibility | **Unknown.** `gh` is not installed on this machine, and nothing was queried over the network |

**Verdict:** no secret has leaked through git. **No history purge is needed.**

**Recommended steps (for the team, not performed):**
1. **Do not copy** `SANAD/api/.env`, `SANAD/web/.env` or `SANAD/api/uploads/` into NEW (also enforced in §3 and §4).
2. Check the GitHub repo's visibility in its Settings. If it should no longer be developed, **archive** it
   (Settings → Archive). It contains only placeholders, so making it private is optional.
3. Rotate secrets only where they were **reused**:
   - If the `JWT_SECRET` in `SANAD/api/.env` was ever used on a deployed server, or the same string is used in another project, replace it there.
   - If the Postgres password in `SANAD/api/.env`'s `DATABASE_URL` is shared with another local or remote database (for example the machine's installed PostgreSQL), change that password.
   - Otherwise deleting the file with the folder (§4) is enough.
4. NEW generates its own secrets: `JWT_SECRET` and `NATIONAL_ID_HMAC_KEY` from 64 random bytes each. They live only in
   `api/.env`, never in chat, commits or screenshots.
5. Optional: run a secret scanner (e.g. gitleaks) on NEW before the first push. It is a separate tool install, so it needs the team's OK.
6. The §4 backup zip will contain `SANAD/api/.env`. Keep the zip private and local, and never upload it.

---

## 2. Scope tiers and the cut line

> **Superseded (2026-11-22):** the tiers below describe the old medical-only plan. The current tiers and cut lines are the
> rewritten §7 (Tier 1 = P05–P16) per `06-scope-change-hackathon-idea.md`; see "Decision updates (scope change)" at the end.

Effort is in **developer-days** (1 dd ≈ 8 h) for one developer familiar with the code. 02's alignment estimate (45–85 h)
is folded into Tier 1, with 03 option B replacing 02's W5/W6 Tailwind work.

### Tier 1: the 7-step demo works end to end (04 §7) — **≈ 17–24 dd**

| Block | Items | Effort |
|---|---|---|
| Foundation | NEW repo, git, docs, docker-compose, `.nvmrc` | 0.5 |
| API alignment (02 §5.1–5.6) | Nest 10 / Prisma 5.22 / passport-jwt / bcrypt; uuid + `@@map`; `CollectionPointType` + `contactName` (03 §5); `RoleAccessService`; b4f filter + interceptor; Jest; copied shared code; bug **B1** | 4–6 |
| Web alignment + theme (02 §5.4, 03 option B) | b4f session / apiFetch / Server Actions / Redux / Toast; cookie i18n (no middleware); route groups; SANAD theme + `components/ui` + fonts with SAL green brand; port all SAL pages; Vitest | 4–6 |
| Mobile alignment | npm standalone, TS 5.9.3, ESLint 8, Bearer only (no refresh), shared copy | 0.5–1 |
| Demo step 2 | R14 outbox + donor WhatsApp opt-in + urgent alert on publish + outbox screen with `wa.me` buttons | 1 |
| Demo step 3 | **B3** demo amounts kept separate; R5 live progress (verified / received-pending / demo segments); R9 demo checkout with "Demo" badge on web and mobile | 1.5 |
| Demo step 4 | R8 web donate flow (SANAD `DonationForm` + SAL two-phase API); R10 donor picks a collection point for cash (api + web + mobile) | 2 |
| Demo step 5 | R11 collector PWA pages + endpoints; R12 pending segment; acknowledgement outbox message; PWA manifest + offline page | 2–2.5 |
| Demo step 6 | R15 official receipt message on approval; R16 QR on receipt; collector-channel official receipts; bug **B2** | 1 |
| Demo step 7 | R23 disbursement UI + «تم الإنجاز»; R29 platform transparency page + `/stats/transparency` | 1.5–2 |
| Demo seed + smoke | Seed for every step, `DEMO.md`, Playwright smoke | 0.5–1 |

```
──────────────────────────── CUT LINE A ────────────────────────────
Everything above is required to demo. Below can be dropped under time pressure.
```

### Tier 2: remaining Must items — **≈ 4–5 dd**
R24 users admin, R25 hospitals admin (+ `PATCH`), R26 collection-points admin (+ `PATCH`, type select, collector
assignment), R18 admin campaigns (ongoing campaign create, status/pause, updates), **C5** ADMIN may publish, R22 violations
log + invisible suspension + reactivation, R4 mobile priority filter.
*If dropped:* the demo still runs from the seed. Setup screens are shown in Swagger only.

```
──────────────────────────── CUT LINE B ────────────────────────────
```

### Tier 3: Should / Could — **≈ 5–6 dd**
R27 notifications bell (web + mobile), R28 audit history panel, R20 SLA alerts to supervisors, R30 admin overview +
sidebar badges, R3/**C4** optional redacted report image, R7 donor code `D-XXXXXX`, OG image + share buttons, donor-side
PWA install prompt, friendly staff-login message on mobile, final UI/a11y polish.

### Decisions applied from 04 (for team review)
| Ref | Applied as |
|---|---|
| C1 | Pledge & Verify is the real path; ShamCash/PayPal/Visa simulation on web **and** mobile with a "Demo" badge (team decision) |
| C2 | Collector confirm → COLLECTED + "received, pending verification" bar segment + instant acknowledgement; official receipt only after FINANCE_VERIFIER (team decision) |
| C3 | Monthly box collection = **Future Scope** (team decision; overrides 04's option A) |
| C4 | Optional, separately uploaded **redacted** report image (team decision); Tier 3 |
| C5 | ADMIN **and** CASE_OFFICER may publish; joint approval = Future (04 rec.) |
| C6 | Internal outbox + one-tap `wa.me` (team decision) |
| C7 | Medical only; orphans/renovation/food/education = Future (04 rec.) |
| C8 | Collector dashboard built; wording expresses "clearance of responsibility" («براءة ذمة»), never "suspicious"/"suspended" toward collectors; the role can be given to staff/volunteers (04 rec.) |
| C9 | Per-campaign currency (SYP default, USD allowed), no conversion (04 rec.) |
| 04 §2 | Delete: refresh flow, next-intl routing, MinIO, unused zod schemas/enum arrays/`OptionalUser`, Expo template images, `__pycache__`. Keep: import wizard (STAFF menu), council pledge API (no UI), `CaseRoute` values, cancel pledge, USD |
| 04 §3 | B1 public `/health`; B2 rejection link → mobile `/receipt/{pledgeId}`; B3 demo shown separately |

---

## 3. Migration map

Operations: **copy** = as-is · **copy+** = copy with changes · **rewrite** = same purpose, new code · **new** = build new.
**Never copied:** any `.env` (SAL `apps/api/.env`, `apps/web/.env.local`, SANAD `api/.env`, `web/.env`), any `uploads/`,
`node_modules/`, `.next/`, `dist/`, `.turbo/`, `*.tsbuildinfo`, `pnpm-lock.yaml`, `package-lock.json` (regenerated).

### Root and docs
| Source | Destination in NEW | Op |
|---|---|---|
| — | `.gitignore`, `.nvmrc` (`24.12.0`), `README.md`, `CLAUDE.md` (§6) | new |
| SAL `docker-compose.yml` | `docker-compose.yml` (Postgres 16 only, MinIO removed, host port **5433** to avoid clashing with the installed PostgreSQL) | copy+ |
| SAL `.editorconfig` | `.editorconfig` | copy |
| Root PDFs (byte-identical to SAL `docs/input/poc_proposal_ar.pdf` and `system_spec_ar.pdf`, md5 checked) | `docs/input/` (keep the descriptive Arabic file names; one copy only) | copy |
| SAL `docs/input/brief_ar.pdf`, `brief_en.pdf`, `idea.jpg`, `meeting.ogg` | `docs/input/` | copy |
| SAL `docs/analysis/*.md` | `docs/analysis/` | copy |
| `hackathon/_analysis/*.md` | `docs/_analysis/` | copy |
| SAL `scripts/transcribe.py` | `docs/tools/transcribe.py` (no `__pycache__`) | copy |
| SAL root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.npmrc`, `packages/tsconfig`, `packages/eslint-config` | — | drop (inlined per app) |

### api/
| Source | Destination | Op |
|---|---|---|
| — | `api/package.json` (exact 01 §1.2 versions + SAL extras: throttler 6.8.0, sharp, exceljs, csv-parse, zod only if kept for imports), `package-lock.json`, `.eslintrc.js`, `.prettierrc`, `tsconfig*.json`, `nest-cli.json`, `.env.example` | new (from B4F templates) |
| B4F `api/src/main.ts` | `api/src/main.ts` (CORS list from `WEB_ORIGIN`, Swagger `api/docs`) | copy+ |
| B4F `common/filters/http-exception.filter.ts`, `common/interceptors/logging.interceptor.ts`, `common/decorators/current-user.decorator.ts` (+ `role`) | `api/src/common/…` | copy+ |
| B4F `auth/jwt.strategy.ts`, `auth/jwt-auth.guard.ts`, `auth/auth.module.ts` | `api/src/auth/…` (validate reloads `id, role, isActive`) | copy+ |
| SAL `apps/api/src/auth/*` | `api/src/auth/` (phone login, no refresh, bcrypt, `{ accessToken, user }`) | rewrite |
| SAL `common/guards/*`, `decorators/roles.decorator.ts`, `public.decorator.ts`, `OptionalUser` | — | drop |
| — | `api/src/common/access/role-access.service.ts` | new (02 §5.2) |
| SAL `campaigns, cases, pledges, verifications, disbursements, notifications, audit, imports, storage, users, hospitals/lookups, prisma, health` | same module folders | copy+ (class-level guards, `@Roles` → `requireRole`, DTOs inline → `dto/` files, Prisma 5) |
| SAL `common/utils/*`, `common/dto/*` | `api/src/common/…` | copy |
| SAL `packages/shared/src/{enums,constants,types,utils}.ts` | `api/src/common/shared/` (drop unused zod schemas and enum arrays) | copy+ |
| SAL `prisma/schema.prisma` | `api/prisma/schema.prisma` (uuid `@db.Uuid`, `@map`/`@@map` snake_case, `CollectionPointType`, `contactName`, `OutboundMessage`, `User.whatsappOptIn`, `PaymentMethodConfig`, `BeneficiaryNote` (Tier 2), `DocumentKind.PUBLIC_REPORT` (Tier 3)) | copy+ |
| SAL `prisma/migrations/*` | `api/prisma/migrations/<new>_init` (regenerated under 5.22; keep the `official_receipt_seq` SQL) | rewrite |
| SAL `prisma/seed.ts` | `api/prisma/seed.ts` (ts-node, demo data for §7 P14, B4F-style DB-URL safety guard) | copy+ |
| SAL `test/core.test.ts` | `api/src/common/shared/shared.spec.ts` + new auth/role specs | rewrite (Jest) |
| — | `api/src/outbox/*`, `api/src/stats/*`, `api/src/collector/*` (or inside pledges), `api/src/payment-config/*` | new |
| SANAD `api/src/stats/stats.service.ts` (aggregate style) | `api/src/stats/stats.service.ts` | rewrite against SAL schema |

### web/
| Source | Destination | Op |
|---|---|---|
| — | `web/package.json` (01 §1.3 versions), `.eslintrc.json`, `.prettierrc`, `vitest.config.ts`, `vitest.setup.ts`, `tsconfig.json`, `next.config.js`, `.env.example` | new (B4F templates) |
| SANAD `web/tailwind.config.ts`, `web/src/app/globals.css`, `postcss.config.js` | same paths (brand scale + `--ring/--accent*` → SAL green) | copy+ |
| SANAD `web/src/components/ui/*` (Button, Field, Badge, Card, StatCard, ProgressBar, Tabs, EmptyState, ErrorState, ThemeToggle, Logo) | `web/src/components/ui/` | copy+ (labels via i18n, rebrand) |
| B4F `components/ui/{FormParts,States,Modal,ConfirmDialog,ToastViewport}.tsx` | `web/src/components/ui/` | copy+ |
| B4F `lib/session/index.ts`, `lib/api/client.ts`, `lib/actions/validation.ts`, `store/*`, `context/ToastContext.tsx` | same paths | copy+ |
| SANAD `context/ThemeContext.tsx` | `web/src/context/ThemeContext.tsx` (b4f `useTheme()` contract) | copy+ |
| SANAD `app/lang/route.ts`, `lib/i18n/server.ts` pattern, `components/layout/LanguageSwitch.tsx` | `web/src/app/lang/route.ts`, `web/src/i18n/request.ts` (next-intl, cookie locale, no routing) | copy+ |
| SAL `apps/web/messages/{ar,en}.json` | `web/messages/` | copy+ |
| SAL `apps/web/src/app/[locale]/*` pages | `web/src/app/(public)/…`, `(auth)/login`, `(app)/dashboard/{finance,cases,cases/[id],intake,imports}` | copy+ (restyle on `ui/`, Server Actions per resource) |
| SAL `app/api/files/[kind]/[id]/route.ts` | same (token via `lib/session`) | copy+ |
| SAL `src/middleware.ts`, `lib/auth-cookies.ts`, `i18n/routing.ts`, `i18n/navigation.ts` | — | drop |
| SANAD `components/donations/DonationForm.tsx` | `web/src/components/pledges/PledgeForm.tsx` (two-phase, no tips/cents, demo methods, cash → collection-point picker) | copy+ |
| SANAD `components/campaigns/LiveCampaign.tsx` + `app/campaigns/[slug]/live/route.ts` | `web/src/components/campaigns/LiveProgress.tsx` + `app/(public)/campaigns/[slug]/live/route.ts` | copy+ |
| SANAD `app/transparency/page.tsx` | `web/src/app/(public)/transparency/page.tsx` | copy+ |
| SANAD `public/sw.js`, `public/offline.html`, `app/manifest.ts`, `app/pwa-icons/[name]/route.tsx`, `app/apple-icon.tsx`, `app/icon.svg`, `components/layout/ServiceWorkerRegister.tsx` | same paths (rebranded) | copy+ |
| SANAD `components/payment-methods/PaymentMethodForm/Row`, `categories/CategoryForm/Row` | `web/src/components/admin/{Hospital,CollectionPoint,User,PaymentConfig}{Form,Row}.tsx` | copy+ (Tier 2) |
| SANAD `components/layout/Sidebar.tsx`, `app/(app)/admin/page.tsx` | `web/src/components/layout/Sidebar.tsx`, `app/(app)/admin/page.tsx` | copy+ (Sidebar Tier 1 without badges; overview Tier 3) |
| SANAD `components/campaigns/AdminCampaignActions.tsx`, `CampaignUpdateForm.tsx`, `UpdatesTimeline.tsx` | `web/src/components/campaigns/*`, `components/disbursements/*` | copy+ |
| SANAD `app/campaigns/[slug]/opengraph-image.tsx`, `components/campaigns/ShareButtons.tsx`, `components/home/HeroArt.tsx` | same | copy+ (Tier 3) |
| — | `web/src/app/(app)/collector/*`, `(app)/outbox`, `(app)/dashboard/disbursements`, receipt QR component | new |

### mobile/
| Source | Destination | Op |
|---|---|---|
| SAL `apps/mobile/*` (`app.json`, `src/`, `assets/` minus template images, `tsconfig.json`) | `mobile/` | copy+ |
| SAL `apps/mobile/package.json` | `mobile/package.json` (TS 5.9.3, ESLint 8.57.1 + `eslint-config-expo` legacy, no `workspace:*`) | copy+ |
| SAL `apps/mobile/eslint.config.js` | `mobile/.eslintrc.js` (`extends: 'expo'`) | rewrite |
| SAL `src/lib/api.ts` | same (Bearer only, 401 → logout → login) | copy+ |
| SAL `packages/shared/src` (used parts) | `mobile/src/shared/` | copy+ |
| SAL `apps/mobile/.claude/`, `.vscode/`, `AGENTS.md`, `LICENSE` | — | drop (root CLAUDE.md governs) |

---

## 4. Deletion list

**Gate:** delete nothing until **all** of these are true:
1. In NEW: `npm run lint && npm test && npm run build` pass in `api/` and `web/`; `npx tsc --noEmit && npx expo lint` pass in `mobile/`.
2. The 7-step demo (04 §7) has been walked through once on real devices.
3. NEW is pushed to GitHub.
4. A backup zip of the whole `hackathon/` folder exists **outside** it. Reinstallable dependencies are excluded; everything else, including `.env` files, is kept. Run from `Desktop\hackathon`:

```powershell
tar.exe -a -c -f "$HOME\Desktop\hackathon-backup-2026-11-21.zip" --exclude=node_modules --exclude=.next --exclude=dist --exclude=.turbo .
```

Then check that it opens. Keep it private, because it contains SANAD's real `.env` (§1).

| Delete | When | Note |
|---|---|---|
| `منصة التمويل الجماعي في السلمية/` (SAL) | After the gate | Everything useful is mapped in §3. Its `.env` files and `apps/api/uploads/` are deleted with it, never copied |
| `sanad-crowdfunding/` (SANAD) | After the gate **and** after confirming GitHub has every branch (verified level today) | `api/.env` and `api/uploads/` are deleted with it, **never copied**. Optionally archive the GitHub repo |
| Root PDFs `مقترح مشروع … (PoC).pdf`, `الوثيقة الشاملة … (1).pdf` | After the gate | Byte-identical copies live in NEW `docs/input/` |
| `hackathon/_analysis/` | After the gate | Copied to NEW `docs/_analysis/` |
| `b4f-board-final/` | **Not in this phase.** Keep it as the read-only binding reference until the hackathon ends | Open question §9 |

---

## 5. Git plan

**`.gitignore` (NEW root)**
```gitignore
# dependencies / build output
node_modules/
.next/
out/
dist/
build/
.turbo/
.expo/
web-build/
coverage/
*.tsbuildinfo
# env: never commit secrets
.env
.env.*
!.env.example
# runtime files
api/uploads/
uploads/
*.log
# OS / editor
.DS_Store
Thumbs.db
.vscode/
__pycache__/
# mobile native / signing
mobile/android/
mobile/ios/
*.jks
*.keystore
*.p8
*.p12
*.mobileprovision
expo-env.d.ts
```

**`.env.example` per app** (placeholders only)

| File | Keys |
|---|---|
| `api/.env.example` | `DATABASE_URL="postgresql://majlis:majlis_dev@localhost:5433/majlis_fund?schema=public"`, `PORT=4000`, `WEB_ORIGIN="http://localhost:3000,http://localhost:8081"`, `JWT_SECRET="<generate 64 random bytes>"`, `JWT_EXPIRES_IN="8h"`, `NATIONAL_ID_HMAC_KEY="<generate>"`, `STORAGE_LOCAL_DIR="uploads"`, `PUBLIC_WEB_URL="http://localhost:3000"`, `DEMO_MODE="true"`, `SLA_DAYS=7` (Bemo account details move to the seeded `PaymentMethodConfig`) |
| `web/.env.example` | `NEST_API_URL="http://localhost:4000"`, `SITE_URL="http://localhost:3000"` (server-only; used for share/QR links), `NODE_ENV="development"` |
| `mobile/.env.example` | `EXPO_PUBLIC_API_URL="http://<your-LAN-IP>:4000"`, `EXPO_PUBLIC_SITE_URL="http://<your-LAN-IP>:3000"` |

**Branch model (small team)**
- `main` is always runnable. Branch protection: no direct pushes, PR + 1 review, checks green.
- One short-lived branch per §7 prompt: `p05-web-alignment`, `p11-collector-pwa`, … Merge with **squash** within a day or two, then delete.
- Parallel work only on prompts whose files don't overlap (§7 "can run in parallel"). Rebase on `main` before opening the PR.
- Tag `demo-ready` when Tier 1 passes the walkthrough; tag `v1.0-hackathon` at submission.

**Commit messages:** `type(scope): summary` in plain English on one line, under ~100 characters. Types: `feat`, `fix`,
`refactor`, `test`, `docs`, `chore`; scopes: `api`, `web`, `mobile`, `docs`, `repo`.
Example: `feat(web): collector PWA confirm-received page with pending segment`. Never commit `.env` or uploads; review `git status` before every commit.

**Creating the GitHub repo** (`gh` is not installed yet)
```powershell
winget install --id GitHub.cli -e
```
```powershell
gh auth login
```
Run from `Desktop\hackathon\salamiyah-hackathon` after the first commit (`<owner>` = the team account or organisation):
```powershell
gh repo create <owner>/salamiyah-hackathon --private --source . --remote origin --push
```

**README "run it locally" (Windows-first)**
1. Install: Git, **Node 24.12.0** (nvm-windows: `nvm install 24.12.0` then `nvm use 24.12.0`), Docker Desktop, the Expo Go app on the phone.
2. `git clone <repo-url>` then `cd salamiyah-hackathon`.
3. Database: `docker compose up -d` (Postgres on host port **5433**).
4. API: `cd api` → `copy .env.example .env` (fill in the secrets) → `npm ci` → `npx prisma migrate dev` → `npm run seed` → `npm run start:dev` (Swagger: `http://localhost:4000/api/docs`).
5. Web: `cd web` → `copy .env.example .env` → `npm ci` → `npm run dev` → `http://localhost:3000`.
6. Mobile: `cd mobile` → `copy .env.example .env`. Set the PC's LAN IP (`ipconfig` → IPv4) → `npm ci` → `npx expo start` → scan the QR code with Expo Go.
   Allow Node through Windows Firewall on ports 4000, 3000 and 8081 (private network).
7. Demo logins: printed by the seed (`DEMO.md` lists the role → phone mapping).
8. Before pushing: `npm run lint && npm test && npm run build` in `api/` and `web/`; `npx tsc --noEmit && npx expo lint` in `mobile/`.

---

## 6. Draft `CLAUDE.md` for NEW

```markdown
# Majlis Fund (مجلس فند) — Salamiyah Medical Crowdfunding · Hackathon PoC

Read this file before any task. Requirements: `docs/input/` (PoC proposal = primary). Analysis: `docs/_analysis/` (01–05).

## Context
- Platform for the Ismaili Council in Salamiyah, Syria: publish vetted medical cases, collect pledges, verify money,
  pay hospitals directly, show transparency. Deliverables: web (Next.js) + donor mobile app (Expo).
- **Scope: medical only.** Orphans, home repair, food baskets, education, monthly box collection, joint approval,
  Aga Khan transfers, monthly reconciliation = Future Scope (mention only, never build).

## Repository
- `api/` NestJS · `web/` Next.js · `mobile/` Expo. Three separate npm projects, each with its own package-lock.json.
- No shared packages. Enums/types are copied into `api/src/common/shared`, `web/src/shared`, `mobile/src/shared`;
  change all three plus `schema.prisma` together (the api enum-sync test must pass).
- npm only (no pnpm, no turbo, no workspaces). Node 24.12.0 (`.nvmrc`, `engines`).

## Pinned versions (exact; never upgrade or add a major without a team decision)
- api: NestJS 10.4.22, @nestjs/jwt 10.2.0, @nestjs/passport 10.0.3, passport-jwt 4.0.1, bcrypt 5.1.1,
  Prisma + @prisma/client 5.22.0, class-validator 0.14.4, Jest 29.7.0, ts-jest 29.4.14, TypeScript 5.9.3
- web: Next 15.5.24, React 19.3.0, Tailwind 3.4.19, @reduxjs/toolkit 2.13.0, react-redux 9.3.0, Vitest 3.2.7
- ESLint 8.57.1 with legacy `.eslintrc` everywhere. Prettier: singleQuote, trailingComma all.
- mobile: Expo SDK 58 (react 19.3.0, react-native 0.88.1), TypeScript 5.9.3.
- Before using a library API, check the installed types in `node_modules/` (version-exact), not memory.

## Roles
DONOR · STAFF (intake) · CASE_OFFICER (review, severity, publish) · FINANCE_VERIFIER (verify, disburse) ·
ADMIN (setup, publish, suspend/reactivate) · COLLECTOR («مسؤول نقطة جمع», cash at their collection points only).

## API rules (b4f pattern)
- One module per domain: module, controller, service, `dto/`, co-located `*.spec.ts`.
- `main.ts`: CORS from `WEB_ORIGIN` (comma list, credentials), global ValidationPipe
  (whitelist, forbidNonWhitelisted, transform), `AllExceptionsFilter`, Swagger at `/api/docs`. No global prefix.
- Errors are always `{ statusCode, message, error, path, timestamp }`; `message` carries stable codes (e.g. `phone_taken`).
- Auth: passport-jwt `JwtStrategy` (Bearer header only; `validate()` reloads id/role/isActive from DB),
  `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` at **controller class level**. Public endpoints live in
  controllers without the guard. One access token, 8h (`JWT_SECRET`, `JWT_EXPIRES_IN`). No refresh tokens.
- Caller only via `@CurrentUser()`. Roles checked **inside services** with `RoleAccessService.requireRole(user, [...])`
  (403). Hide others' resources with 404. No roles guard, no `@Roles` decorator.
- Global `PrismaService`; multi-row writes in `prisma.$transaction`; never return `passwordHash`/`nationalIdHash`.
- Prisma: `@id @default(uuid()) @db.Uuid`, camelCase fields with `@map` snake_case, `@@map("snake_plural")`,
  explicit `onDelete`, money `Decimal(14,2)`. Schema changes only via `prisma migrate dev`.
- DTO classes in `dto/<verb>-<entity>.dto.ts`; Swagger + class-validator on every field; `ParseUUIDPipe` for ids.
- Every mutation writes `AuditService.log(...)`. Uploads go through `StorageService` (magic bytes, EXIF strip, sha256).

## Web rules (b4f pattern)
- Route groups: `(public)`, `(auth)`, `(app)` (session required via `requireSessionToken()` in the layout).
  `(app)/collector/*` = mobile-first collector pages. **No middleware.**
- JWT only in the HttpOnly `session` cookie (`lib/session`, server-only, 8h). Never in client JS.
- Backend calls only via server-only `lib/api/client.ts` `apiFetch` + one file per resource in `lib/api/`.
- Reads in Server Components; writes only through Server Actions in `lib/actions/<resource>.ts`
  (validate shape → `requireSessionToken()` → api → map `ApiError` → `safeRevalidate`). Client Components never import `lib/api`.
- Redux only for `currentUser`. Context only for Theme and Toast. Toast on the action result, not in `useEffect`.
- i18n: next-intl **without URL routing**; locale from the `lang` cookie (`app/lang/route.ts`). Arabic default.
- Tests: Vitest + Testing Library, co-located `*.test.tsx`.

## Mobile rules
- Donor app only: browse, pledge, demo checkout, choose a collection point for cash, upload receipt, my donations.
- Token in `expo-secure-store`; `Authorization: Bearer`; on 401 → clear token → login. API URL from `EXPO_PUBLIC_API_URL`.

## Money flows
- **Pledge & Verify (real):** pledge (PLEDGED) → receipt upload (RECEIPT_UPLOADED + Verification PENDING) →
  FINANCE_VERIFIER approves → VERIFIED, official receipt `R-YYYY-NNNNNN` + QR, `verifiedAmount` += amount.
- **Demo payments (ShamCash, PayPal, Visa):** web and mobile, always with a «Demo» badge, `isDemo=true`.
  Demo money is shown **separately** and is never added to `verifiedAmount` or the platform totals.
- **Cash at a collection point:** donor picks a point → COLLECTOR confirms "received" → COLLECTED; the bar shows a
  "received, pending verification" segment; the donor gets an acknowledgement (no official number) →
  FINANCE_VERIFIER approves → official receipt. Collectors never verify or raise balances.
- A verifier never verifies their own entry. Disbursement only to the case's locked hospital, ≤ verified − disbursed;
  at target → campaign COMPLETED («تم الإنجاز»), case CLOSED. Hospital change or amount increase → back to review, pledges paused.
- WhatsApp: every alert and receipt is written to the internal outbox (`OutboundMessage`); staff send each with a
  one-tap `wa.me` link from the council's phone. No WhatsApp API.

## Naming
- Role `COLLECTOR`; entity `CollectionPoint` with `type: CollectionPointType` (MOSQUE, CENTER, OFFICE, SHOP, OTHER),
  `contactName`. Never name a role, screen, route, variable or entity after "mosque" or «مكي».
- UI: «مسؤول نقطة جمع» / «نقطة الجمع», "Collector" / "Collection Point".
- Collector-facing wording expresses «براءة ذمة» (clearance), never "suspicious"/"suspended".

## UI rules
- Arabic RTL first, English second. Fonts: IBM Plex Sans Arabic (body), Noto Kufi Arabic (display); Arabic text ≥ 13px.
- Theme = the adopted Tailwind 3 token system (`tailwind.config.ts`, `globals.css`), brand = Salamiyah green.
  Use semantic tokens (`page, surface, border, ink, muted, accent, danger, warning, info`) and `components/ui/*`;
  no raw palette colours for neutrals. `give` colour only for donate actions and funding progress.
- Distinctive, professional, calm; dark mode supported; WCAG-AA contrast; visible focus ring; reduced-motion respected.
- Low bandwidth: server-rendered pages, no heavy client libraries, compressed images, no autoplay media.
- Beneficiary privacy: public pages show file number, redacted summary, hospital, priority, amounts — never names,
  national IDs or private documents (optional redacted report image only).

## Commands
- DB: `docker compose up -d` (Postgres on host port 5433)
- api: `npm run start:dev` · `npm run lint` · `npm test` · `npm run build` · `npx prisma migrate dev` · `npm run seed`
- web: `npm run dev` · `npm run lint` · `npm test` · `npm run build`
- mobile: `npx expo start` · `npx tsc --noEmit` · `npx expo lint` · `npx expo install --check`
- Done = lint + tests + build green in every touched project, and the affected screens checked in a browser/phone.

## Do NOT
- Do not commit `.env`, uploads, build output or secrets; do not print secret values.
- Do not upgrade, add or swap libraries/versions; do not add pnpm, turbo, workspaces or shared packages.
- Do not add middleware, a roles guard, refresh tokens, `NEXT_PUBLIC_*` API URLs or client-side backend calls.
- Do not let demo money reach verified totals; do not let collectors verify; do not skip finance verification.
- Do not build Future Scope features; do not show beneficiary identities publicly.
- Do not call any WhatsApp API or unofficial WhatsApp automation.
- Do not use `any`; do not leave unused code; do not edit generated migrations by hand (except the receipt sequence).
- Commit format: `type(scope): summary`.
```

*(104 lines inside the block, within the 150-line limit.)*

---

## 7. Phase 2 prompts (20 sessions + backlog)

Each prompt starts with "Read `CLAUDE.md` and `docs/_analysis/05-execution-plan.md` §7 Pn" and ends with the acceptance
checks. **Std checks:** `api` = `npm run lint && npm test && npm run build`; `web` = `npm run lint && npm test && npm run build`;
`mobile` = `npx tsc --noEmit && npx expo lint`.

### Tier 1 — foundation and alignment (P01–P04 done) and the new-scope build

**P01 — Scaffold NEW + git + docs — ✅ DONE**
- Goal: create `salamiyah-hackathon/` with the root files from §3/§5/§6, docs copied (PDFs, analysis, `_analysis`), postgres-only `docker-compose.yml` (5433), `.nvmrc`, README, CLAUDE.md, `git init`, first commit.
- Inputs: §3 root/docs rows, §5, §6.
- Accept: `git status` clean; `git check-ignore -v api/.env web/.env api/uploads/x` all ignored; `docker compose up -d` → healthy; the docs folder holds 6 input files + analysis + 01–05.
- Deps: none.

**P02 — API skeleton on b4f versions + schema regeneration — ✅ DONE**
- Goal: `api/` with exact versions, legacy ESLint, Jest config, SAL modules copied; Prisma 5.22 schema with uuid, `@@map`, `CollectionPointType`, `contactName`; regenerated init migration (+ receipt sequence); seed runs (ts-node, safety guard); compiles.
- Inputs: 02 §2.2/§5.6, 03 §5, §3 api rows.
- Accept: `npm ci`; `npx prisma migrate reset --force` then `npm run seed` succeed; `npm run build` passes; `npm ls @nestjs/core @prisma/client bcrypt` shows 10.4.22 / 5.22.0 / 5.1.1.
- Deps: P01.

**P03 — API auth contract + RoleAccessService (freeze the contract) — ✅ DONE**
- Goal: passport-jwt strategy/guard, phone login returning `{ accessToken, user }`, register, `/auth/me`, no refresh; class-level guards on every controller; all `@Roles` → `requireRole`; b4f filter + interceptor + `main.ts`; `/health` public (B1); copied shared code + Jest enum-sync and authorization specs.
- Inputs: 01 §2.4–2.5, 02 §5.1–5.3.
- Accept: Std api; Swagger at `/api/docs`; `curl` `/health` → 200 without a token; a DONOR token on `GET /verifications` → 403; no token → 401. Run `/security-review` on the diff.
- Deps: P02.

**P04 — Web skeleton: b4f infrastructure + adopted theme — ✅ DONE**
- Goal: `web/` on exact versions; SANAD theme with SAL green, fonts, `components/ui` + b4f primitives; `lib/session`, `lib/api/client`, `lib/actions/validation`, Redux `currentUser`, Theme + Toast contexts; next-intl cookie locale with `app/lang/route.ts`; route groups; login/logout Server Actions; Vitest setup.
- Inputs: 01 §3, 03 §2.3/§4, §3 web rows.
- Accept: Std web; login as every seeded role works; dark/light toggle; AR↔EN switch keeps the URL; `document.cookie` shows no session cookie (check in the browser console); no `middleware.ts` in the repo.
- Deps: P03 (auth contract). Use frontend-design.

> **Rewritten 2026-11-22 for the official hackathon idea** (`06-scope-change-hackathon-idea.md`). P01–P04 are DONE and
> unchanged. Requirement IDs `H1–H24` refer to 06 §2; the demo steps refer to 06 §5. Each prompt is one session.

**P05 — Schema for the new scope + shared enums**
- Goal: one Prisma migration per 06 §3.1 and the categories decision: **`CampaignCategory` table** (code, names, icon, order, active, system, flags `requiresMedicalCase`/`lockedPayeeHospital`/`supportsMonthlySponsorship`) replacing the `CampaignType` enum, `Campaign.categoryId`, 3 seeded system categories; `Campaign.spentAmount` (was `disbursedAmount`), `coverKey`, `area`; `BeneficiaryKind` + `Beneficiary.publicCode` (`B-XXXX`) / `kind` / `area`; `CampaignBeneficiary` (with `monthlyAmount`); `PayeeType` + **`Expenditure` replacing `Disbursement`**; `DocumentKind.EXPENDITURE_PROOF`; `PaymentMethod` with SHAM_CASH/SYRIATEL_CASH/MTN_CASH/PAYPAL/VISA (no `E_WALLET`); `PledgeStatus.DEMO_CONFIRMED`; `PaymentMethodConfig` + `CampaignPaymentAccount`; `OutboundMessage`; `User.whatsappOptIn`. Update the three shared copies, the api services that used the renamed fields (compile + existing specs), and a minimal seed so `migrate reset` + seed still run (full demo seed is P16).
- Inputs: 06 §3.1, §4.
- Accept: Std api + web; `npx prisma migrate reset --force && npm run seed`; enum-sync spec and web shared-copy test pass; no `CampaignType` / `Disbursement` / `disbursedAmount` left in api code; rules read category flags, never codes.
- Deps: P04.

**P06 — API: campaign management, categories, campaign account and beneficiaries**
- Goal: **categories API**: public `GET /campaign-categories` (active, ordered), ADMIN `GET` all / `POST` / `PATCH` (names, descriptions, icon from the fixed set, order, activate/deactivate; flags fixed on system categories; system categories cannot be deleted, new ones start without flags); `POST /campaigns` (ADMIN any category; CASE_OFFICER only categories with `requiresMedicalCase`) with category, titles, anonymised summary, target, currency, `coverKey`, area; case publish creates a campaign in the `requiresMedicalCase` category; `GET /campaigns?category=&status=` + detail including type/cover/beneficiaries count; `GET /campaigns/:id/ledger` (verified, pending, demo, spent, remaining, donors count); `GET /payment-methods` + `GET /campaigns/:id/payment-accounts` (config merged with overrides, demo-capable methods flagged); beneficiaries: create/link with generated `B-XXXX`, public codes per campaign. Specs for role rules, ledger maths and "no identity fields in public responses".
- Inputs: 06 §2 H5–H9, H11, H19; §3.2.
- Accept: Std api; Swagger shows the new endpoints; a public campaign response contains no `fullName`/`phone`/`nationalId*` (spec).
- Deps: P05.

**P07 — Web public pages for all campaign types**
- Goal: home (hero for the council's campaigns, type tabs, campaign cards with cover illustration + 3-segment progress, totals strip), campaign detail (summary, ledger, receiving accounts, beneficiaries count + codes, spending placeholder), track page, public receipt page; bundled cover illustrations per type (SVG, no photos); rewrite medical-only copy in `messages/*` (06 §4); per-resource `lib/api/*`.
- Inputs: 06 §3.3, §4; P04 theme/components.
- Accept: Std web; Playwright: home lists all three types and the filter works; detail shows ledger + accounts; AR/EN + dark mode screenshots in `docs/screenshots/p07/`.
- Deps: P06. Use frontend-design.

**P08 — Web staff workspace: categories, campaigns, cases, intake, import**
- Goal: role-based Sidebar and real dashboards; **ADMIN categories screen** (list, create, edit names/icon/order, activate/deactivate; part of the demo: "admin adds a new category live"); `(app)/campaigns` list + "new campaign" form (category, target, cover picker, area, link/create anonymised beneficiaries with monthly amount for orphans); port the medical pipeline screens (intake, cases list/detail with review/publish/hospital change, import wizard, file proxy) so publishing produces a `MEDICAL_AID` campaign; Server Actions per resource.
- Inputs: 02b §1.2, 06 §2 H2/H4/H6–H8.
- Accept: Std web; ADMIN adds a new category and it appears in the public filter; ADMIN creates an orphan campaign with 3 beneficiaries → it is on the public home; STAFF intake → CASE_OFFICER publish → a `MEDICAL_AID` campaign appears; hospital change pauses pledges (demo steps 1–2 without the outbox).
- Deps: P06 (P07 for the public result).

**P09 — Mobile alignment + campaigns of all types** *(can run in parallel with P07/P08)*
- Goal: `mobile/` standalone npm project (TS 5.9.3, ESLint 8 legacy, shared copy, Bearer only, 401 → login, template assets removed); campaign list with type chips, detail with cover/ledger/beneficiaries count; register with WhatsApp opt-in; "my donations".
- Inputs: 02 §2.4/§5.3, §3 mobile rows, 06 §3.4.
- Accept: Std mobile; `npx expo install --check`; on a phone: login as donor → filter by type → detail → my donations.
- Deps: P06.

**P10 — Donations on every path: simulated wallets/cards, transfer + receipt, cash point; live progress**
- Goal: `(public)/campaigns/[slug]/donate` and the mobile equivalent: method choice from `PaymentMethodConfig`; simulated checkout for ShamCash / Syriatel Cash / MTN Cash / PayPal / Visa with a «Demo» badge (→ `DEMO_CONFIRMED`, `isDemo`); transfer → campaign account details → receipt upload (→ RECEIPT_UPLOADED + verification); cash → collection-point picker (public `GET /collection-points`); `LiveProgress` polling ~5 s with verified / received-pending / demo segments on web and mobile.
- Inputs: 06 §2 H11–H13, H24; 03 §2.1/§2.2.
- Accept: Std all; a mobile Syriatel Cash demo payment moves the web bar's demo segment within ~5 s and leaves `verifiedAmount` unchanged (API test); a web transfer pledge with receipt appears in the finance queue (demo steps 3–4 without notifications).
- Deps: P07, P09.

**P11 — Instant notifications + WhatsApp outbox**
- Goal: one notification service called on every donation event (demo confirmed, receipt uploaded, cash collected, verified, rejected) → in-app `Notification` + `OutboundMessage` with a `wa.me` link (donor phone; opted-in donors for new-campaign alerts); alert on publish of urgent medical or any new campaign to opted-in donors; `(app)/outbox` with per-row send button + "next" stepping (QUEUED → OPENED); web bell + list, mobile notifications screen.
- Inputs: 06 §2 H14; 04 §5 (no WhatsApp API).
- Accept: Std all; demo steps 2–4 now show the notification on the phone and rows in the outbox; unit tests for recipient selection and one notification per event.
- Deps: P10.

**P12 — Collector PWA**
- Goal: `(app)/collector`: my points, pending cash pledges at my points, one-tap "confirm received" (→ COLLECTED + verification PENDING + acknowledgement notification/outbox), record an anonymous cash amount for a campaign, history; «براءة ذمة» wording; PWA manifest / service worker / offline page / icons; COLLECTOR scoping in the service.
- Inputs: 04 R11/R12/§6, 03 PWA row.
- Accept: Std api/web; at 375 px a COLLECTOR confirms → pending segment + acknowledgement; another collector's pledge → 404; Lighthouse "installable" (demo step 5).
- Deps: P11.

**P13 — Finance verification + official receipts with QR**
- Goal: port the finance queue (receipts, collected cash) for all campaign types; approval issues `R-YYYY-NNNNNN` + QR (pinned `qrcode`, listed in README) on the public receipt page and share image; receipt notification + outbox message; rejection with reason → donor notification and mobile `/receipt/{pledgeId}` (B2).
- Inputs: 04 R15/R16/B2, 06 H22.
- Accept: Std api/web; approve a transfer and a collector cash pledge → receipt page with a QR that opens the same page; ledger "collected" rises (demo step 6).
- Deps: P12.

**P14 — Expenditures with proof + orphan monthly payments**
- Goal: `expenditures` module replacing disbursements: `POST /campaigns/:id/expenditures` (FINANCE_VERIFIER; payee type, public-safe payee label, amount ≤ remaining, date, description, proof upload via `StorageService`); locked hospital for `MEDICAL_AID`; `POST /campaigns/:id/expenditures/monthly` (one row per active sponsored beneficiary, `periodMonth`, no duplicates per month); public spending timeline; COMPLETED «تم الإنجاز» when fully spent at target (medical case → CLOSED); finance web form + timeline on the campaign page.
- Inputs: 06 §2 H18/H20/H21.
- Accept: Std api/web; contractor expenditure with an invoice photo appears on the public timeline; monthly run creates N rows once per month (spec); amount > remaining → 409 (spec) (demo step 7, first half).
- Deps: P13.

**P15 — Public transparency dashboard (headline feature)**
- Goal: `GET /stats/transparency` (collected, spent, remaining; demo separate; by campaign type; per campaign; beneficiaries count; donors count) and `(public)/transparency`: totals, breakdown by type, per-campaign ledger rows, spending timeline with proof links, beneficiaries count and codes — no identities; same summary on mobile.
- Inputs: 06 §2 H16–H19.
- Accept: Std api/web; totals match an API test against seeded data; no identity field reachable from any public endpoint (spec); screenshots AR light/dark/375 px (demo step 7, second half).
- Deps: P14. Use frontend-design.

**P16 — Demo seed + walkthrough + smoke tests**
- Goal: seed per 06 §3.5 (≥ 2 campaigns per type, anonymised beneficiaries, expenditures with proof, fake payment accounts with one per-campaign override, pledges in every status, users per role, opted-in donors from `DEMO_WHATSAPP_NUMBERS`, collection points CENTER/MOSQUE/OFFICE); `DEMO.md` for the 06 §5 scenario with logins; Playwright smoke for public pages + login per role.
- Inputs: 06 §3.5, §5.
- Accept: `npx prisma migrate reset --force && npm run seed`; full 7-step walkthrough on PC + 2 phones without manual DB edits; Std all. Tag `demo-ready`.
- Deps: P05–P15.

```
──── CUT LINE A ────
```

### Tier 2

**P17 — Admin setup screens**
- Goal: users (role/isActive, collector point assignment), hospitals, collection points (type, `contactName`), payment methods (`PaymentMethodConfig`) and per-campaign account overrides, beneficiaries registry (create, link, codes) with `PATCH` endpoints where missing.
- Accept: Std api/web; create a collector → assign a point → the collector sees it in the PWA; override a campaign's wallet number → the donate page shows it.
- Deps: P16.

**P18 — Campaign lifecycle + violations log**
- Goal: campaign status tabs, pause/resume pledges, close, post updates, edit cover/summary; `BeneficiaryNote` + `POST /beneficiaries/:id/suspend|reactivate` (ADMIN, reason, audit) with silent intake refusal; mobile type + priority filters.
- Accept: Std all; pause a campaign → donate is blocked on web and mobile; suspend → intake for that national ID shows the generic error → reactivate → works.
- Deps: P16.

```
──── CUT LINE B ────
```

### Tier 3

**P19 — Trust polish: audit history, SLA alerts, sharing, UI/a11y pass**
- Goal: audit history panel on campaign/case (ADMIN); overdue-case notification once per case; donor code `D-XXXXXX`; OG image + share buttons per campaign; donor PWA install prompt; consistent empty/loading/error states, RTL/LTR, dark mode, 375 px, Arabic copy review, no unused JS on public pages.
- Accept: Std all; WhatsApp link preview shows the OG card; Lighthouse accessibility ≥ 90 on public pages; screenshots of all routes reviewed.
- Deps: P16 (and P17–P18 if done). Use frontend-design.

### Cleanup

**P20 — Final checks, backup, deletion**
- Goal: run §4's gate; create the backup zip; push; tag `v1.0-hackathon`; delete per §4 **only after explicit team confirmation in chat**.
- Accept: all Std checks green from a fresh `git clone` on a second Windows machine following the README; backup zip opens; old folders removed.
- Deps: all chosen tiers.

**Parallelism:** P09 runs alongside P07/P08 (different project). After P16: P17, P18 and P19 touch mostly different files
and can run in parallel branches (merge P17 before P19 if both touch the Sidebar).

### Backlog after P20 (only if time remains; not part of any cut line)

**P21 — Light mode redesign** *(final team decision)*
- Goal: redesign the existing light theme, which the team finds dull and greyish: a clean near-white page background,
  pure-white cards with a subtle border and a soft shadow, fresh Salamiyah green accents, strong text contrast (WCAG AA for
  every text pair). Only the light tokens in `globals.css` (and any light-only classes) change. **The dark mode is approved
  and must not change.**
- Accept: Std web; before/after screenshots of every route in light mode (1280 px and 375 px); measured contrast ratios
  recorded; dark-mode screenshots unchanged.
- Deps: P19 (or any time after P16).

**P22 — Google (Gmail) sign-in as an additional option** *(final team decision)*
- Goal: "Sign in with Google" next to phone + password. Phone + password stays the primary method (staff, collectors,
  older users) and its API contract (`POST /auth/login` → `{ accessToken, user }`, Bearer token, 8h) stays unchanged.
  The API adds the Google OAuth flow with `passport-google-oauth20` (exact pinned version, added to README "Additions
  beyond b4f" first) and issues the same app JWT; a Google user is created as DONOR. Donors who sign in with Google must
  add their phone number in their profile before donating (needed for WhatsApp receipts and alerts): the donate actions
  refuse with a stable code until a phone is set. The team confirmed Google sign-in is usable for our users.
- Accept: Std api/web/mobile; Google sign-in creates a DONOR and returns the app session; donating without a phone is
  refused with the stable code; phone + password login unchanged (existing specs green).
- Deps: P16.

---

## 8. Skills and tools for Claude Code

| Tool | Status here | Use it for |
|---|---|---|
| **frontend-design** skill (Anthropic, plugin directory) | Available, **not enabled** | P04, P05, P09, P10, P19: layout, visual hierarchy, a distinctive look on the adopted theme |
| **Playwright** MCP (Microsoft, plugin directory) | Available, **not enabled** | P05 + P13 smoke tests, P10 mobile-viewport checks, P19 screenshots; also checks the session cookie isn't readable from JS |
| Built-in browser pane (desktop app) | Enabled | Quick manual click-through checks after each web prompt when Playwright is not needed |
| **Version-exact docs** | Installed `node_modules/**/*.d.ts` first (works offline, exact version); **context7** MCP (available, not enabled) as a second source for Nest 10, Prisma 5.22, Next 15.5, Expo 58 guides | Every prompt that touches a library API, especially P02/P03 (Nest 10 + Prisma 5 differences) and P06/P08 (Expo 58) |
| `/security-review` (built in) | Enabled | P03 (auth contract), P10 (collector scoping), P11 (public receipts), before tagging `demo-ready` |
| `/code-review` (built in) | Enabled | Before merging each prompt's PR |
| `/simplify` (built in) | Enabled | After P13 and P19 to remove leftovers |
| Expo CLI checks | `npx expo-doctor`, `npx expo install --check` | P06, P08, P09 |
| `gh` CLI | **Not installed** | §5 repo creation (`winget install --id GitHub.cli`) |
| Docker Desktop | Needed | Postgres via `docker compose` |

---

## 9. Open questions

1. **Council:** is the Demo-badged ShamCash/PayPal/Visa simulation acceptable? `CLAUDE.md` claims the council "does not want it", but the approved PoC requires it.
2. **Council:** real Bemo account name and number for the instructions (until then the placeholder `0000-…` stays, marked as an example).
3. **Council:** the first list of collection points (name, type, area, contact) and who acts as collector for the pilot.
4. **Council:** WhatsApp opt-in wording and which council phone sends outbox messages.
5. **Team:** team size and deadline → which cut line (A or B) to target.
6. **Team:** QR generation: add a pinned QR library (an addition beyond b4f) or write a tiny SVG encoder?
7. **Team:** what happens to `b4f-board-final/` after the hackathon, and archiving the SANAD GitHub repo (visibility unknown).

---

## Decision updates (P01)

> Added during P01 (2026-11-21). These **override** every earlier section of this plan, the draft `CLAUDE.md` in §6
> and the per-prompt details in §7. The repository `CLAUDE.md` and `README.md` already reflect them.

1. **No Docker.** The project uses the PostgreSQL already installed on the developer machine. Detected during P01:
   Windows service `postgresql-x64-18` (Running, Automatic), `psql (PostgreSQL) 18.6`, listening on **port 5432**
   (IPv4 + IPv6, process `postgres`). There is no `docker-compose.yml`. Instead:
   - `api/prisma/dev-db-setup.sql` creates the role `majlis` (LOGIN, CREATEDB for Prisma's shadow DB) and the database
     `majlis_fund` (UTF-8, owned by `majlis`). It is idempotent, and the password is passed with `-v app_password=...`, so
     it is never stored in a file.
   - `DATABASE_URL` uses `localhost:5432`. This replaces "host port 5433" in §3, §5 and P01.
   - P02 must confirm Prisma 5.22.0 works against PostgreSQL 18 (migrate, seed, tests) and report any incompatibility.
   - Wherever §4/§7 say `docker compose up -d`, read "make sure the PostgreSQL service is running".
2. **Demo payments.** PayPal, Visa and ShamCash simulation is a hackathon-only demo feature with a «Demo» badge.
   **Bemo account details are fake placeholders** for the hackathon (resolves §9 open question 2).
3. **Seed data is fictional** (collection points, collectors, donors, hospitals, cases). Exception: the team's real
   WhatsApp numbers for the live demo are **never committed**. They live only in `api/.env` as
   `DEMO_WHATSAPP_NUMBERS="+963...,+963..."`; `api/.env.example` gets a placeholder; the seed (P13) reads it and falls back
   to fictional numbers when it is empty. Numbers must never appear in logs, test snapshots or screenshots that are committed.
4. **QR:** use the `qrcode` npm package, pinned to an exact version, in P11. It is listed in README "Additions beyond b4f"
   (resolves §9 open question 6).
5. **`b4f-board-final/` is deleted in P20** together with the other old folders (replaces the §4 row "not in this
   phase"). Before deleting it, P20 checks that its rules are captured in `CLAUDE.md` and `docs/_analysis/01-reference-b4f.md`.
   From P02 on, b4f files may still be copied as templates (§3) until P20.

### P01 deviations from §7
- The full-spec PDF was copied as `الوثيقة الشاملة لهندسة المنظومة والتحول الرقمي - المجلس الوطني الإسماعيلي في السلمية.pdf`
  (the "(1)" download suffix was dropped; the content is byte-identical, md5 `7562f99c…`).
- No `api/.env.example` yet: it is created with the API in P02 (keys per §5, plus `DEMO_WHATSAPP_NUMBERS=""`).
- `api/prisma/dev-db-setup.sql` is the only file under `api/` in P01. It was **not executed** in P01 (it needs the
  postgres superuser password); run it before P02.

---

## Decision updates (scope change, 2026-11-22)

> Override every earlier section of this plan where they conflict. Full analysis: `06-scope-change-hackathon-idea.md`.

1. **Scope = the official hackathon idea** (Team 4): orphan sponsorship, home renovation and medical aid campaigns created
   by the council, donations by transfer / local e-wallets (simulated payments with a «Demo» badge), instant notifications,
   expenditures with proof, and a public transparency dashboard with anonymised beneficiaries. Decision **C7** ("medical
   only") no longer applies to the hackathon build; the §2 tier tables are superseded by the rewritten §7 (Tier 1 = P05–P16).
2. P01–P04 are done and kept as they are. P05 had not started when the scope changed (no branch, no stash, clean tree).
3. The medical case pipeline stays and produces `MEDICAL_AID` campaigns; `Disbursement` becomes `Expenditure`.
4. The prompt count is unchanged (P05–P20). The backlog (P21, P22) is recorded at the end of §7 as given by the team.
5. **(P05) Campaign categories are data**, not an enum: `CampaignCategory` table with behaviour flags
   (`requiresMedicalCase`, `lockedPayeeHospital`, `supportsMonthlySponsorship`); rules read flags, never codes; categories
   API in P06, ADMIN categories screen in P08 (demo: "admin adds a new category live").

---

## Decision updates (P16, 2026-11-23)

1. **E2E tool:** `e2e/` is a fourth, test-only npm project pinning `@playwright/test` 1.64.1 (README "Additions beyond
   b4f"). `npx playwright@x test` without a local install cannot resolve `@playwright/test` from the test files. It runs on
   the installed Google Chrome (`channel: "chrome"`), so no browser download. Step 3 of the scenario (DONOR A in Expo
   Go) is exercised through the web donate page (same API path); the native app itself is checked on a phone.
2. **LAN demo cookie:** `SESSION_COOKIE_SECURE` (web) overrides the production default of the session cookie's `Secure`
   flag; `"false"` only for the plain-HTTP LAN demo.
3. **Demo seed:** fixed codes (`B-0xxx`, never produced by the generator since it has no 0/1), fixed pledge references
   `P-SD0001…`, receipts numbered by verification date; dates are whole months before "now". `npm run demo:reset`
   = safety check → `migrate reset --force --skip-seed` → empty `api/uploads/` → seed.

