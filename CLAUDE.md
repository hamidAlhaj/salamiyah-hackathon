# Majlis Fund (مجلس فند) — Salamiyah Medical Crowdfunding · Hackathon PoC

Read this file before any task. Requirements: `docs/input/` (the PoC proposal is the primary source).
Plan and analysis: `docs/_analysis/` 01–05. **`05-execution-plan.md` §7 (prompts P01–P20) and its final
"Decision updates" section override everything else.** `docs/analysis/` is historical: where it mentions pnpm, turbo,
refresh tokens or Docker, this file wins. The b4f reference folder will be deleted; its rules live here and in `docs/_analysis/01-reference-b4f.md`.

## Context
- Platform for the Ismaili Council in Salamiyah, Syria: publish vetted medical cases, collect pledges, verify money,
  pay hospitals directly, show transparency. Deliverables: web (Next.js) + donor mobile app (Expo).
- **Scope: medical only.** Orphans, home repair, food baskets, education, monthly collection-point box collection,
  joint approval, Aga Khan transfers, monthly reconciliation = Future Scope (mention only, never build).

## Repository
- `api/` NestJS · `web/` Next.js · `mobile/` Expo. Three separate npm projects, each with its own package-lock.json.
- No shared packages. Enums/types are copied into `api/src/common/shared`, `web/src/shared`, `mobile/src/shared`;
  change all three plus `schema.prisma` together (the api enum-sync test must pass).
- npm only (no pnpm, no turbo, no workspaces). Node 24.12.0 (`.nvmrc`, `engines`).
- Database: the **locally installed PostgreSQL** (Windows service, port 5432). **No Docker.**
  Role + database are created once with `api/prisma/dev-db-setup.sql` (see README).

## Pinned versions (exact; never upgrade or add a major without a team decision)
- api: NestJS 10.4.22, @nestjs/jwt 10.2.0, @nestjs/passport 10.0.3, passport-jwt 4.0.1, bcrypt 5.1.1,
  Prisma + @prisma/client 5.22.0, class-validator 0.14.4, Jest 29.7.0, ts-jest 29.4.14, TypeScript 5.9.3
- web: Next 15.5.24, React 19.3.0, Tailwind 3.4.19, @reduxjs/toolkit 2.13.0, react-redux 9.3.0, Vitest 3.2.7
- ESLint 8.57.1 with legacy `.eslintrc` everywhere. Prettier: singleQuote, trailingComma all.
- mobile: Expo SDK 58 (react 19.3.0, react-native 0.88.1), TypeScript 5.9.3.
- Additions beyond b4f are listed in README ("Additions beyond b4f"), each pinned exactly; add new ones there first.
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
  `(app)/collector/*` = mobile-first collector pages (PWA). **No middleware.**
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
- **Pledge & Verify (real path):** pledge (PLEDGED) → receipt upload (RECEIPT_UPLOADED + Verification PENDING) →
  FINANCE_VERIFIER approves → VERIFIED, official receipt `R-YYYY-NNNNNN` + QR, `verifiedAmount` += amount.
- **Demo payments (ShamCash, PayPal, Visa):** a hackathon-only feature on web and mobile, always with a «Demo» badge,
  `isDemo=true`. Demo money is shown **separately** and never added to `verifiedAmount` or platform totals.
- Bemo account details shown in transfer instructions are **fake placeholders** for the hackathon.
- **Cash at a collection point:** donor picks a point → COLLECTOR confirms "received" → COLLECTED; the bar shows a
  "received, pending verification" segment; the donor gets an acknowledgement (no official number) →
  FINANCE_VERIFIER approves → official receipt. Collectors never verify or raise balances.
- A verifier never verifies their own entry. Disbursement only to the case's locked hospital, ≤ verified − disbursed;
  at target → campaign COMPLETED («تم الإنجاز»), case CLOSED. Hospital change or amount increase → back to review, pledges paused.
- WhatsApp: every alert and receipt is written to the internal outbox (`OutboundMessage`); staff send each with a
  one-tap `wa.me` link from the council's phone. No WhatsApp API.

## Seed and demo data
- All seed data (hospitals, collection points, collectors, donors, cases) is **fictional**.
- Real team WhatsApp numbers for the live demo live **only** in `api/.env` as `DEMO_WHATSAPP_NUMBERS="+963…,+963…"`.
  The seed reads it and falls back to fictional numbers when empty. Never commit, log or print real numbers.

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
- DB (once): `psql -U postgres -h localhost -p 5432 -v app_password="..." -f api/prisma/dev-db-setup.sql`
- api: `npm run start:dev` · `npm run lint` · `npm test` · `npm run build` · `npx prisma migrate dev` · `npm run seed`
- web: `npm run dev` · `npm run lint` · `npm test` · `npm run build`
- mobile: `npx expo start` · `npx tsc --noEmit` · `npx expo lint` · `npx expo install --check`
- Done = lint + tests + build green in every touched project, and the affected screens checked in a browser/phone.

## Do NOT
- Do not commit `.env`, uploads, build output, secrets, passwords or real phone numbers; do not print secret values.
- Do not upgrade, add or swap libraries/versions; do not add pnpm, turbo, workspaces, Docker or shared packages.
- Do not add middleware, a roles guard, refresh tokens, `NEXT_PUBLIC_*` API URLs or client-side backend calls.
- Do not let demo money reach verified totals; do not let collectors verify; do not skip finance verification.
- Do not build Future Scope features; do not show beneficiary identities publicly.
- Do not call any WhatsApp API or unofficial WhatsApp automation.
- Do not use `any`; do not leave unused code; do not edit generated migrations by hand (except the receipt sequence).
- Commit format: `type(scope): summary` (types feat, fix, refactor, test, docs, chore; scopes api, web, mobile, docs, repo).
