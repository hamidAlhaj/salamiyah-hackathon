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

## 7. Phase 2 prompts (20 sessions)

Each prompt starts with "Read `CLAUDE.md` and `docs/_analysis/05-execution-plan.md` §7 Pn" and ends with the acceptance
checks. **Std checks:** `api` = `npm run lint && npm test && npm run build`; `web` = `npm run lint && npm test && npm run build`;
`mobile` = `npx tsc --noEmit && npx expo lint`.

### Tier 1 — foundation and alignment

**P01 — Scaffold NEW + git + docs**
- Goal: create `salamiyah-hackathon/` with the root files from §3/§5/§6, docs copied (PDFs, analysis, `_analysis`), postgres-only `docker-compose.yml` (5433), `.nvmrc`, README, CLAUDE.md, `git init`, first commit.
- Inputs: §3 root/docs rows, §5, §6.
- Accept: `git status` clean; `git check-ignore -v api/.env web/.env api/uploads/x` all ignored; `docker compose up -d` → healthy; the docs folder holds 6 input files + analysis + 01–05.
- Deps: none.

**P02 — API skeleton on b4f versions + schema regeneration**
- Goal: `api/` with exact versions, legacy ESLint, Jest config, SAL modules copied; Prisma 5.22 schema with uuid, `@@map`, `CollectionPointType`, `contactName`; regenerated init migration (+ receipt sequence); seed runs (ts-node, safety guard); compiles.
- Inputs: 02 §2.2/§5.6, 03 §5, §3 api rows.
- Accept: `npm ci`; `npx prisma migrate reset --force` then `npm run seed` succeed; `npm run build` passes; `npm ls @nestjs/core @prisma/client bcrypt` shows 10.4.22 / 5.22.0 / 5.1.1.
- Deps: P01.

**P03 — API auth contract + RoleAccessService (freeze the contract)**
- Goal: passport-jwt strategy/guard, phone login returning `{ accessToken, user }`, register, `/auth/me`, no refresh; class-level guards on every controller; all `@Roles` → `requireRole`; b4f filter + interceptor + `main.ts`; `/health` public (B1); copied shared code + Jest enum-sync and authorization specs.
- Inputs: 01 §2.4–2.5, 02 §5.1–5.3.
- Accept: Std api; Swagger at `/api/docs`; `curl` `/health` → 200 without a token; a DONOR token on `GET /verifications` → 403; no token → 401. Run `/security-review` on the diff.
- Deps: P02.

**P04 — Web skeleton: b4f infrastructure + adopted theme**
- Goal: `web/` on exact versions; SANAD theme with SAL green, fonts, `components/ui` + b4f primitives; `lib/session`, `lib/api/client`, `lib/actions/validation`, Redux `currentUser`, Theme + Toast contexts; next-intl cookie locale with `app/lang/route.ts`; route groups; login/logout Server Actions; Vitest setup.
- Inputs: 01 §3, 03 §2.3/§4, §3 web rows.
- Accept: Std web; login as every seeded role works; dark/light toggle; AR↔EN switch keeps the URL; `document.cookie` shows no session cookie (check in the browser console); no `middleware.ts` in the repo.
- Deps: P03 (auth contract). Use frontend-design.

**P05 — Web: port existing SAL pages onto the new UI**
- Goal: home, campaign detail, track, receipt, finance queue, cases list/detail (review, publish, hospital change), intake, import wizard, file proxy; per-resource `lib/api/*` + `lib/actions/*`; role-based Sidebar (no badges yet).
- Inputs: 02b §1.2, §3 web rows.
- Accept: Std web; click through 04 §7 step 1 (intake) and the step 2 review/publish part; the hospital-change pause works; Playwright smoke of the public pages.
- Deps: P04.

**P06 — Mobile alignment** *(can run in parallel with P04/P05)*
- Goal: `mobile/` standalone npm project, TS 5.9.3, ESLint 8 legacy, shared copy, Bearer only (401 → login), template assets removed.
- Inputs: 02 §2.4/§3/§5.3, §3 mobile rows.
- Accept: Std mobile; `npx expo install --check`; on a phone: login as donor → list → detail → pledge → upload receipt.
- Deps: P03.

### Tier 1 — demo features, in scenario order

**P07 — Outbox + WhatsApp alerts (demo step 2)**
- Goal: `OutboundMessage` model + module; `User.whatsappOptIn` (register checkbox on mobile); on publish of VERY_URGENT/URGENT → one message per opted-in donor; `(app)/outbox` page with per-row `wa.me` button + "next" stepping; status QUEUED → OPENED.
- Inputs: 04 R14, §5.
- Accept: Std api/web; publish an urgent case → outbox shows N rows; the button opens WhatsApp with the campaign link; unit test for recipient selection.
- Deps: P05.

**P08 — Demo checkout + live progress + B3 (demo step 3)**
- Goal: `PaymentMethodConfig` (seeded: Bemo real; ShamCash/PayPal/Visa simulated) feeding instructions; demo checkout screens on mobile (and the component for web) with a "Demo" badge; stats return `verified`, `receivedPending`, `demo` separately; `LiveProgress` (poll ~5 s) with 3 segments on the web detail page; mobile bar shows the same segments.
- Inputs: 03 §2.2, 04 R5/R9/B3.
- Accept: Std all; a mobile ShamCash demo pledge → the web detail bar updates within ~5 s in the demo segment; `verifiedAmount` unchanged (API test).
- Deps: P05, P06.

**P09 — Web donate flow + collection-point picker (demo step 4)**
- Goal: `(public)/campaigns/[slug]/donate` with `PledgeForm` (methods: Bemo transfer → instructions → receipt upload; demo methods; cash → pick an active collection point by area/type); API: donor CASH pledge with `collectionPointId`, public `GET /collection-points`; mobile picker for cash.
- Inputs: 03 §2.1, 04 R8/R10.
- Accept: Std all; web cash pledge → reference shown and the pledge visible under "my donations" on mobile; Bemo pledge → receipt upload → appears in the finance queue.
- Deps: P08.

**P10 — Collector PWA (demo step 5)**
- Goal: `(app)/collector`: my points, pending cash pledges at my points, one-tap "confirm received" (→ COLLECTED + Verification PENDING + acknowledgement outbox message), record an anonymous cash amount, history; «براءة ذمة» wording; PWA manifest/sw/offline page/icons; API endpoints are COLLECTOR-scoped in the service.
- Inputs: 04 R11/R12/§6, 03 PWA row.
- Accept: Std api/web; on a phone browser (375 px) a COLLECTOR confirms → the campaign bar shows the pending segment → outbox has the acknowledgement; another collector's pledge → 404; Lighthouse "installable".
- Deps: P09.

**P11 — Official receipts with QR + receipt messages (demo step 6)**
- Goal: approval issues `R-YYYY-NNNNNN` for platform **and** donor-chosen collector cash (box totals stay without a receipt); QR on the receipt page + share image; receipt outbox message on approval; rejection link → mobile `/receipt/{pledgeId}` (B2) with a route-pattern test.
- Inputs: 04 R15/R16/B2. A QR generator is a new dependency: list it in the README as an addition (exact version pinned) or write a small SVG encoder.
- Accept: Std api/web; approve a collector cash pledge → receipt page shows the QR → scanning it opens the same page.
- Deps: P10.

**P12 — Disbursement UI + platform transparency (demo step 7)**
- Goal: finance disbursement form (amount ≤ available, paidAt, invoice upload) + timeline on campaign/case; COMPLETED shown as «تم الإنجاز»; `GET /stats/transparency` (verified, disbursed, %, by channel, by hospital, cases helped; demo separate); `(public)/transparency` page.
- Inputs: 03 §2.1, 04 R23/R29.
- Accept: Std api/web; disburse the full amount → campaign «تم الإنجاز», case CLOSED, transparency totals match an API test.
- Deps: P11.

**P13 — Demo seed + walkthrough + smoke tests**
- Goal: seed for all 7 steps (opted-in donors, collection points of types CENTER/MOSQUE/OFFICE, collector assigned, finance/case-officer users, a pledged Bemo receipt, hospitals); `DEMO.md` script with logins; Playwright smoke for public pages + login per role.
- Inputs: 04 §7.
- Accept: `npx prisma migrate reset --force && npm run seed`; full 7-step walkthrough on PC + 2 phones without manual DB edits; Std all. Tag `demo-ready`.
- Deps: P07–P12.

```
──── CUT LINE A ────
```

### Tier 2

**P14 — Admin screens: users, hospitals, collection points**
- Goal: `PATCH /hospitals/:id`, `PATCH /collection-points/:id`; Form/Row screens incl. type select, `contactName`, collector assignment, role/isActive editing.
- Accept: Std api/web; create a collector → assign a point → that collector sees it in the PWA.
- Deps: P13.

**P15 — Admin campaigns + ADMIN publish + mobile priority filter**
- Goal: campaigns list (status tabs) + detail (status, pause pledges, post update) + "new ongoing campaign"; ADMIN may publish (C5); mobile priority chips.
- Accept: Std all; create an ongoing campaign → it appears on the web home and mobile.
- Deps: P13.

**P16 — Violations log + invisible suspension + reactivation**
- Goal: `BeneficiaryNote` model; `POST /beneficiaries/:id/suspend|reactivate` (ADMIN, reason, audit); beneficiary page with history, notes and suspend toggle; intake keeps silently refusing suspended beneficiaries; no public badge.
- Accept: Std api/web; suspend → intake for that national ID shows the generic error → reactivate → intake works.
- Deps: P13.

```
──── CUT LINE B ────
```

### Tier 3

**P17 — Notifications, audit history, SLA alerts, admin overview**
- Goal: web bell + list (b4f `NotificationBell` pattern) and a mobile list; audit history panel on case/campaign (ADMIN); overdue check that notifies CASE_OFFICER/ADMIN once per case; admin overview StatCards + Sidebar badges.
- Accept: Std all; an overdue seeded case raises one notification; badges match counts.
- Deps: P13.

**P18 — Public polish: redacted report image, donor code, OG/share, donor PWA**
- Goal: `DocumentKind.PUBLIC_REPORT` upload on publish (optional) shown on the card; `D-XXXXXX` donor code on profile/receipts; OG image + share buttons; donor install prompt; mobile staff-login message.
- Accept: Std all; WhatsApp link preview shows the OG card; no private document is reachable publicly (test).
- Deps: P13.

**P19 — UI/a11y polish pass**
- Goal: consistent spacing and empty/loading/error states on every page; RTL/LTR check; dark mode; 375 px layouts; Arabic copy review; performance (no unused JS on public pages).
- Accept: Std web; Playwright screenshots of all routes in AR light/dark at 375 px and 1280 px reviewed; Lighthouse accessibility ≥ 90 on public pages.
- Deps: P13 (and P14–P18 if done). Use frontend-design.

### Cleanup

**P20 — Final checks, backup, deletion**
- Goal: run §4's gate; create the backup zip; push; tag `v1.0-hackathon`; delete per §4 **only after explicit team confirmation in chat**.
- Accept: all Std checks green from a fresh `git clone` on a second Windows machine following the README; backup zip opens; old folders removed.
- Deps: all chosen tiers.

**Parallelism:** P06 runs alongside P04/P05. After P13: P14, P15, P16, P17 and P18 touch different files and can run in
parallel branches (merge P14 before P17 if Sidebar badges are touched by both).

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
