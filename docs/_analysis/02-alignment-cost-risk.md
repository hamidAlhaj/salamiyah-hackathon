# 02 — Alignment Cost & Risk: Salamiyah code → b4f reference versions

> Read-only analysis. **Current code** = `منصة التمويل الجماعي في السلمية/` (the "Majlis Fund" pnpm + turbo
> monorepo with `apps/api`, `apps/web`, `apps/mobile`, `packages/*`). Paths below are relative to it.
> **Target** = versions in `_analysis/01-reference-b4f.md` (resolved lockfile versions), per the team decision.
> `sanad-crowdfunding/` is out of scope for this report.
>
> Evidence sources: each `package.json`; the installed pnpm store `node_modules/.pnpm/*` (it holds the actually
> installed versions); `expo/bundledNativeModules.json`; and the `engines` / `peerDependencies` of the installed packages.
> Nothing was installed or modified.

---

## 1. Decisions that are now fixed (inputs to this estimate)

| Area | Fixed choice |
|---|---|
| Versions | Exactly the **resolved** versions in 01 §1 (NestJS 10.4.22, Prisma 5.22.0, Next 15.5.24, React 19.3.0, TS 5.9.3, Tailwind 3.4.19, RTK 2.13.0, react-redux 9.3.0, ESLint 8.57.1 + legacy `.eslintrc`, Jest 29.7.0 (api), Vitest 3.2.7 (web), passport-jwt 4.0.1, bcrypt 5.1.1) |
| Package manager / layout | npm only; `api/`, `web/`, `mobile/` are separate npm projects, each with its own `package-lock.json`. No pnpm, no turbo, no workspaces |
| Shared code | No shared packages. Shared enums/types/utils are **copied** into each of api, web and mobile |
| Architecture | b4f patterns from 01 §4 (class-level JWT guard, role checks in services, HttpOnly cookie + server-only `apiFetch` + Server Actions on web) |
| Mobile | Expo SDK whose React matches 19.3.0 → **Expo 58** (verified in §3) |

---

## 2. Version gap (current → target)

### 2.1 Tooling / runtime

| Item | Current | Target | Gap |
|---|---|---|---|
| Package manager | pnpm 10.34.9 (`package.json` `packageManager`), `pnpm-workspace.yaml`, `.npmrc` (pnpm hoist flags), `pnpm-lock.yaml` | npm, 3 lockfiles | **Structural** |
| Monorepo runner | turbo 2.11.13 (`turbo.json`) | none | Remove; root scripts disappear |
| Node | root `engines.node: ">=22"`; machine has v24.12.0 | single team version (see §4) | Pin |
| Shared packages | `@majlis/shared` (zod 3.25.76), `@majlis/eslint-config`, `@majlis/tsconfig` | none | Copy shared code into each app; inline the tsconfig and eslint configs |

### 2.2 `apps/api`

| Package | Current | Target | Gap / impact |
|---|---|---|---|
| @nestjs/common/core/platform-express | 11.2.11 | 10.4.22 | **Major downgrade** (Express 5 → 4). No Express‑5-only syntax was found (`*splat`, `ParseDatePipe` and similar: none) |
| @nestjs/cli | 11.0.24 | 10.4.9 | major |
| @nestjs/config | 4.0.4 | 3.3.0 | major |
| @nestjs/jwt | 11.0.2 | 10.2.0 | major (same `signAsync`/`verifyAsync` API) |
| @nestjs/swagger | 11.4.8 | 7.4.2 | major. The decorators used (`ApiOkResponse`, `ApiTags`, `ApiBearerAuth`…) exist in 7 |
| @nestjs/passport / passport / passport-jwt | **not present** (hand-written `CanActivate` guard in `src/common/guards/jwt-auth.guard.ts`) | 10.0.3 / 0.7.0 / 4.0.1 | **Add + rewrite auth** |
| @nestjs/throttler | 6.8.0 | not in b4f (extra lib) | Keep. Installed peer range is `@nestjs/common ^7…^12`, so it works with Nest 10 |
| prisma / @prisma/client | 6.19.3 | 5.22.0 | **Major downgrade**, see R3 |
| bcryptjs → bcrypt | bcryptjs 3.0.3 (pure JS) | bcrypt 5.1.1 (native) | Same `hash`/`compare` API; **native build risk** R4 |
| class-validator | 0.15.1 | 0.14.4 | minor downgrade |
| class-transformer, reflect-metadata, rxjs | 0.5.1 / 0.2.2 / 7.8.2 | same | none |
| @types/express | 5.0.6 | 4.17.x | follows Express 4 |
| @types/node | 24.19.2 | ^20.16.10 (b4f) → 20.19.43 | types only (see R8) |
| typescript | 5.9.3 | 5.9.3 | ✔ |
| eslint | 9.39.5 flat (`eslint.config.mjs`) | 8.57.1 legacy `.eslintrc.js` + prettier 3 | Rewrite config |
| Test runner | `node --test --import tsx` (`test/core.test.ts`, 68 lines) | Jest 29.7.0 + ts-jest 29.4.14 | Port |
| Seed runner | tsx 4.23.15 | ts-node 10.9.2 | Swap |
| Others (sharp 0.35.5, exceljs 4.4.0, csv-parse 7.0.3) | — | not in b4f | Keep (domain libs, outside the version rule) |

### 2.3 `apps/web`

| Package | Current | Target | Gap / impact |
|---|---|---|---|
| next / eslint-config-next | 15.5.29 | 15.5.24 | Patch **downgrade** (R9) |
| react / react-dom | 19.1.10 | 19.3.0 | minor **upgrade**. Next 15.5 peer is `^19.0.0` ✔ |
| @types/react(-dom) | 19.1.17 / 19.1.11 | 19.3.0 | types |
| tailwindcss | 4.3.5 + `@tailwindcss/postcss` | 3.4.19 + postcss + autoprefixer | **Major downgrade**, CSS config rewrite |
| @reduxjs/toolkit / react-redux | **not present** | 2.13.0 / 9.3.0 | Add |
| server-only | not present | 0.0.1 | Add |
| vitest + testing-library + jsdom | **not present** (no web tests) | 3.2.7 / 16.3.3 / 25.0.1 | Add |
| eslint | 9.39.5 flat | 8.57.1 + `next/core-web-vitals` | Rewrite config |
| next-intl | 4.15.1 | not in b4f (extra lib) | Keep. Installed peer allows Next ^15 and React ^19. Its **routing middleware conflicts** with the b4f "no middleware" pattern (R6) |

### 2.4 `apps/mobile` (no b4f reference)

| Package | Current | Target | Gap |
|---|---|---|---|
| expo (+ all `expo-*`) | ~58.0.26 | Expo 58 | ✔ |
| react / react-dom | 19.3.0 | 19.3.0 | ✔ |
| react-native | 0.88.1 | 0.88.1 | ✔ |
| typescript | ~6.0.3 (resolved 6.0.3) | 5.9.3 | **Downgrade** (R7) |
| eslint / eslint-config-expo | 9.39.5 flat / ~58.0.4 | 8.57.1 legacy / ~58.0.4 | Config rewrite (verified compatible, R7) |
| @majlis/shared | `workspace:*` | copied into `src/shared/` | Copy |
| i18next / react-i18next | 27.2.1 / 18.0.3 | not in b4f | Keep |

---

## 3. Expo SDK verification (from installed files, not memory)

| Fact | Evidence |
|---|---|
| Installed Expo is **58.0.26** | `node_modules/.pnpm/expo@58.0.26_*/node_modules/expo/package.json` |
| Expo 58 pins **react 19.3.0, react-dom 19.3.0, react-native 0.88.1** | `expo/bundledNativeModules.json` → `"react": "19.3.0"`, `"react-dom": "19.3.0"`, `"react-native": "0.88.1"` |
| react-native 0.88.1 requires `react ^19.3.0` | its `peerDependencies` |
| Node range for Expo 58 | expo `engines.node`: `^22.13.0 \|\| ^24.3.0 \|\| ^26.0.0 \|\| >=27.0.0`. react-native 0.88.1: `^22.13.0 \|\| ^24.3.0 \|\| >= 26.0.0` |
| Expo's tsconfig base works on TS 5.9.3 | `expo/tsconfig.base.json` uses `module: "preserve"` (TS ≥5.4) and `${configDir}` (TS ≥5.5), and nothing newer |
| eslint-config-expo 58.0.4 supports ESLint 8 legacy | peer `eslint >=8.10`. Ships both `default.js` (legacy) and `flat.js` |
| Matching test preset if ever needed | `bundledNativeModules.json` → `"jest-expo": "~58.0.15"` |

**Conclusion:** Expo 58 is the correct SDK. Its React (19.3.0) equals the b4f-resolved React, so web and mobile run the
same React version. Mobile needs **no SDK change**.

---

## 4. Team Node version

| Constraint | Allowed Node |
|---|---|
| Expo 58 / react-native 0.88.1 | ^22.13 · ^24.3 · ≥26 |
| Next 15.5.24 | ^18.18 · ^19.8 · ≥20 |
| @typescript-eslint 7.18 (api) | ^18.18 · ≥20 |
| Jest 29.7 / ts-jest 29.4 | ≥18 / ≥20 |
| Prisma 5.22 | ≥16.13 |
| bcrypt 5.1.1 | ≥10 (N-API prebuilt binary, R4) |
| Current root `engines` | ≥22 |

**Pick: Node 24.12.0** (24.x LTS line). It is already installed on this machine, satisfies every range above, and avoids
the newest major (26) for 2023–2024-era tooling such as ESLint 8, Jest 29 and bcrypt 5. Pin it the same way in all three
projects: `.nvmrc` containing `24.12.0` and `"engines": { "node": ">=24.3.0 <25" }` in each `package.json`. Node 22.13+ also
satisfies the ranges, but the team uses one version only. b4f pins no Node version, so pinning adds to its architecture
without conflicting with it.

---

## 5. Architecture alignment work

### 5.1 API auth → b4f pattern
Current (`src/app.module.ts`): three **global** `APP_GUARD`s (Throttler → custom `JwtAuthGuard` → `RolesGuard`) plus
`@Public()` / `@Roles()` / `@Authenticated()` decorators. The JWT payload is `{ sub, role }` and is **trusted without a DB
reload**. It uses separate access/refresh secrets (`JWT_ACCESS_SECRET` 15m, `JWT_REFRESH_SECRET` 30d) and a `refreshTokenHash` column.

Required changes:
1. Add `@nestjs/passport` + `passport-jwt`. Create `auth/jwt.strategy.ts` (`ExtractJwt.fromAuthHeaderAsBearerToken()`), whose
   `validate()` reloads `{ id, role, isActive }` from the DB and throws 401 if the user is missing or inactive. Then
   `auth/jwt-auth.guard.ts` = `AuthGuard('jwt')`.
2. Remove the global `JwtAuthGuard` / `RolesGuard` `APP_GUARD`s and the `@Public()` decorator. Put
   `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` at **class level** on the protected controllers. Controllers that mix
   public and protected endpoints (campaigns, lookups, pledges, auth) get either method-level guards (as b4f's
   `AuthController.me`) or a split into a public controller and a protected controller (as b4f's projects controllers).
   Keep `ThrottlerGuard` global: it is an extra lib and not an auth decision.
3. `CurrentUser` / `AuthenticatedUser` must carry `role`.
4. Token model: b4f issues **one access token** (`JWT_SECRET`, `JWT_EXPIRES_IN` default `8h`) with **no refresh endpoint**.
   The b4f pattern means: remove `/auth/refresh`, `refreshTokenHash`, the `JWT_REFRESH_*` variables, and the refresh logic in
   web middleware and in mobile `src/lib/api.ts`. Logout becomes client-side token deletion (stateless, same as b4f).
5. bcryptjs → bcrypt (`hash(pw, 10)`, `compare`). Import style: `import * as bcrypt from 'bcrypt'`.
6. Add b4f's `common/filters/http-exception.filter.ts` (`AllExceptionsFilter`) and `LoggingInterceptor`. Currently
   **not present**. The filter keeps `message`, so today's error codes (`invalid_credentials`, `phone_taken`…) that the web
   and mobile i18n map on still arrive unchanged.
7. Swagger path `docs` → `api/docs`. CORS: b4f reads one `WEB_ORIGIN`; we need web (3000) plus Expo web dev (8081), so parse
   `WEB_ORIGIN` as a comma list. This is a small, contained deviation.

### 5.2 Six roles inside services: is b4f's pattern enough?
Roles here are a **global per-user enum** (`prisma/schema.prisma` `enum Role { DONOR, CASE_OFFICER, FINANCE_VERIFIER,
STAFF, ADMIN, COLLECTOR }`). b4f's roles are **per-workspace membership** roles. b4f's mechanism is a shared access
service that services call before acting (`requireRole(...)` → 403, `requireMembership(...)` → 404), and it expresses six
global roles **without a roles guard**:

```ts
// src/common/access/role-access.service.ts
@Injectable()
export class RoleAccessService {
  requireRole(user: AuthenticatedUser, roles: Role[]): void {
    if (!roles.includes(user.role)) {
      throw new ForbiddenException(`Requires one of these roles: ${roles.join(', ')}`);
    }
  }
}
// in a service: this.access.requireRole(user, [Role.STAFF, Role.ADMIN]);
```

Verdict: **no separate roles guard is needed.** Cost: there are **28 `@Roles(...)` usages across 9 of the 12 controllers**
(grep of `src/**/*.controller.ts`). Each moves into the first line of the matching service method, and services that do
not receive the user yet must take `user: AuthenticatedUser`. The declarative Swagger `@ApiForbiddenResponse` that the
`@Roles()` helper added is lost, so add it manually where it matters. Main risk: a forgotten check is now silent (R5).

### 5.3 What the API needs so mobile can use a Bearer token
In b4f the API **already accepts only `Authorization: Bearer`**. The HttpOnly cookie lives only in Next.js, and
`apiFetch` forwards it server-side as a Bearer header. So the API needs **no second auth path**. Requirements:
- `JwtStrategy` keeps `fromAuthHeaderAsBearerToken()` and never reads cookies. The API never sets cookies.
- `/auth/login` returns `{ accessToken, user }` in the JSON body (b4f shape). Mobile and web Server Actions both consume it.
- Mobile keeps the token in `expo-secure-store` (already done in `apps/mobile/src/lib/storage.ts`). The `localStorage`
  fallback is for Expo web dev only.
- With no refresh token (b4f), mobile handles **401 → clear token → login screen**. Users re-log after 8h.
- Native apps send no `Origin`, so CORS does not apply to them. Only Expo web (8081) needs to be in `WEB_ORIGIN`.
- Revocation: a stateless JWT stays valid until expiry. Reloading the user in `validate()` (with an `isActive` check) is
  what blocks deleted or deactivated accounts.
- Swagger already has `addBearerAuth()`.

### 5.4 Web → b4f pattern
| Current | Target | Work |
|---|---|---|
| `src/lib/api.ts`: `api<T>()` reads cookie itself, no `server-only`, falls back to `NEXT_PUBLIC_API_URL` | `lib/api/client.ts` `apiFetch(path, { token })` + one file per resource, `server-only`, `NEST_API_URL` | Rewrite + split |
| `lib/auth-cookies.ts`: `mf_access` (15m) + `mf_refresh` (30d), client-side JWT decode for role | `lib/session/index.ts`: one `session` cookie, 8h, `server-only` | Rewrite. Role for UI comes from `authApi.me(token)` (Redux), not from decoding the JWT |
| `src/middleware.ts`: next-intl locale routing + token refresh | **no middleware** | Remove refresh (it goes with §5.1 step 4). For i18n see R6 |
| Routes under `app/[locale]/…` | `app/(auth)/…`, `app/(app)/…` (+ public pages) | Move files. `(app)/layout.tsx` calls `requireSessionToken()` |
| Server Actions in `app/[locale]/dashboard/actions.ts`, `lib/auth-actions.ts`; `ActionResult {ok,error}` | `lib/actions/<resource>.ts`, `FormState { error? }`, `assertUuid`, `safeRevalidate` | Reorganise |
| `app/api/files/[kind]/[id]/route.ts` (file proxy with token) | b4f has no Route Handlers | Keep as a necessary deviation (Server Actions cannot serve binary to `<img>`/download). Read token via `lib/session` |
| No Redux / Theme / Toast | RTK `currentUser` slice + `StoreProvider`; `ThemeContext`; `ToastContext` + `ToastViewport` | Add (copy from b4f) |
| Tailwind 4 `@import 'tailwindcss'` + `@theme` (11 tokens) in `globals.css`, `@tailwindcss/postcss` | Tailwind 3 `tailwind.config.ts` `theme.extend` + `@tailwind` directives, `postcss.config.js` (tailwindcss, autoprefixer), `.btn-*`/`.field-input`/`.card` component classes | Rewrite CSS config. The tokens map 1:1 (`brand-*`, `ink`, `muted`, `line`, `urgent`, `pending`, `font-sans`) |
| No tests | Vitest 3 + Testing Library | Add config + a few tests |

### 5.5 Copying the shared package
`packages/shared/src` = 484 lines (`enums.ts` 156, `schemas.ts` 143 zod, `types.ts` 108, `utils.ts` 54, `constants.ts` 18).
What each app imports from it (grep):
- **api** (20 files): constants, enum arrays, response types, `normalizePhone`, `toLatinDigits`. **zod** only in `src/imports/imports.service.ts`.
- **web** (12 files): enum types, `formatMoney`, `progressPercent`, response types. No zod.
- **mobile** (8 files): response types, `LIMITS`, `DEMO_PAYMENT_METHODS`, `formatMoney`, `progressPercent`, `whatsappShareUrl`. No zod.

Copy as `src/shared/` (api: `src/common/shared/`), without the zod schemas in web and mobile. In api, either keep `zod
3.25.76` for the import-row validation only, or rewrite that one schema with class-validator. In the API, Prisma's
generated enums become the source of truth. `test/core.test.ts` already asserts that shared enums equal Prisma enums;
port it to Jest. With three copies, add a check that the web and mobile copies match the api copy (R10).

### 5.6 Schema conventions (01 rule 9)
Current IDs are `String @id @default(cuid())` with PascalCase table names (no `@@map`). b4f uses
`@id @default(uuid()) @db.Uuid` and `@@map("snake_case_plural")`. The migration must be regenerated anyway under Prisma 5
(R3), so this is the cheapest moment to switch. It touches the schema, seed, any id validation (`@IsUUID` / `ParseUUIDPipe`
instead of string checks), and `safeRevalidate` regexes on web.

---

## 6. Cost estimate (person-hours, one developer familiar with the code)

Code size: api ≈ 3,380 lines, web ≈ 1,800, mobile ≈ 1,080 (`.ts`/`.tsx` under each `src/`).

| # | Work item | Low | High |
|---|---|---|---|
| **Repo / tooling** | | | |
| T1 | Split into 3 npm projects: remove pnpm/turbo/workspaces files, write 3 `package.json` with exact target versions, `npm install` ×3, commit 3 lockfiles, `.nvmrc`, `engines` | 2 | 4 |
| T2 | Inline `@majlis/tsconfig` and `@majlis/eslint-config` per app; ESLint 8 legacy config ×3 (+ prettier in api); fix new lint findings | 2 | 4 |
| T3 | Docs: root README, per-app README, new CLAUDE.md with 01 rules; root scripts replaced by per-app commands | 1 | 2 |
| **API** | | | |
| A1 | Nest 11→10, config 4→3.3, swagger 11→7.4.2, jwt 11→10.2, Express 5→4 types; compile and fix | 2 | 4 |
| A2 | Prisma 6.19.3→5.22.0, regenerate migration (+ uuid/`@@map` switch §5.6), adapt seed (tsx→ts-node), reset dev DB | 3 | 6 |
| A3 | Auth rewrite: passport-jwt strategy, class-level guards on ~12 controllers, split mixed controllers, remove refresh flow, bcrypt | 4 | 7 |
| A4 | Move 28 `@Roles` into `RoleAccessService.requireRole` calls in services; thread `user` into services | 4 | 6 |
| A5 | Add `AllExceptionsFilter`, `LoggingInterceptor`; Swagger path; CORS list | 1 | 2 |
| A6 | Copy shared code; decide on zod in imports; class-validator 0.15→0.14 check | 1 | 3 |
| A7 | Jest 29 setup; port `test/core.test.ts`; add role/authorization tests (WorkspaceAccess-style unit + 1 integration) | 3 | 6 |
| **Web** | | | |
| W1 | Next 15.5.29→15.5.24, React 19.1.10→19.3.0, types; build | 0.5 | 1 |
| W2 | `lib/session` + `lib/api/client.ts` + per-resource API files; env `NEST_API_URL`; remove client JWT decode | 3 | 5 |
| W3 | Remove middleware; i18n without locale routing (R6); move `app/[locale]/*` → route groups `(auth)`/`(app)` | 4 | 7 |
| W4 | Reorganise Server Actions into `lib/actions/*` with `FormState`, `assertUuid`, `safeRevalidate` | 2 | 3 |
| W5 | Redux `currentUser` + `StoreProvider`; Theme + Toast contexts; shared `ui/` primitives aligned with b4f naming | 2 | 4 |
| W6 | Tailwind 4→3 config rewrite + visual QA of all pages (R2) | 2 | 4 |
| W7 | Vitest setup + 2–3 component tests | 1.5 | 3 |
| **Mobile** | | | |
| M1 | Standalone npm project: drop `workspace:*`, copy shared, reinstall, `npx expo install --check` / `npx expo-doctor` | 1 | 2 |
| M2 | TS 6.0.3→5.9.3 and ESLint 9 flat→8 legacy (`extends: 'expo'`); fix findings | 1 | 2 |
| M3 | Remove refresh flow: Bearer access token only, 401 → logout → login | 1 | 2 |
| **QA** | | | |
| Q1 | End-to-end smoke of each role flow on web + mobile against the aligned API; fix regressions | 4 | 8 |
| | **Total** | **≈ 45 h** | **≈ 85 h** |

Rough split: API ≈ 18–34 h, web ≈ 15–27 h, mobile ≈ 3–6 h, tooling/docs/QA ≈ 9–18 h. With three people working in
parallel (one per project), expect **2–3 working days**. The API must land first, because the web and mobile auth changes
depend on its token contract (A3).

---

## 7. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Auth contract change breaks web + mobile at the same time** (refresh removed, payload/role source changes, guard semantics change from "global + @Public" to "class-level") | High | High | Do A3 first, behind a written contract (login response shape, 401 behaviour). Before removing the global guard, list every endpoint that was `@Public()` (8 usages) and every endpoint that had no decorator at all (protected by the global guard) so none becomes accidentally protected or unprotected |
| R2 | Tailwind 4→3 visual regressions: v4 default `border` colour is `currentColor`, v3 is `gray-200` (≈40 bare `border` uses); `shadow-sm` scale shifted in v4 (2 uses); CSS variables from `@theme` disappear | Medium | Low–Medium | Define the 11 tokens in `tailwind.config.ts`. Click through every page once in light + RTL |
| R3 | **Prisma 6→5 migration drift**: the existing migration was generated by Prisma 6. Example: implicit m‑n table `_CollectorPoints` uses a `PRIMARY KEY ("A","B")`, while Prisma 5 expects a unique index. `migrate dev` will report drift | High (certain if migrations are kept) | Medium | Delete and regenerate the migration history under Prisma 5.22 (it is a hackathon DB; reseed). Do it together with the uuid/`@@map` switch |
| R4 | **bcrypt 5.1.1 native install on Windows/macOS**: it downloads a prebuilt N-API binary via node-pre-gyp. If the download fails, it compiles from source, which needs Python + C++ build tools. Not verified here (no installs allowed) | Medium | Medium (blocks `npm install` on a teammate's machine) | Run `npm ci` in `api/` on **every** team machine on day 1. Keep build-tool install instructions in the README |
| R5 | Role checks moved into services are easier to forget than a declarative `@Roles` | Medium | High (privilege bug) | One `RoleAccessService`. Add a Jest test per sensitive service method (finance verification, disbursements, case review) asserting `ForbiddenException` for disallowed roles |
| R6 | **next-intl vs "no middleware"**: current i18n uses `[locale]` URL segments + `createIntlMiddleware`. b4f has no middleware | High | Medium | Use next-intl **without i18n routing** (locale from a cookie, read in `i18n/request.ts`; the existing `app/lang`-style switch sets the cookie). URLs lose the `/ar` and `/en` prefix, so check mobile `whatsappShareUrl` / `EXPO_PUBLIC_SITE_URL` links and any shared receipt links |
| R7 | Mobile TS 6→5.9 and ESLint 9→8 diverge from Expo 58's template defaults; `expo-doctor` or `expo lint` may warn or try to scaffold a flat config | Medium | Low | Verified: Expo tsconfig base needs only TS ≥5.5, and eslint-config-expo 58 supports ESLint ≥8.10 legacy. Run `npx expo lint` with an existing `.eslintrc.js` and ignore the TS-version notice |
| R8 | `@types/node` 20 (b4f) under Node 24 runtime: newer Node APIs are not typed | Low | Low | Avoid Node ≥21-only APIs in code, or document a types-only exception |
| R9 | Next **15.5.29 → 15.5.24** downgrade drops five later patch releases (possible security fixes) | Medium | Medium | Accepted by the team decision. Record it in the README. Do not expose the dev server publicly |
| R10 | Three hand-copied shared folders drift (enum added in api, forgotten in web/mobile) | Medium | Medium | Jest test in api comparing Prisma enums to `src/common/shared`. Add a small `scripts/check-shared.js` (or a test) that diffs the web and mobile copies against the api copy |
| R11 | 8h token, no refresh: mobile users are logged out daily; long web sessions expire mid-demo | High | Low | Acceptable for the hackathon (same as b4f). The demo script logs in fresh |
| R12 | Extra libs not in b4f (`@nestjs/throttler`, `sharp`, `exceljs`, `csv-parse`, `next-intl`, `i18next`, zod) could be read as violating the "match b4f" rule | Low | Medium | They are domain libs, not architecture. Verified that throttler and next-intl peer ranges accept Nest 10 and Next 15 / React 19. List them in the README as additions |
| R13 | `sharp` and Prisma engines need install scripts. pnpm's `onlyBuiltDependencies` allow-list disappears under npm (npm runs install scripts by default) | Low | Low | None needed. Just confirm `npm ci` runs cleanly |

---

## 8. Order of work (dependency-driven)

1. **T1 + T2** for all three projects (mechanical; unblocks everything).
2. **API: A1 → A2 → A3 → A4 → A5–A7.** Freeze the auth contract after A3.
3. In parallel after A3: **Web W1–W7** and **Mobile M1–M3**.
4. **Q1** smoke test per role, then **T3** docs + CLAUDE.md.
