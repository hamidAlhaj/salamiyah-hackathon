# 01 — Reference Analysis: `b4f-board-final/` (BINDING REFERENCE)

> Read-only analysis. All paths are relative to `b4f-board-final/`.
> Ignored: `node_modules`, `.next`, `dist`, `.turbo`, `.git`, `*.tsbuildinfo`, `uploads`.
> **Note:** no `node_modules/` exists in `api/` or `web/`, so "installed" below means the exact
> version **resolved in `package-lock.json`** (what `npm ci` would install).

## 0. Repository shape

```
b4f-board-final/
├── README.md, .gitignore          # no root package.json, no npm workspaces, no turbo
├── api/                           # NestJS backend — own package.json + package-lock.json
└── web/                           # Next.js frontend — own package.json + package-lock.json
```

Two independent npm projects side by side (not a monorepo tool setup). Each is installed and run
from its own folder.

---

## 1. Exact versions

### 1.1 Runtime & package manager

| Item | Declared | Actually resolved / evidence |
|---|---|---|
| Node.js | **not pinned**: no `engines` field in either `package.json`, no `.nvmrc`, no `.node-version` | `README.md` → "Node.js 18 or later (verified against Node 18.20)". Effective floor from deps: `next@15.5.24` and `@typescript-eslint/*` require `^18.18.0 \|\| >=20` |
| Package manager | **npm** (no `packageManager` field; no pnpm/yarn lockfiles) | `api/package-lock.json` and `web/package-lock.json` are both `lockfileVersion: 3` (npm ≥ 7) |
| Database | PostgreSQL (`api/prisma/schema.prisma` `provider = "postgresql"`) | `README.md` → "PostgreSQL 14 or later"; local instance on port **5433**, DB `b4f_board` (`api/.env.example`, `api/README.md`) |

### 1.2 Backend — `api/package.json` vs `api/package-lock.json`

| Package | Declared | Resolved (lock) |
|---|---|---|
| @nestjs/common | ^10.4.4 | **10.4.22** |
| @nestjs/core | ^10.4.4 | **10.4.22** |
| @nestjs/platform-express | ^10.4.4 | **10.4.22** |
| @nestjs/testing (dev) | ^10.4.4 | **10.4.22** |
| @nestjs/cli (dev) | ^10.4.5 | **10.4.9** |
| @nestjs/schematics (dev) | ^10.1.4 | 10.2.3 |
| @nestjs/config | ^3.2.3 | **3.3.0** |
| @nestjs/swagger | ^7.4.2 | **7.4.2** |
| @nestjs/jwt | ^10.2.0 | **10.2.0** (→ jsonwebtoken 9.0.2) |
| @nestjs/passport | ^10.0.3 | **10.0.3** |
| passport | ^0.7.0 | **0.7.0** |
| passport-jwt | ^4.0.1 | **4.0.1** |
| prisma (dev) | ^5.20.0 | **5.22.0** |
| @prisma/client | ^5.20.0 | **5.22.0** |
| bcrypt | ^5.1.1 | **5.1.1** |
| class-validator | ^0.14.1 | **0.14.4** |
| class-transformer | ^0.5.1 | **0.5.1** |
| reflect-metadata | ^0.2.2 | 0.2.2 |
| rxjs | ^7.8.1 | 7.8.2 |
| typescript (dev) | ^5.6.2 | **5.9.3** |
| ts-node (dev) | ^10.9.2 | 10.9.2 |
| jest (dev) | ^29.7.0 | **29.7.0** |
| ts-jest (dev) | ^29.2.5 | **29.4.14** |
| @types/jest (dev) | ^29.5.13 | 29.5.14 |
| eslint (dev) | ^8.57.1 | **8.57.1** (legacy `.eslintrc.js` config) |
| @typescript-eslint/parser + eslint-plugin (dev) | ^7.18.0 | **7.18.0** |
| prettier (dev) | ^3.3.3 | **3.9.9** |
| eslint-config-prettier / eslint-plugin-prettier (dev) | ^9.1.0 / ^5.2.1 | 9.1.2 / 5.5.6 |
| @types/node (dev) | ^20.16.10 | 20.19.43 |
| dotenv | **not declared** (used by `api/test/jest-setup.ts`) | 16.4.5 (transitive, via @nestjs/config) |
| `overrides` | `"qs": "6.16.0"` | 6.16.0 |
| Next / React / Tailwind / Redux / Vitest | not present (backend) | — |

### 1.3 Frontend — `web/package.json` vs `web/package-lock.json`

| Package | Declared | Resolved (lock) |
|---|---|---|
| next | **15.5.24** (exact pin) | **15.5.24** |
| react / react-dom | ^19.1.0 | **19.3.0** |
| @types/react / @types/react-dom (dev) | ^19.1.0 | 19.3.0 |
| typescript (dev) | ^5.6.2 | **5.9.3** |
| tailwindcss (dev) | ^3.4.13 | **3.4.19** (Tailwind **v3**, `tailwind.config.ts` + PostCSS) |
| postcss / autoprefixer (dev) | ^8.4.47 / ^10.4.20 | 8.5.28 / 10.6.1 |
| @reduxjs/toolkit | ^2.2.7 | **2.13.0** |
| react-redux | ^9.1.2 | **9.3.0** |
| server-only | ^0.0.1 | 0.0.1 |
| @dnd-kit/core | ^6.3.1 | 6.3.1 |
| vitest (dev) | ^3.0.5 | **3.2.7** |
| @vitejs/plugin-react (dev) | ^4.3.4 | 4.7.0 |
| jsdom (dev) | ^25.0.1 | 25.0.1 |
| @testing-library/react / dom / jest-dom (dev) | ^16.0.1 / ^10.4.0 / ^6.6.3 | 16.3.3 / 10.4.2 / 6.9.1 |
| eslint (dev) | ^8.57.1 | **8.57.1** |
| eslint-config-next (dev) | 15.5.24 (exact pin) | 15.5.24 (pulls @typescript-eslint 8.71.0) |
| prettier | **not present** as a dependency (only a `web/.prettierrc` file exists) | not present |
| jest | not present (web uses Vitest) | — |
| `overrides` | `"postcss": "$postcss"` | — |
| passport / bcrypt / class-validator / Prisma | not present (frontend) | — |

### 1.4 Summary table (requested items)

| Tech | Declared | Resolved |
|---|---|---|
| Node | not pinned (README: ≥18, verified 18.20) | n/a |
| NestJS | ^10.4.4 | 10.4.22 |
| Prisma / @prisma/client | ^5.20.0 / ^5.20.0 | 5.22.0 / 5.22.0 |
| Next | 15.5.24 | 15.5.24 |
| React | ^19.1.0 | 19.3.0 |
| TypeScript | ^5.6.2 (both) | 5.9.3 (both) |
| Tailwind | ^3.4.13 | 3.4.19 |
| Redux Toolkit | ^2.2.7 | 2.13.0 |
| passport / @nestjs/jwt | ^0.7.0 / ^10.2.0 | 0.7.0 / 10.2.0 |
| bcrypt | ^5.1.1 | 5.1.1 |
| class-validator | ^0.14.1 | 0.14.4 |
| Jest (api only) | ^29.7.0 | 29.7.0 |
| Vitest (web only) | ^3.0.5 | 3.2.7 |
| ESLint | ^8.57.1 (both) | 8.57.1 |
| Prettier | ^3.3.3 (api only) | 3.9.9 |
| Package manager | npm (lockfileVersion 3) | — |

---

## 2. API architecture (`api/`)

### 2.1 Module organization
One NestJS module per domain under `api/src/`, each folder = `*.module.ts` + `*.controller.ts` +
`*.service.ts` + `dto/` + co-located `*.spec.ts`:

`auth/`, `users/`, `workspaces/`, `projects/`, `sprints/`, `issues/`, `comments/`, `activity/`
(service only, no controller), `notifications/`, `prisma/`, `common/`.

`api/src/app.module.ts` imports `ConfigModule.forRoot({ isGlobal: true })`, `PrismaModule`, then all
domain modules, and registers `LoggingInterceptor` globally via `{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }`.

Cross-module sharing is by `exports`: e.g. `WorkspacesModule` exports `WorkspaceAccessService`
(`api/src/workspaces/workspaces.module.ts`); `AuthModule` exports `JwtModule`.
Nested + flat controllers can live in one file (`api/src/projects/projects.controller.ts`:
`WorkspaceProjectsController` at `workspaces/:workspaceId/projects` and `ProjectsController` at `projects`).

### 2.2 `main.ts` (`api/src/main.ts`)

| Concern | Value |
|---|---|
| Global prefix | **not present** (no `setGlobalPrefix`) → routes are at root, e.g. `POST /auth/login` |
| CORS | `app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true })` |
| ValidationPipe | global: `{ whitelist: true, forbidNonWhitelisted: true, transform: true }` |
| Exception filter | global `new AllExceptionsFilter()` |
| Swagger | `DocumentBuilder().setTitle('B4F Board API').setVersion('0.1.0').addBearerAuth()`, served at **`/api/docs`** |
| Port | `process.env.PORT ?? 4000` |
| Logger | `new Logger('Bootstrap')` |
| Shutdown hooks | `PrismaService.enableShutdownHooks()` is defined but **never called** |

### 2.3 `common/`

| File | Purpose |
|---|---|
| `common/filters/http-exception.filter.ts` | `@Catch()` `AllExceptionsFilter` — uniform error body `{ statusCode, message, error, path, timestamp }`; unknown errors → 500 "Internal server error", stack logged, never leaked |
| `common/interceptors/logging.interceptor.ts` | `LoggingInterceptor` — logs `METHOD url status durationms` only (never bodies/tokens) |
| `common/decorators/current-user.decorator.ts` | `CurrentUser` param decorator + `AuthenticatedUser { id, email, name }` interface; reads `request.user` |
| `common/mentions.util.ts` | domain helper (mention parsing) |
| `common/seed-safety.util.ts` | pure guard: seed refuses unless `DATABASE_URL` is localhost / port 5433 / db `b4f_board` (override env var `SEED_ALLOW_UNSAFE_DATABASE_URL`) |
| Guards in common | **not present** (the only guard is `auth/jwt-auth.guard.ts`) |
| Roles decorator / `SetMetadata` | **not present** |

### 2.4 Auth flow
- **Register** — `POST /auth/register` (`auth/auth.controller.ts`) → `AuthService.register`
  (`auth/auth.service.ts`): `findUnique` by email → `ConflictException` (409) if taken →
  `bcrypt.hash(password, 10)` (`BCRYPT_ROUNDS = 10`) → `user.create` with `select` (never returns
  `passwordHash`). Returns `{ id, name, email, createdAt }`. **No token** is issued on register.
- **Login** — `POST /auth/login` with `@HttpCode(200)` → user lookup + `bcrypt.compare`; both failure
  paths throw the same `UnauthorizedException('Invalid email or password')`. Signs
  `{ sub: user.id, email }` with `JwtService.signAsync`. Returns `{ accessToken, user: { id, name, email } }`.
- **Me** — `GET /auth/me` guarded, returns `@CurrentUser()`.
- **JwtModule** (`auth/auth.module.ts`): `registerAsync` with `ConfigService`;
  `secret: config.getOrThrow('JWT_SECRET')`, `expiresIn: JWT_EXPIRES_IN ?? '8h'`.
- **JwtStrategy** (`auth/jwt.strategy.ts`): `ExtractJwt.fromAuthHeaderAsBearerToken()`,
  `ignoreExpiration: false`; `validate()` re-loads the user from DB (`select id, email, name`) and
  throws 401 if deleted. The returned object becomes `request.user`.
- **Guard** (`auth/jwt-auth.guard.ts`): `export class JwtAuthGuard extends AuthGuard('jwt') {}`.
  Applied at **class level** on every protected controller together with `@ApiBearerAuth()`.
- **CurrentUser**: `@CurrentUser() user: AuthenticatedUser` — the only trusted source of the caller.

### 2.5 Authorization / roles
- No RBAC guard and no `@Roles()` decorator. Authorization is **service-layer**, centralized in
  `api/src/workspaces/workspace-access.service.ts`:
  - `requireMembership(workspaceId, userId)` → **404 `NotFoundException`** for non-members
    (never 403, to hide existence).
  - `requireRole(workspaceId, userId, roles: WorkspaceRole[])` → membership first, then
    **403 `ForbiddenException`** if role not allowed.
- Roles are a Prisma enum `WorkspaceRole { OWNER, ADMIN, MEMBER }` stored per membership
  (`WorkspaceMember`, `@@unique([workspaceId, userId])`). There is no global/user-level role.
- Services call it first thing: e.g. `ProjectsService.create` → `requireRole(..., [OWNER, ADMIN])`;
  `findOne` → load resource (404 if missing) → `requireMembership(resource.workspaceId, userId)`.
- Controllers pass `user.id` into services; services always take `userId` as an argument.

### 2.6 PrismaService (`api/src/prisma/`)
- `PrismaService extends PrismaClient implements OnModuleInit` → `$connect()` in `onModuleInit`.
- `PrismaModule` is `@Global()` and exports `PrismaService` (no per-module import needed).
- Multi-write operations use `this.prisma.$transaction(async (tx) => …)` (issues, comments, sprints, workspaces services).
- Schema conventions (`api/prisma/schema.prisma`): `id String @id @default(uuid()) @db.Uuid`,
  camelCase fields, `@@map("snake_case_plural")` table names, explicit `onDelete` on every relation,
  `createdAt @default(now())`, `updatedAt @updatedAt`, explicit `@@index`. Migrations in `prisma/migrations/`.

### 2.7 DTO style
- Classes in `<module>/dto/<verb>-<entity>.dto.ts` (`create-issue.dto.ts`, `update-issue.dto.ts`, `query-issues.dto.ts`).
- Every field has a Swagger decorator (`@ApiProperty({ example })` / `@ApiPropertyOptional()`) **plus** class-validator decorators.
- Optional fields: `@IsOptional()` first. Enums reuse Prisma enums: `@IsEnum(IssuePriority)`.
- Update DTOs are written out by hand (**no** `PartialType`/`@nestjs/mapped-types`).
- Ids in path params are validated with `ParseUUIDPipe`; ids in bodies with `@IsUUID()`.
- Explicit bounds everywhere (`@MinLength(1) @MaxLength(120)`, `@Min(0) @Max(999)`, password `@MaxLength(72)` for bcrypt).

### 2.8 Testing style (Jest)
- Config inline in `api/package.json`: `rootDir: "src"`, `testRegex: ".*\\.spec\\.ts$"`, `ts-jest`,
  `testEnvironment: node`, `setupFiles: ["<rootDir>/../test/jest-setup.ts"]` (loads `api/.env` via dotenv).
- Spec files co-located with the code (`src/**/x.spec.ts`, `*.integration.spec.ts`).
- **No `Test.createTestingModule`**, no supertest/e2e. Services are instantiated directly with `new`.
- Two styles:
  1. **Unit with hand-rolled mocks** — `src/workspaces/workspace-access.service.spec.ts`
     (`prisma = { workspaceMember: { findUnique: jest.fn() } }`).
  2. **Integration against the real local Postgres** — `src/integration/authorization.integration.spec.ts`,
     `src/users/users.service.spec.ts`, etc.: `new PrismaService()`, run-unique emails
     (`test-${Date.now()}-label@b4ftest.local`), `beforeAll` creates fixtures, `afterAll` deletes them.
- Assertions on exception classes: `rejects.toBeInstanceOf(ForbiddenException)`.

### 2.9 Seed (`api/prisma/seed.ts`)
- Run with `npm run seed` (= `ts-node prisma/seed.ts`); also registered as `"prisma": { "seed": … }`.
- Calls `assertSafeToResetDemoData()` (uses `common/seed-safety.util.ts`) **before** a destructive reset.
- Uses its own `new PrismaClient()`, `bcrypt.hash(DEMO_PASSWORD, 10)`, fictional users `*@b4fdemo.local`,
  prints demo logins at the end. Writes `activity_logs` directly (documented exception, `api/README.md`).
- Excluded from build in `api/tsconfig.build.json`.

### 2.10 Environment variables
`api/.env.example`:

| Var | Example |
|---|---|
| `DATABASE_URL` | `postgresql://<your-username>@localhost:5433/b4f_board?schema=public` |
| `PORT` | `4000` |
| `WEB_ORIGIN` | `http://localhost:3000` |
| `JWT_SECRET` | demo string |
| `JWT_EXPIRES_IN` | `8h` |

`web/.env.example`: `NEST_API_URL="http://localhost:4000"`, `NODE_ENV="development"`. No `NEXT_PUBLIC_*` variables.

### 2.11 Lint / format / TS config
- `api/.eslintrc.js`: `@typescript-eslint/recommended` + `plugin:prettier/recommended`; `no-explicit-any: warn`; unused vars warn with `^_` ignore.
- `api/.prettierrc`: `singleQuote`, `trailingComma: all`, `printWidth: 95`.
- `api/tsconfig.json`: `commonjs`, `ES2021`, decorators on, `strictNullChecks`, `noImplicitAny` (not full `strict`).

---

## 3. Web architecture (`web/`)

### 3.1 Routing (App Router, `web/src/app/`)
- `(auth)/` — public: `login/page.tsx` + `LoginForm.tsx`, `register/page.tsx` + `RegisterForm.tsx`.
- `(app)/` — session required: `dashboard`, `notifications`, `profile`, `workspaces/…/projects/[projectId]/{board,backlog,issues/[issueId],sprints/[sprintId]}`, `workspaces/[workspaceId]/settings`.
- `(app)/layout.tsx` calls `requireSessionToken()` (redirects to `/login`) and fetches Navbar data.
- `app/page.tsx` redirects to `/dashboard` or `/login` depending on cookie.
- `app/layout.tsx` (root): fetches current user server-side (`authApi.me(token)`), wraps
  `ThemeProvider > ToastProvider > StoreProvider(initialUser)` + `<ToastViewport />`.
- Also: `app/error.tsx`, `app/not-found.tsx`, `app/icon.tsx`, per-route `loading.tsx`.
- Page-specific Client Components sit **next to the page** (`CreateProjectForm.tsx`, `FilterBar.tsx`).
- Route params are awaited (Next 15): `const params = await props.params;`.

### 3.2 Session storage — `web/src/lib/session/index.ts`
- `import 'server-only'`. One HttpOnly cookie named `session` holding the Nest JWT.
- Cookie options: `httpOnly: true`, `secure: NODE_ENV === 'production'`, `sameSite: 'lax'`, `maxAge: 8h`, `path: '/'`.
- Exports: `getSessionToken()`, `setSessionToken(token)`, `clearSessionToken()`, `requireSessionToken()` (→ `redirect('/login')`).
- The JWT never reaches browser JS.

### 3.3 Server-only typed API client — `web/src/lib/api/`
- `client.ts`: `import 'server-only'`; `apiFetch<T>(path, { method, token, body, query })` →
  `fetch(new URL(path, NEST_API_URL), { cache: 'no-store' })`, sets `Authorization: Bearer`, JSON body.
  - Non-OK → throws `ApiError(statusCode, body: ApiErrorShape)` (message joins arrays).
  - **401 with a token** → tries `clearSessionToken()` then `redirect('/login')`.
  - `orNotFound(promise)` converts a 404 into Next `notFound()`.
- One file per resource (`auth.ts`, `projects.ts`, `issues.ts`, …), each function takes `token` first and returns a typed promise.
- Shared response types in `web/src/lib/types/index.ts` (string unions mirror Prisma enums).

### 3.4 Server Actions — `web/src/lib/actions/`
- `'use server'` files, one per resource. **The only path from Client Components to the backend.**
  Verified: no `'use client'` file imports `lib/api` or `lib/session`; no `fetch(` outside `lib/api/client.ts`.
- Pattern: validate transport shape (`assertUuid`, trim `FormData`) → `requireSessionToken()` →
  call `lib/api/*` → catch `ApiError` → return `{ error }` (`FormState`) → `safeRevalidate(path)` and/or `redirect()`.
- `lib/actions/validation.ts` (`server-only`): `assertUuid`, `assertIssueStatus`, `assertNonEmptyString`, … and
  `safeRevalidate()`, which only revalidates paths matching a regex whitelist.
- Never decides authorization — Nest does.
- Server Components call `lib/api/*` directly during render (read path); Actions are the write path.
- Client usage: either `useActionState(action, initialState)` (`LoginForm.tsx`) or a direct
  `await action(...)` inside `<form action={fn}>`, followed by a toast (`components/sprint/CreateSprintForm.tsx`, the recommended pattern for toasts).

### 3.5 Redux usage — `web/src/store/`
- `store.ts`: `makeStore()` with a single reducer `currentUser`; exports `AppStore`, `RootState`, `AppDispatch`.
- `currentUserSlice.ts`: `{ user: CurrentUser | null }`, one reducer `setCurrentUser`.
- `StoreProvider.tsx` (`'use client'`): creates the store once in `useRef`, hydrates it with the server-fetched `initialUser`, re-dispatches on change.
- `hooks.ts`: `useAppDispatch`, `useAppSelector`.
- Only consumer: `components/layout/Navbar.tsx`.
- **Never** stores the JWT, memberships, issues, projects, or comments.
- Discrepancy: `web/README.md` mentions "a non-authoritative role/permission UX hint" in Redux. **Not present** in the code.

### 3.6 Middleware
**Not present** (no `web/middleware.ts` or `web/src/middleware.ts`). Route protection = `(app)/layout.tsx` + `requireSessionToken()` in each action/page.

### 3.7 Theme / Toast — `web/src/context/`
- `ThemeContext.tsx`: `'light' | 'dark'`, stored in `localStorage` key `b4f-board-theme` (try/catch), falls back to `prefers-color-scheme`, toggles the `dark` class on `<html>`. Hook `useTheme()`. Toggle UI: `components/layout/ThemeToggle.tsx`.
- `ToastContext.tsx`: kinds `success | error | warning | info`, auto-dismiss 5000 ms; public hook `useToast()` (→ `toast.success('…')`), internal `useToastInternal()` used only by `components/ui/ToastViewport.tsx`.
- Context is for UI config only; Redux for the current user only.

### 3.8 Shared UI — `web/src/components/`
Grouped by domain: `board/`, `issue/`, `sprint/`, `layout/`, `ui/`.
`components/ui/`: `Avatar`, `Badge` (`StatusBadge`, `PriorityBadge`, `SprintStatusBadge`, `RoleBadge`), `ConfirmDialog`,
`FormParts` (`SubmitButton`, `FormError`), `MentionText`, `MentionTextarea`, `Modal`,
`States` (`Spinner`, `EmptyState`, `ErrorState`, `ForbiddenState`), `ToastViewport`, `UserPicker`.
Named exports only (`export function X`). No external UI library (no shadcn, no headless UI).

### 3.9 Tailwind conventions
- Tailwind v3: `web/tailwind.config.ts` with `darkMode: ["class"]`, `content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"]`,
  custom colours `status.{todo,in-progress,review,done}` and `priority.{low,medium,high,urgent}`.
- `web/src/app/globals.css`: `@tailwind base/components/utilities`; `@layer components` classes
  **`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.field-input`, `.card`**; body `bg-white dark:bg-gray-950`.
- Utility classes inline with `dark:` variants; gray/blue palette; `text-sm`, `rounded-md`/`rounded-lg`.
- `postcss.config.js`: `tailwindcss` + `autoprefixer`.

### 3.10 Other web config
- `web/tsconfig.json`: `strict: true`, `moduleResolution: bundler`, alias `@/* → ./src/*`.
- `web/.eslintrc.json`: `next/core-web-vitals` only. `web/.prettierrc`: `singleQuote`, `trailingComma: all`, `printWidth: 100` (Prettier itself not installed in web).
- `web/next.config.js`: `reactStrictMode: true` only (its comment still says "Next 14").
- Tests: `web/vitest.config.ts` (jsdom, `globals: true`, alias `@`, setup `vitest.setup.ts` → `@testing-library/jest-dom/vitest`).
  Co-located `*.test.tsx` (`components/sprint/CreateSprintForm.test.tsx`, `components/issue/CommentForm.test.tsx`),
  Server Actions mocked with `vi.mock('@/lib/actions/…')`.

---

## 4. Architecture Rules (copy verbatim into the new project's CLAUDE.md)

```markdown
## Architecture Rules (mirrors b4f-board-final — do not diverge)

1. Keep two independent npm projects, `api/` (NestJS 10) and `web/` (Next.js 15.5.24 App Router), each with its own package.json and package-lock.json. Use npm only. Match the reference versions exactly: Nest ^10.4.4, Prisma ^5.20.0, Next 15.5.24, React ^19.1.0, TypeScript ^5.6.2, Tailwind ^3.4.13, RTK ^2.2.7, Jest ^29.7.0 (api), Vitest ^3.0.5 (web), ESLint ^8.57.1.
2. Create one Nest module per domain in `api/src/<domain>/` with `<domain>.module.ts`, `.controller.ts`, `.service.ts`, `dto/` and co-located `*.spec.ts`. Share providers only through module `exports`.
3. Configure `main.ts` exactly like the reference: CORS `{ origin: WEB_ORIGIN, credentials: true }`, global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`, global `AllExceptionsFilter`, Swagger with `addBearerAuth()` at `api/docs`, port from `PORT` (default 4000). Do not add a global prefix.
4. Return every error in the shape `{ statusCode, message, error, path, timestamp }` through `common/filters/http-exception.filter.ts`. Never leak stack traces. Log requests only through `LoggingInterceptor` (method, url, status, duration; never bodies or tokens).
5. Protect every controller except register/login with class-level `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`. Get the caller only from `@CurrentUser() user: AuthenticatedUser`, and pass `user.id` into the service.
6. Issue JWTs only from `AuthService.login` (`{ sub, email }`, `JWT_SECRET`, `JWT_EXPIRES_IN` default `8h`). Hash with bcrypt (10 rounds). In `JwtStrategy.validate`, re-load the user from the DB. Return the same 401 message for unknown email and wrong password.
7. Do authorization in the service layer through one shared access service (`requireMembership` → 404 for non-members, `requireRole` → 403 for wrong role). Do not add a Roles guard or decorator. Load the resource first (404 if missing), then check access.
8. Use the global `PrismaService` (`extends PrismaClient`, `$connect` in `onModuleInit`, `@Global()` module). Wrap multi-row writes in `prisma.$transaction(async (tx) => …)`. Never select or return `passwordHash`.
9. In the Prisma schema use `@id @default(uuid()) @db.Uuid`, camelCase fields, `@@map("snake_case_plural")`, an explicit `onDelete` on every relation, and explicit `@@index`es. Change the schema only through `prisma migrate dev`.
10. Write DTOs as classes in `dto/<verb>-<entity>.dto.ts` with `@ApiProperty`/`@ApiPropertyOptional` + class-validator on every field, `@IsOptional()` first, Prisma enums via `@IsEnum`, explicit min/max bounds. Write update DTOs by hand (no PartialType). Validate path ids with `ParseUUIDPipe`.
11. Test the API with Jest specs next to the code. Instantiate services with `new`, using either hand-rolled `jest.fn()` Prisma mocks or the real local DB with run-unique fixtures cleaned up in `afterAll`. Assert with `rejects.toBeInstanceOf(XException)`.
12. Keep the seed in `api/prisma/seed.ts` (run with `npm run seed` via ts-node). Use fictional data only, and guard it with a DB-URL safety check before any destructive reset.
13. In `web/`, split routes into `app/(auth)/` (public) and `app/(app)/` (protected by `requireSessionToken()` in `(app)/layout.tsx`). Do not add middleware.ts.
14. Store the Nest JWT only in the HttpOnly `session` cookie via `lib/session/index.ts` (`import 'server-only'`, `sameSite: 'lax'`, `secure` in production, 8h). The token must never reach Client Components or browser JS.
15. Talk to the API only through `lib/api/client.ts` (`apiFetch`, `server-only`, `NEST_API_URL`, `cache: 'no-store'`, throws `ApiError`, redirects to /login on 401 with a token). Add one typed file per resource in `lib/api/` with `token` as the first argument. Never call `fetch` anywhere else.
16. Read data in Server Components by calling `lib/api/*` directly. Write data only through `'use server'` actions in `lib/actions/<resource>.ts`: validate transport shape → `requireSessionToken()` → `lib/api` call → map `ApiError` to `{ error }` → `safeRevalidate()`/`redirect()`. Client Components must never import `lib/api` or `lib/session`.
17. Use Redux Toolkit only for the current-user snapshot (`currentUser` slice, hydrated by `StoreProvider` from the root layout). Never put server data or tokens in Redux. Use React Context only for Theme and Toast.
18. Fire toasts by calling the Server Action directly inside a `<form action={fn}>` handler and toasting on its result (`useToast().success(...)`). Do not fire them from a `useEffect` that watches action state.
19. Style with Tailwind v3 utilities, `dark:` class-mode variants, and the shared component classes in `globals.css` (`.btn-primary`, `.btn-secondary`, `.btn-danger`, `.field-input`, `.card`). Put reusable primitives in `components/ui/` as named exports, and domain components in `components/<domain>/`.
20. Test web components with Vitest + Testing Library (jsdom), co-located `*.test.tsx`, mocking Server Actions with `vi.mock('@/lib/actions/...')`.
```

### 4.1 Core pattern — protected controller (from `api/src/workspaces/workspaces.controller.ts`)

```ts
@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.findOne(id, user.id); // service calls access.requireMembership
  }
}
```

### 4.2 Core pattern — server action (from `web/src/lib/actions/sprints.ts`)

```ts
'use server';
export async function createSprintAction(projectId: string, revalidateBasePath: string,
  _prev: FormState, formData: FormData): Promise<FormState> {
  assertUuid(projectId, 'projectId');
  const token = await requireSessionToken();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Sprint name is required.' };
  try {
    await sprintsApi.createSprint(token, projectId, { name });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: 'Could not create the sprint.' };
  }
  safeRevalidate(revalidateBasePath);
  return {};
}
```

### 4.3 Core pattern — API client call (from `web/src/lib/api/projects.ts` + a Server Component)

```ts
// lib/api/projects.ts
import 'server-only';
import type { Project } from '../types';
import { apiFetch } from './client';

export function listProjects(token: string, workspaceId: string) {
  return apiFetch<Project[]>(`/workspaces/${workspaceId}/projects`, { token });
}

// app/(app)/workspaces/[workspaceId]/page.tsx (Server Component)
const token = await requireSessionToken();
const projects = await projectsApi.listProjects(token, params.workspaceId);
```

---

## 5. Run & test commands

### `api/` (`api/package.json` scripts)

| Script | Command |
|---|---|
| `build` | `nest build` |
| `start` | `nest start` |
| `start:dev` | `nest start --watch` |
| `start:prod` | `node dist/main` |
| `lint` | `eslint "{src,test}/**/*.ts" --fix` |
| `format` | `prettier --write "src/**/*.ts"` |
| `prisma:generate` | `prisma generate` |
| `prisma:migrate` | `prisma migrate dev` |
| `prisma:deploy` | `prisma migrate deploy` |
| `seed` | `ts-node prisma/seed.ts` |
| `test` | `jest` (integration specs need the real DB from `api/.env`) |
| `test:watch` | `jest --watch` |

### `web/` (`web/package.json` scripts)

| Script | Command |
|---|---|
| `dev` | `next dev` (port 3000) |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint "src/**/*.{ts,tsx}"` |
| `test` | `vitest run` |

### First-time setup (from `README.md`)

```bash
cd api && npm install && cp .env.example .env
npx prisma generate && npx prisma migrate dev && npm run seed
npm run start:dev                 # http://localhost:4000, Swagger at /api/docs
cd ../web && npm install && cp .env.example .env && npm run dev   # http://localhost:3000
```

Verification sequence (README): `npm run lint && npm run test && npm run build` in both `api/` and `web/`.

---

## 6. Gaps & inconsistencies noticed in the reference (informational)

- Node version not pinned anywhere (no `engines`, no `.nvmrc`). Only the README says "≥18 (verified 18.20)".
- `dotenv` is imported by `api/test/jest-setup.ts` but is not a declared dependency (it resolves transitively).
- `web/README.md` claims Redux also holds a role/permission hint. The code holds only `currentUser`.
- `web/README.md` scripts table omits `npm run test`, but the script exists.
- `web/next.config.js` comment mentions Next 14, while the installed version is 15.5.24.
- `PrismaService.enableShutdownHooks` exists but is never invoked from `main.ts`.
- `web/.prettierrc` exists but Prettier is not installed in `web/`.
- Comments reference `../../projects/b4f-board/specification/*.md`. Those files are **not present** in this folder.
