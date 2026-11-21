# 02b — Salamiyah ("Majlis Fund") Implementation Inventory

> Read-only. Scope: `منصة التمويل الجماعي في السلمية/`. All paths below are relative to that folder.
> Source of truth = **code only** (docs under `docs/` were not used as evidence). Versions and alignment are in 02 and are not repeated here.
> **Method caveat:** everything here comes from reading the code. Nothing was executed: no DB, no API, no app run, no tests run.
> "Complete" means the code path is fully written end to end (controller → service → Prisma, with validation, audit and
> error cases). It does not mean the path was observed working.

Size: api ≈ 3,380 lines (`apps/api/src`), web ≈ 1,800 (`apps/web/src`), mobile ≈ 1,080 (`apps/mobile/src`), shared 484 (`packages/shared/src`).

---

## 1. What is actually implemented

### 1.1 API (`apps/api/src`)

Global behaviour (`app.module.ts`): `ThrottlerGuard` (120 req/min), then `JwtAuthGuard` (every route requires a Bearer
token unless it has `@Public()`), then `RolesGuard` (`@Roles(...)`). Swagger at `/docs`. No global prefix.
"Auth" in the tables below = any logged-in user.

#### auth — `auth/auth.controller.ts`, `auth/auth.service.ts` · **complete**
| Method + path | Roles | What it does |
|---|---|---|
| POST `/auth/register` | public (5/min) | Creates a **DONOR** with phone + password (bcryptjs) and returns access + refresh tokens |
| POST `/auth/login` | public (10/min) | Phone + password → tokens (access 15m, refresh 30d; refresh hash stored on User) |
| POST `/auth/refresh` | public | Rotates tokens after checking the refresh hash and `isActive` |
| POST `/auth/logout` | auth | Clears `refreshTokenHash` |
| GET `/auth/me` | auth | Returns `{ id, fullName, phone, role, locale }` |

#### campaigns — `campaigns/campaigns.controller.ts`, `campaigns.service.ts`, `campaign-stats.service.ts` · **complete**
| Method + path | Roles | What it does |
|---|---|---|
| GET `/campaigns` | public | Paginated public MEDICAL campaigns, filterable by priority, ar/en, with verified/pending stats |
| GET `/campaigns/staff/all` | ADMIN, CASE_OFFICER, FINANCE_VERIFIER, STAFF, COLLECTOR | All campaigns, for staff use |
| GET `/campaigns/:slug` | public | Public detail, no personal data, last 20 updates |
| GET `/campaigns/:id/transparency` | public | Target / verified (plus demo amounts) / pending / disbursed, and the disbursement list per hospital |
| POST `/campaigns` | ADMIN | Creates an ongoing campaign with no case (e.g. oncology) |
| PATCH `/campaigns/:id/status` | ADMIN, CASE_OFFICER | Changes status / `acceptsPledges` (audited) |
| POST `/campaigns/:id/updates` | STAFF, CASE_OFFICER, ADMIN | Posts a campaign update (ar/en) |

#### cases — `cases/cases.controller.ts`, `cases.service.ts` (363 lines) · **complete**
| Method + path | Roles | What it does |
|---|---|---|
| POST `/cases` (multipart, medical report) | STAFF, ADMIN | Intake. Hashes the national ID with HMAC, finds or creates the beneficiary, silently blocks suspended beneficiaries, warns about duplicates (same national ID / same phone / other programs), sets an SLA due date, stores the document, audits |
| GET `/cases/track?trackingNo&phoneLast4` | public | Beneficiary tracking: stage only, no amounts |
| GET `/cases` | STAFF, CASE_OFFICER, ADMIN | List with status / priority / overdue filters, sorted by SLA (max 200 rows) |
| GET `/cases/:id` | STAFF, CASE_OFFICER, ADMIN | Detail, documents, and the beneficiary's case history (national-ID hash stripped) |
| POST `/cases/:id/review` | CASE_OFFICER | approve (hospital, priority, route, doctor, amount) / reject / needs-info. Re-approval of a published case re-opens pledges |
| PATCH `/cases/:id/hospital-amount` | CASE_OFFICER, ADMIN | Hospital change or amount increase → back to UNDER_REVIEW and pauses pledges. A decrease only updates the target |
| POST `/cases/:id/publish` | CASE_OFFICER | APPROVED + route CROWDFUNDING → creates an ACTIVE campaign with a redacted summary |
| GET `/documents/:id/file` | auth (service limits to document-reader roles) | Streams a private document |

#### pledges — `pledges/pledges.controller.ts`, `pledges.service.ts` (299 lines) · **complete**
| Method + path | Roles | What it does |
|---|---|---|
| POST `/pledges` | DONOR | Platform pledge (status PLEDGED) → returns Bemo transfer instructions (account comes from env) |
| POST `/pledges/demo` | DONOR | Only when `DEMO_MODE=true`: creates an instantly VERIFIED demo pledge (`isDemo`, receipt `DEMO-…`). Not added to `verifiedAmount` |
| POST `/pledges/council` | STAFF, FINANCE_VERIFIER | In-person cash at the council → COLLECTED + PENDING verification |
| POST `/pledges/collector` | COLLECTOR | Collection-point cash, only for points assigned to that collector → COLLECTED + PENDING |
| GET `/pledges/mine` | DONOR | The donor's own pledges |
| GET `/pledges/recorded` | STAFF, COLLECTOR, FINANCE_VERIFIER | Pledges the caller recorded |
| GET `/pledges/:id` | auth (owner / recorder / FINANCE_VERIFIER / ADMIN; others get 404) | Detail + instructions |
| POST `/pledges/:id/receipts` (multipart) | DONOR, STAFF | Uploads the transfer receipt. Rejects a reused image (sha256 dedupe), strips EXIF via sharp → RECEIPT_UPLOADED + PENDING verification |
| POST `/pledges/:id/cancel` | DONOR | Cancels while PLEDGED or REJECTED |
| GET `/receipts/:id/file` | auth (owner / finance) | Streams the uploaded receipt image |
| GET `/official-receipts/:no` | public | Official receipt by number (name hidden if the donor chose anonymous) |

#### verifications — `verifications/verifications.controller.ts`, `.service.ts` · **complete**
| Method + path | Roles | What it does |
|---|---|---|
| GET `/verifications` | FINANCE_VERIFIER | Queue, oldest first |
| POST `/verifications/:id/approve` | FINANCE_VERIFIER | One Serializable transaction: verification APPROVED, pledge VERIFIED, official receipt no. from Postgres sequence `official_receipt_seq` (none for COLLECTOR), campaign `verifiedAmount += amount`, auto **FUNDED** at target, audit, donor notification. Blocks verifying one's own entry |
| POST `/verifications/:id/reject` | FINANCE_VERIFIER | Reason required, pledge REJECTED, donor notified (donor can re-upload) |

#### disbursements — `disbursements/*` · **complete (API only)**
| Method + path | Roles | What it does |
|---|---|---|
| POST `/disbursements` (multipart invoice) | FINANCE_VERIFIER | Pays the approved hospital. Must not exceed verified − disbursed, and the case must not be under review. Stores the invoice Document. At target → campaign **COMPLETED**, `acceptsPledges=false`, case **CLOSED** |
| GET `/campaigns/:id/disbursements` | FINANCE_VERIFIER, ADMIN, CASE_OFFICER | Disbursement history |

#### lookups — `hospitals/lookups.controller.ts` (Prisma used directly in the controller) · **complete (thin)**
| Method + path | Roles | What it does |
|---|---|---|
| GET `/hospitals` | auth | Active hospitals |
| POST `/hospitals` | ADMIN | Adds a hospital |
| GET `/collection-points` | ADMIN, FINANCE_VERIFIER, STAFF | All collection points |
| GET `/collection-points/mine` | COLLECTOR | The caller's points |
| POST `/collection-points` | ADMIN | Adds a point |

#### users — `users/users.controller.ts` (Prisma used directly in the controller, no service) · **complete (thin)**
| GET `/users` · POST `/users` · PATCH `/users/:id` | ADMIN | List users / create staff with any role / change role, `isActive`, collection points (audited) |
|---|---|---|

#### imports — `imports/imports.controller.ts`, `imports.service.ts`, `table-reader.ts` · **complete**
Class-level roles STAFF, ADMIN. A beneficiary import wizard in three steps:
POST `/imports/preview` (xlsx/csv upload → headers, first 20 rows, suggested Arabic-header mapping) →
POST `/imports/:id/validate` (dry run: valid / errors / duplicates; uses zod `beneficiaryImportRowSchema`) →
POST `/imports/:id/commit` (single transaction, duplicates skipped) · GET `/imports/:id/errors.csv`.

#### notifications — `notifications/*` · **partial** (API exists; no UI anywhere consumes it)
GET `/notifications` (own) · POST `/notifications/:id/read` (auth). Written on verify and reject only.

#### audit — `audit/*` · **partial** (writer used everywhere; reader has no UI)
GET `/audit?entityType&entityId` (ADMIN). `AuditService.log()` is called by every mutating service.

#### health — `health.controller.ts` · **bug**
GET `/health` has **no `@Public()`**, so the global `JwtAuthGuard` returns **401** without a token. It is unusable as a liveness probe.

#### storage — `storage/storage.service.ts` · **partial**
Local disk only (`STORAGE_LOCAL_DIR`, default `uploads`). It validates MIME by magic bytes (`file-validation.ts`), re-encodes
JPEG/PNG to strip metadata, and guards against path traversal on read. `STORAGE_DRIVER=minio` only logs
"not implemented yet, using local" (line 30), although `docker-compose.yml` starts MinIO.

### 1.2 Web (`apps/web/src/app`, Next App Router, all under `[locale]` = ar|en via next-intl middleware)

| Route | Who | What it does | Status |
|---|---|---|---|
| `/[locale]` (`page.tsx`) | public | Campaign grid with priority filter and pagination. Public fetch with ISR 30s | complete |
| `/[locale]/campaigns/[slug]` | public | Campaign detail, progress, transparency, updates, WhatsApp share, OG metadata. **No pledge/donate action on web** (donating is mobile-only) | complete |
| `/[locale]/track` | public | Beneficiary tracking form (tracking no. + last 4 phone digits) → stage | complete |
| `/[locale]/receipts/[no]` | public | Official receipt view + print button | complete |
| `/[locale]/login` | public | Phone + password Server Action. Sets `mf_access` / `mf_refresh` HttpOnly cookies, redirects by role (`lib/session.ts` `dashboardHome`) | complete |
| `/[locale]/dashboard` | any logged-in role | Redirects to the role home. DONOR and **COLLECTOR → `/`** (no page for them) | complete (redirect only) |
| `/[locale]/dashboard/finance` | FINANCE_VERIFIER | Verification queue with the receipt image (via the file proxy), approve / reject Server Actions | complete |
| `/[locale]/dashboard/cases` | CASE_OFFICER, STAFF, ADMIN | Case list, overdue filter | complete |
| `/[locale]/dashboard/cases/[id]` | CASE_OFFICER, STAFF, ADMIN (actions: CASE_OFFICER; hospital/amount: also ADMIN) | Case detail, documents, review form, publish form, hospital/amount change form | complete |
| `/[locale]/dashboard/intake` | STAFF, ADMIN | New case form with medical-report upload, then shows duplicate warnings | complete |
| `/[locale]/dashboard/imports` | STAFF, ADMIN | 3-step import wizard (client component calling Server Actions) + errors CSV link | complete |
| `app/api/files/[kind]/[id]/route.ts` | logged-in (cookie) | Proxy for receipts, documents and import-error CSVs; adds the Bearer token | complete |
| `src/middleware.ts` | — | next-intl locale routing + access-token refresh on GET | complete |

**API features with no web UI:** disbursements (POST `/disbursements`), council pledge (POST `/pledges/council`),
collector pledge, user management (`/users`), hospitals and collection points admin, ongoing-campaign creation,
campaign status changes and updates, notifications, audit viewer, and any ADMIN-specific page (ADMIN lands on `/dashboard/cases`).
The verify notification links to `/receipts/{no}` (exists). The reject notification links to `/pledges/{id}` (**no such web route**).

### 1.3 Mobile (`apps/mobile/src/app`, expo-router, donor-only)

| Screen | What it does | Status |
|---|---|---|
| `_layout.tsx` | Stack + header link to Donations or Login; `AuthProvider` | complete |
| `index.tsx` | Public campaign list (`GET /campaigns?lang&pageSize=20`) | complete |
| `campaign/[slug].tsx` | Campaign detail, Donate button → pledge (or login) | complete |
| `login.tsx` | Login / register toggle. **Rejects non-DONOR accounts** (`me.role !== 'DONOR'`) | complete |
| `pledge/[campaignId].tsx` | Amount + anonymous. Real pledge → shows Bemo instructions → "upload now". Demo buttons (`DEMO_PAYMENT_METHODS`) → `POST /pledges/demo` | complete |
| `receipt/[pledgeId].tsx` | Camera or gallery (expo-image-picker), compression (expo-image-manipulator), optional transfer ref → `POST /pledges/:id/receipts` | complete |
| `donations.tsx` | "My donations" (`GET /pledges/mine`): status, rejection reason, link to upload a receipt, "official receipt" button opening the **web** page `${SITE_URL}/${lang}/receipts/{no}` (depends on the web `[locale]` URL prefix, see 02 R6); logout | complete |

Tokens live in `expo-secure-store` (`lib/storage.ts`, `localStorage` on Expo web). `lib/api.ts` auto-refreshes on 401.
API URL comes from `EXPO_PUBLIC_API_URL` / `app.json` `extra.apiUrl` (`localhost`, so a real phone needs the LAN IP).
No collector or staff screens on mobile.

---

## 2. Prisma schema (`apps/api/prisma/schema.prisma`, Prisma 6, PostgreSQL)

**Conventions:** `cuid()` string IDs, PascalCase table names (no `@@map`), money as `Decimal(14,2)`, plus the
`official_receipt_seq` sequence created in the raw SQL of `migrations/20261119000000_init/migration.sql:475`.

**Enums (16):** Role (DONOR, CASE_OFFICER, FINANCE_VERIFIER, STAFF, ADMIN, COLLECTOR) · Locale (ar, en) ·
Currency (SYP, USD) · CampaignType (MEDICAL) · CampaignStatus (DRAFT, ACTIVE, FUNDED, COMPLETED, CLOSED) ·
CaseCategory (SURGERY, MEDICATION, INCUBATOR, ONCOLOGY, TRANSPORT, OTHER) · CaseStatus (SUBMITTED, UNDER_REVIEW,
NEEDS_INFO, APPROVED, REJECTED, PUBLISHED, CLOSED) · CaseRoute (CROWDFUNDING, AGA_KHAN_REFERRAL, MONTHLY_BUDGET) ·
Priority (VERY_URGENT, URGENT, NORMAL) · DocumentKind (MEDICAL_REPORT, ID_DOCUMENT, HOSPITAL_QUOTE, HOSPITAL_INVOICE, OTHER) ·
PledgeChannel (PLATFORM, COUNCIL, COLLECTOR) · PaymentMethod (BEMO_TRANSFER, BANK_TRANSFER, E_WALLET, CASH, plus
simulation-only SHAM_CASH, PAYPAL, VISA) · PledgeStatus (PLEDGED, RECEIPT_UPLOADED, COLLECTED, VERIFIED, REJECTED,
CANCELLED) · VerificationStatus (PENDING, APPROVED, REJECTED) · ImportKind (BENEFICIARIES) · ImportStatus (PREVIEW, COMMITTED, FAILED).

**Models (15):** User, Beneficiary, Hospital, Case, Campaign, Document, CollectionPoint, Pledge, Receipt, Verification,
Disbursement, CampaignUpdate, AuditLog, ImportJob, Notification.

**Key relations:** Beneficiary 1–n Case · Case 1–1 Campaign (`Campaign.caseId @unique`, nullable for ongoing campaigns) ·
Campaign 1–n Pledge / CampaignUpdate / Disbursement · Pledge 1–n Receipt, 1–n Verification · Verification n–1 Receipt (optional) ·
Disbursement 1–1 Document (invoice) · Hospital 1–n Case / Campaign / Disbursement · CollectionPoint m–n User
(implicit `_CollectorPoints`) and 1–n Pledge · User linked to almost everything (donor, recorder, reviewer, uploader, actor).

### Core domain flow and the fields behind it

```
Case ──review──► Campaign ──► Pledge ──► Verification ──► Disbursement
```

| Step | Transition | Fields |
|---|---|---|
| 1. Intake | Case `SUBMITTED` | `trackingNo` (unique, `MF-…`), `beneficiaryId`, `category`, `requestedAmount`, `currency`, `slaDueAt`, `submittedById`, Document `MEDICAL_REPORT`; Beneficiary `nationalIdHash` / `nationalIdLast4`, `isSuspended`, `otherPrograms` |
| 2. Review | → `APPROVED` / `REJECTED` / `NEEDS_INFO` | `priority`, `route`, `hospitalId`, `doctorName`, `approvedAmount`, `rejectionReason`, `reviewedById`, `reviewedAt` |
| 3. Publish | Case → `PUBLISHED`; Campaign `ACTIVE` | Case `isAnonymous`, `redactedSummary`; Campaign `slug`, `caseId`, `titleAr/En`, `summaryAr/En`, `targetAmount` (= `approvedAmount`), `hospitalId`, `acceptsPledges`, `publishedAt` |
| 3b. Change | hospital change / amount increase → Case `UNDER_REVIEW`, Campaign `acceptsPledges=false` | same fields |
| 4. Pledge | `PLEDGED` (platform) or `COLLECTED` (council / collector) | `referenceNo`, `channel`, `method`, `amount`, `donorId` or `donorName/Phone`, `isAnonymousDisplay`, `collectionPointId`, `recordedById`, `isDemo` |
| 5. Receipt | Pledge → `RECEIPT_UPLOADED`; Verification `PENDING` | Receipt `storageKey`, `sha256` (dedupe), `transferRef` |
| 6. Verify | Verification `APPROVED` / `REJECTED`; Pledge `VERIFIED` / `REJECTED` | `reviewerId`, `reason`, `decidedAt`; Pledge `officialReceiptNo`, `verifiedAt`; Campaign `verifiedAmount` += amount, → `FUNDED` at target |
| 7. Disburse | Campaign `disbursedAmount` += amount; at target → Campaign `COMPLETED`, Case `CLOSED` | Disbursement `hospitalId`, `amount`, `invoiceDocumentId`, `paidAt`, `recordedById` |

---

## 3. Seed (`apps/api/prisma/seed.ts`, run with `tsx`)

The seed wipes all tables first and restarts `official_receipt_seq`. Every account uses one password, constant `SEED_PASSWORD`
in `seed.ts:15` (a demo value, not a real credential).

| Data | Content |
|---|---|
| Users (7) | ADMIN `+963900000001`, CASE_OFFICER `…02`, FINANCE_VERIFIER `…03`, STAFF `…04`, COLLECTOR `…05`, DONOR `…06`, plus an English-locale diaspora DONOR `+4915100000007` |
| Hospitals (3) | Salamiyah National Hospital, Al-Hourani Hospital (private; its id is printed for the "15 → 25 million" hospital-change demo), Aga Khan Health Centre |
| Collection points (2) | North and West quarter, both assigned to the collector |
| Cases (5) | `MF-2026-DEMO1…5`. Four PUBLISHED (route CROWDFUNDING) as campaigns: open-heart surgery 15M (VERY_URGENT), incubator 4.5M, chronic medication 2.4M (named, has `otherPrograms`), chemotherapy 8M. One SUBMITTED (pelvis surgery 6M), waiting for review |
| Campaigns (5) | The four case campaigns (medication set to **FUNDED**) + one ongoing "cancer patients' doses & transport", 50M, no case |
| Pledges (8) | 5 VERIFIED with receipt numbers (platform ×2, council ×2, collector ×1 without a receipt no.). 1 RECEIPT_UPLOADED with a generated placeholder receipt image and PENDING verification. 1 collector COLLECTED + PENDING. 1 PLEDGED (donor, no receipt) |
| Other | 1 campaign update on the heart campaign. Generated placeholder images for medical reports and the receipt (written to storage). **No disbursements, no notifications, no import jobs, no audit rows** |

So after seeding, the finance queue has 2 items, the case officer has 1 case to review, and the donor has 1 pledge waiting for a receipt.

---

## 4. Quality

| Check | Finding |
|---|---|
| TODO / FIXME / HACK | **None** in code. The only "XXX" hits are a placeholder `MF-2026-XXXXX` (`web/.../track/page.tsx:41`) and phone-format comments (`packages/shared/src/utils.ts:13,15`) |
| `any` | **None** (`no-explicit-any` set to `error` in mobile `eslint.config.js`) |
| Lint suppressions | One justified `eslint-disable-next-line @next/next/no-img-element` (`web/.../dashboard/finance/page.tsx:48`) |
| `console.log` in app code | None (only the seed prints) |
| Stubs | MinIO storage driver not implemented (`storage.service.ts:30`) |
| Dead / unused code | **10 of 11 zod schemas** in `packages/shared/src/schemas.ts` are unused (only `beneficiaryImportRowSchema` is used, in `imports.service.ts`). Their inferred `*Input` types are also unused, as are the enum arrays `LOCALES`, `CAMPAIGN_TYPES`, `DOCUMENT_KINDS`, `PLEDGE_CHANNELS`, `PLEDGE_STATUSES`, `PAYMENT_METHODS`, `IMPORT_KINDS`, `IMPORT_STATUSES`, `ALLOWED_UPLOAD_MIME`, and the type `CampaignUpdateView`. API `OptionalUser` decorator (`common/decorators/current-user.decorator.ts`) is never used. Expo template leftovers in `apps/mobile/assets/images` (`react-logo*.png`, `tutorial-web.png`, `expo-logo.png`, `expo-badge*.png`, `logo-glow.png`) are unreferenced by `src/` |
| Endpoints without a client | See §1.2. About 15 API endpoints have no UI caller |
| Bugs spotted | `/health` requires auth (§1.1). The reject notification links to the non-existent web route `/pledges/{id}`. `transparency.verifiedAmount` adds demo amounts on top of the real verified total (`campaigns.service.ts` `transparency`) while pledges/demo is documented as "not in the real numbers". This is intentional for display but inconsistent with `Campaign.verifiedAmount` |
| `.env` files | Present on disk: `apps/api/.env`, `apps/web/.env.local`. **Not a git repository** (no `.git`; the root `.gitignore` lists `.env` and `.env.local`), so nothing is committed. Every value in `apps/api/.env` is **identical to `.env.example`**: dev placeholders such as `dev-access-secret-change-me` and a demo Bemo account `0000-000000-000`. **No real secrets found.** `apps/web/.env.local` holds only two `NEXT_PUBLIC_*` URLs. `docker-compose.yml` hard-codes dev DB/MinIO passwords (dev-only) |
| Tests | One file: `apps/api/test/core.test.ts` (68 lines, `node --test` + tsx). It covers: shared enums equal Prisma enums (15 enums), CampaignType is MEDICAL-only, `normalizePhone`, `parseCsv` (quotes, CRLF, `;`), `suggestMapping` (Arabic headers), `hashNationalId`. **No tests** for auth, roles, cases, pledges, verifications, disbursements or storage. **No web or mobile tests.** Not executed for this report |
| Inline-controller pattern | `users.controller.ts`, `lookups.controller.ts` and `imports.controller.ts` define DTOs inline, and the first two query Prisma directly from the controller (no service) |

---

## 5. Demo readiness verdict (from code, not execution)

**Works UI → DB today (all code present on both sides):**
1. **Public browsing:** web home → campaign detail (transparency, updates, share) and mobile list → detail.
2. **Beneficiary tracking:** web `/track` → `GET /cases/track`.
3. **Case lifecycle:** STAFF web intake (with upload and duplicate warnings) → CASE_OFFICER web review (approve / reject /
   needs-info) → publish → the campaign appears publicly. Hospital/amount change → pledges paused → re-approve → reopened.
4. **Donor platform pledge:** mobile register/login → pledge → Bemo instructions → receipt photo upload → **FINANCE_VERIFIER
   web queue** (receipt image shown) → approve → campaign total increases (FUNDED at target) → official receipt number →
   public web `/receipts/[no]`. Reject → donor sees the reason in mobile "My donations" and can re-upload.
5. **Demo instant payment:** mobile demo methods → VERIFIED demo pledge (when `DEMO_MODE=true`).
6. **Beneficiary import:** STAFF web wizard preview → validate → commit → errors CSV.

**Breaks midway (API exists, no UI):**
- **Disbursement to hospital** (last step of the core flow): there is no screen, so a campaign can never reach
  COMPLETED / CLOSED from the UI. The transparency "disbursed" figure stays 0 (the seed has no disbursements either).
- **Council cash pledge** (STAFF / FINANCE_VERIFIER) and **collector cash pledge** (COLLECTOR): no screen on web or mobile.
  COLLECTOR logging into web is redirected to `/`, and mobile login rejects non-donors. The verification of these pledges
  works (seeded examples are in the queue).
- **Admin tasks:** create staff users, hospitals, collection points, ongoing campaigns, campaign status and updates.
  API only, reachable through Swagger. ADMIN on web lands on the cases list.
- **Notifications** are written but never shown. **Audit log** is written but has no viewer.
- **Health probe** returns 401.

**Run prerequisites to watch:** Postgres from `docker-compose.yml`; `prisma migrate deploy` (it must create
`official_receipt_seq`); seed; mobile on a real phone needs `EXPO_PUBLIC_API_URL` set to the machine's LAN IP and the
API's `CORS_ORIGINS` (native calls are unaffected).
