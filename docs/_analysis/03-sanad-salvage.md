# 03 — Sanad Salvage Analysis

> Read-only. Scope: `sanad-crowdfunding/` (our first, rejected proposal), compared with the Salamiyah monorepo
> `منصة التمويل الجماعي في السلمية/` ("Salamiyah"). Builds on 01 (b4f rules), 02 (versions: Tailwind 3.4.19, npm,
> Nest 10, Prisma 5) and 02b (Salamiyah inventory and UI gaps).
> Goal: list what to **move** into the final project, not revive Sanad.
> **Naming rule applied:** role `COLLECTOR`, place `CollectionPoint` with a `type` field. UI labels:
> «مسؤول نقطة جمع» / «نقطة الجمع», "Collector" / "Collection Point".

---

## 1. What Sanad contains (quick overview)

Sanad is a general "GoFundMe for Syria" platform: user-created campaigns for small projects and humanitarian causes, with
user identity verification (KYC), proof-based donations, and a 2-role model (USER, ADMIN). The web layer (≈ 8,200 lines)
is a mature, accessible Arabic-first design system.

| Layer | Content | Paths |
|---|---|---|
| Stack | Nest 11.2.9, Prisma 6.19.3, bcrypt 6, Jest 30; Next 15.5.29, React 19.1.0, **Tailwind 3.4.19**, RTK 2.14, `server-only`. npm, two lockfiles, a git repo | `api/package.json`, `web/package.json` |
| API modules (9) | auth, campaigns (owner CRUD, images, submit/close, admin approve/reject/suspend/reinstate/close/featured), categories (fees), donations (proof-based, admin confirm/reject, private receipt), payment-methods (public list + admin CRUD), reports (abuse reports), stats (transparency, public, admin), verification (user ID document KYC), users | `api/src/*` |
| API common | `JwtAuthGuard` (verifyAsync), `RoleGuard` (live DB role lookup), `@RequireRole`, `@CurrentUser`, `AllExceptionsFilter`, `upload.ts` (multer disk storage, public/private split, `RemoveUploadOnError`) | `api/src/common/*` |
| Schema | Int autoincrement ids, money in **cents**, snake_case `@map`. Models: User, Category, Campaign, CampaignImage, CampaignUpdate (GENERAL / SPENDING + `amountSpentCents`), PaymentMethod (table), Donation, Report. Enums: Role, VerificationStatus, CampaignStatus, CampaignUpdateType, PaymentMethodKind (LOCAL_WALLET / INTERNATIONAL / CRYPTO), DonationStatus, ReportReason, ReportStatus | `api/prisma/schema.prisma` |
| Web routes (~25) | Public: home, `campaigns/[slug]` (+ live polling, OG image), `transparency`, login, register. User: `dashboard`, `my/campaigns/*`, `verification`, `donate/[slug]`. Admin: overview, campaigns (+ detail), donations, verifications, reports, categories, payment-methods. Route handlers: `lang` (cookie switch), `pwa-icons`, receipt and ID-document proxies | `web/src/app/*` |
| Web infrastructure | `lib/api.ts` (server-only `apiFetch`), `lib/session.ts` (server-only HttpOnly cookie), `lib/actions/*` Server Actions, Redux `currentUser` slice, `ThemeContext`, cookie-based i18n (`lib/i18n/*`, TS dictionaries), PWA (`public/sw.js`, `public/offline.html`, `app/manifest.ts`, `pwa-icons`, `apple-icon.tsx`), `next/font` (IBM Plex Sans Arabic + Noto Kufi Arabic) | `web/src/lib`, `web/src/context`, `web/public` |
| Seed | Six non-medical campaign SVG illustrations (beekeeping, food baskets, school bags, sewing, solar lights, heating) | `api/prisma/seed-assets/*.svg`, `api/uploads/public/seed-*.svg` |

**Architectural fit:** Sanad's web layer already follows the b4f pattern closely: server-only `apiFetch` with a token
argument, a server-only `lib/session` (`requireSessionToken`), Server Actions in `lib/actions/`, Redux only for
`currentUser`, and Tailwind 3 with `darkMode: "class"`. Salamiyah's web does not (02 §5.4). Components copied from Sanad
therefore need little architectural rework.

---

## 2. Salvage candidates

Decision legend: **move** = copy and adapt (rename, rebrand, switch types to Salamiyah's schema); **merge** = take the idea or
part of the code into an existing Salamiyah piece; **ignore** = do not take.

### 2.1 Fills the UI gaps listed in 02b §5

| Item | Path in Sanad | Counterpart in Salamiyah | Which is better and why | Decision |
|---|---|---|---|---|
| **Web donate flow** | `web/src/components/donations/DonationForm.tsx` (317 lines, 3 steps: method → amount → proof, camera `capture="environment"` + gallery input, copy-to-clipboard of the account, success panel), `web/src/app/(app)/donate/[slug]/page.tsx` (+ `loading` / `error` / `not-found`), `lib/actions/donations.ts` | **None on web.** Mobile only (`apps/mobile/src/app/pledge/[campaignId].tsx`, `receipt/[pledgeId].tsx`). Salamiyah's API flow is two-phase: `POST /pledges` → instructions → `POST /pledges/:id/receipts` | Sanad's UI is better (step layout, accessible fieldsets, camera capture, copy button). Salamiyah's **API flow is better**: it creates the pledge first, then the receipt, with sha256 dedupe and EXIF stripping | **move UI, merge flow**: keep the step UI. Step 1 shows the method and Bemo instructions **after** `POST /pledges`, step 3 uploads to `/pledges/:id/receipts`. Drop tip, cents and USD (Salamiyah uses `Decimal`, SYP/USD per campaign). Add the demo-method buttons (`/pledges/demo`) as on mobile |
| **Admin overview / dashboard** | `web/src/app/(app)/admin/page.tsx` (StatCards + pending-queue links), `components/layout/Sidebar.tsx` (role nav with **count badges** for pending queues), `api/src/stats/stats.service.ts` `adminStats` (aggregate queries, "no stored counters to drift") | `dashboard/layout.tsx`: plain tab bar, no counts, no overview. ADMIN lands on `/dashboard/cases` | Sanad. A real overview with queue counts is what the jury sees first | **move**: Sidebar with role-filtered links and badges (pending verifications, cases to review, overdue SLA). Overview page with StatCards fed by a new `GET /stats/admin` written against Salamiyah's schema |
| **Admin CRUD screens** (users, hospitals, collection points) | Pattern: `components/payment-methods/PaymentMethodForm.tsx` + `PaymentMethodRow.tsx` (create form + inline-editable row with active toggle), `components/categories/CategoryForm.tsx` + `CategoryRow.tsx`, pages `admin/payment-methods`, `admin/categories` | **None.** API exists: `/users`, `/hospitals`, `/collection-points` (02b §1.1) | Sanad. It has the exact "list + create form + inline row edit + isActive toggle" shape these three screens need. Sanad has no users-admin page | **move pattern**: clone Form/Row into `HospitalForm/Row`, `CollectionPointForm/Row` (with the new `type` select, §5) and `UserForm/Row` (role select, collection-point multi-select, isActive) |
| **Admin campaigns screen** | `admin/campaigns/page.tsx` (Tabs by status), `admin/campaigns/[id]/page.tsx`, `components/campaigns/AdminCampaignActions.tsx` (approve / reject-with-reason / suspend / reinstate / close / featured), `CampaignStatusBadge.tsx` | **None** for campaign status, updates or ongoing campaigns. API exists: `PATCH /campaigns/:id/status`, `POST /campaigns/:id/updates`, `POST /campaigns`, `GET /campaigns/staff/all` | Sanad (UI). Salamiyah's statuses differ (DRAFT / ACTIVE / FUNDED / COMPLETED / CLOSED + `acceptsPledges`) | **merge**: reuse the list-with-status-tabs and action-panel layout, wired to Salamiyah's status and acceptsPledges endpoints. Drop approve/reject/featured (Salamiyah approves at the **case** level) |
| **Disbursement UI** | Closest: `components/campaigns/CampaignUpdateForm.tsx` (type SPENDING + `amountSpentCents`), `UpdatesTimeline.tsx`. File-input styling from `VerificationUploadForm.tsx` | **None.** API `POST /disbursements` (multipart invoice) and `GET /campaigns/:id/disbursements` exist | Neither has it. Sanad's form + file-input + timeline pieces cut the build time | **merge**: build `DisbursementForm` (amount ≤ available, paidAt, note, invoice file) from those parts, plus a disbursement timeline on the campaign / case page |
| **Collector UI** | None | None (02b) | — | **ignore** (nothing to salvage). Build new from the shared `ui/` components: «مسؤول نقطة جمع» records cash for his own «نقطة الجمع» |
| **Notifications display** | None (no notification feature in Sanad) | API only (`GET /notifications`, `POST /:id/read`) | — | **ignore**. Build a bell/list (b4f has `NotificationBell` as the pattern, 01 §3) |
| **Finance review list** | `admin/donations/page.tsx` (status Tabs, receipt link via proxy, `DonationReviewActions.tsx` confirm / reject-with-reason) | `dashboard/finance/page.tsx` (queue with receipt image, approve/reject) | Salamiyah's **logic** is better (separation of duties, Serializable transaction, official receipt numbers, notifications). Sanad's **UI** is better (status tabs: pending / confirmed / rejected; reject reason dialog) | **merge**: restyle the Salamiyah finance page with Sanad's Tabs + review-action component. Logic stays Salamiyah |
| **Public transparency dashboard** | `web/src/app/transparency/page.tsx` (143 lines: platform totals, spent %, per-method breakdown) + `api/src/stats/stats.service.ts` `transparency()` (aggregate + groupBy) | Per-campaign only (`GET /campaigns/:id/transparency`, section on the campaign page). **No platform-wide page** | Sanad for the platform view. Salamiyah's per-campaign data is richer (verified / pending / disbursed per hospital) | **move**: `/transparency` page + a new `GET /stats/transparency` (verified total, disbursed total and %, by channel PLATFORM/COUNCIL/COLLECTOR, by hospital), excluding `isDemo` |

### 2.2 Payment methods and verification

| Item | Path in Sanad | Counterpart in Salamiyah | Which is better and why | Decision |
|---|---|---|---|---|
| Payment methods as data | `PaymentMethod` model (`code`, `name`, `kind`, `accountIdentifier`, `instructions`, `isActive`, `sortOrder`), `payment-methods` module (public `GET /payment-methods`, admin CRUD), admin page | `PaymentMethod` **enum** (BEMO_TRANSFER, BANK_TRANSFER, E_WALLET, CASH, + simulated SHAM_CASH, PAYPAL, VISA). Instructions hard-coded in `pledges.service.ts` `instructions()` (Bemo only, account from env) | Sanad. Account details and instructions become admin-editable, and each method (ShamCash / PayPal / Visa simulation, Bemo real) gets its own instructions and an on/off switch without redeploying | **merge**: keep the enum (pledges reference it; enum-sync test), add a small `PaymentMethodConfig` table keyed by the enum (`method @unique`, `displayNameAr/En`, `accountIdentifier`, `instructionsAr/En`, `isActive`, `isSimulated`, `sortOrder`). `instructions()` reads it. Copy the admin Form/Row UI |
| Donation verification | `donations.service.ts` confirm/reject + `transactionRef` partial unique per method | `verifications.service.ts` | **Salamiyah**: separation of duties, Serializable isolation, receipt sequence, campaign totals, notifications, sha256 receipt dedupe | **merge (one idea)**: add Sanad's **unique transfer reference per method** check (`transferRef` + method) next to the sha256 dedupe |
| User identity verification (KYC) | `verification` module, `VerificationUploadForm`, admin queue, ID-document proxy | None. Cases are entered by STAFF; beneficiaries are not users | Not applicable to Salamiyah's model | **ignore** |
| Abuse reports | `reports` module, `ReportForm`, admin queue | None | Out of the PoC scope (cases are vetted by the Case Officer before publishing) | **ignore** |

### 2.3 Uploads, PWA, middleware, theme, seed assets, misc

| Item | Path in Sanad | Counterpart in Salamiyah | Which is better and why | Decision |
|---|---|---|---|---|
| Upload handling | `api/src/common/upload.ts` (multer disk storage straight to disk, public/private dirs, 5 MB, MIME by header, `RemoveUploadOnError`) | `storage/storage.service.ts` + `file-validation.ts` (memory buffer, **magic-byte** MIME check, **EXIF strip** via sharp, sha256, path-traversal guard) | **Salamiyah**: it validates content instead of the client-declared MIME, removes geolocation metadata from receipts and IDs, and nothing hits disk before validation | **ignore** (keep Salamiyah) |
| Public static uploads | `useStaticAssets(uploads/public)` + CampaignImage / ImageManager / CampaignCover | None. Medical campaigns are anonymous and have no photos | Medical privacy argues against photos of beneficiaries | **ignore** (ongoing campaigns can use a generic illustration, see HeroArt) |
| **PWA** | `web/public/sw.js` (23 lines, offline fallback only, network-first, never caches data), `web/public/offline.html` (self-contained, light/dark), `web/src/app/manifest.ts`, `app/pwa-icons/[name]/route.tsx`, `app/apple-icon.tsx`, `app/icon.svg`, `components/layout/ServiceWorkerRegister.tsx` (prod + secure context only) | **None** on web | Sanad. It is small, safe (no stale donation figures) and makes the web installable for donors without the app | **move** (rebrand name, colours and icon; Arabic text stays) |
| Middleware | `web/src/middleware.ts` (only forwards the path in a header for "Arabic-only" pages) | `src/middleware.ts` (next-intl routing + token refresh) | b4f has **no middleware** (01 rule 13). Sanad's is optional | **ignore** |
| **Language switch without middleware** | `web/src/app/lang/route.ts` (POST form → `lang` HttpOnly cookie → 303 back, open-redirect-safe), `lib/i18n/server.ts` (`getI18n()` from the cookie, `dir` rtl/ltr, `apiCodeMessage()` maps API error codes), `components/layout/LanguageSwitch.tsx` | next-intl with `[locale]` URL routing via middleware (02 risk **R6**) | **Sanad**: it is exactly the "i18n without locale routing" that 02 R6 requires, already built and with no extra library | **move**: replace next-intl routing with this. Convert `apps/web/messages/ar.json` / `en.json` into the TS dictionary shape (or keep next-intl in no-routing mode fed by the same cookie). Also update the mobile receipt link (02b §1.3) to drop the `/{lang}` prefix |
| **Tailwind theme** | `web/tailwind.config.ts` (brand + give scales, semantic CSS-variable tokens `page/surface/border/track/control/ink/muted/accent/danger/warning/info`, Arabic-tuned font sizes, shadows, motion), `web/src/app/globals.css` (light "paper" + dark tokens with WCAG-AA ratios, focus ring, skeleton, reduced-motion) | Tailwind 4 `@theme` with 11 tokens, **no dark mode** (0 `dark:` uses) | Sanad by a wide margin, and it is already Tailwind 3 (see §4) | **move** (base theme of the final web) |
| **UI primitives** | `components/ui/`: Button (`buttonClasses`, variants incl. `give` for donate), Field (label/hint/error with aria), Badge, Card, StatCard, ProgressBar (accessible, RTL origin), Tabs (URL-based), EmptyState, ErrorState, ThemeToggle, Logo | `components/action-form.tsx`, `campaign-ui.tsx`, `print-button.tsx`, `site-header.tsx` (no primitives) | Sanad | **move**, keeping b4f naming where 01 defines it (`FormParts`, `States`, `Modal`, `ConfirmDialog` from b4f; Button/Field/Badge/StatCard/ProgressBar/Tabs from Sanad) |
| Theme context | `web/src/context/ThemeContext.tsx` (90 lines, cross-fade on switch, system preference) | None | Sanad is richer than b4f's (01 §3.7), same contract | **merge** into the b4f-shaped `ThemeContext` (keep `useTheme()`) |
| Fonts | `app/layout.tsx` `next/font/google` IBM Plex Sans Arabic + Noto Kufi Arabic | System font stack | Sanad (Arabic typography) | **move**. Note: `next/font/google` downloads at **build** time, so build once with internet before an offline demo |
| Live campaign refresh | `app/campaigns/[slug]/live/route.ts` (same-origin JSON) + `components/campaigns/LiveCampaign.tsx` (polls every ~5 s while visible, milestone confetti) | Static page (ISR 30 s on the list) | Sanad. A verified donation updating live on screen is a strong demo moment | **move (optional)**, adapted to `verifiedAmount` / `pendingAmount`. It is a Route Handler (a documented deviation, like the file proxy) |
| OG image + share | `app/campaigns/[slug]/opengraph-image.tsx` (188 lines), `components/campaigns/ShareButtons.tsx` (WhatsApp + copy link) | `generateMetadata` + WhatsApp link only | Sanad | **move** (anonymised title / summary only, no beneficiary data) |
| Home hero | `components/home/HeroArt.tsx` (inline SVG, theme-aware) | Plain list header | Sanad | **move** (optional, rebrand) |
| `apiFetch` / session / Redux | `lib/api.ts`, `lib/session.ts`, `store/*` | `lib/api.ts`, `auth-cookies.ts` (02 §5.4) | Both are superseded by **b4f's** versions (01 §3), which the rules require | **ignore** (take from b4f; Sanad confirms the same shape) |
| Exception filter | `common/filters/all-exceptions.filter.ts` | None | b4f's `AllExceptionsFilter` is the mandated one | **ignore** (use b4f's) |
| RoleGuard with live DB lookup | `common/guards/role.guard.ts` | Global `RolesGuard` trusting the token | b4f pattern: role checks in services + `JwtStrategy.validate()` reloading the user (02 §5.2) | **ignore** (the idea of "never trust the role in the token" is already in 02 §5.1) |
| Categories with fees / platform tips | `categories` module, `feeBps`, `tipCents` | `CaseCategory` enum, no fees | Fees and tips are out of scope for a medical-aid council platform | **ignore** |
| `format.ts` (cents → USD) | `web/src/lib/format.ts` | `formatMoney` in shared (Decimal string, SYP/USD) | Salamiyah (matches its money model) | **ignore** |
| Seed assets | `api/prisma/seed-assets/*.svg` (6 files) | Generated placeholder images in `seed.ts` | All six are **non-medical** (beekeeping, food baskets, school bags, sewing, solar lights, heating) | **ignore** |

---

## 3. What must NOT be moved

| Item | Why |
|---|---|
| `sanad-crowdfunding/api/.env` | `JWT_SECRET` and `DATABASE_URL` **differ** from `.env.example` (checked by comparing keys and values, values not printed). `JWT_SECRET` is a 107-character value, likely a real random secret. Not tracked by git (`git ls-files` shows no `.env`), so it exists only on disk |
| `sanad-crowdfunding/web/.env` | Only `API_URL` (same as example), but env files are never copied |
| `api/uploads/**` | Runtime upload folder. `public/` holds seed-copied SVGs; `private/` is empty (would hold ID documents and receipts) |
| Seed SVGs and campaign data | Non-medical projects (outside the medical scope) |
| Modules outside scope | User KYC verification, abuse reports, categories with fees, platform tips, user-created campaigns (owner `my/campaigns/*`, `ImageManager`, `CampaignForm`), featured campaigns |
| Build / install output | `node_modules/`, `.next/`, `dist/`, `*.tsbuildinfo`, `package-lock.json` (the final lockfiles come from b4f versions, 02) |
| Sanad's `CLAUDE.md`, `DEMO.md`, `README.md` | Describe a different product and stack (Nest 11, Prisma 6, Jest 30). They conflict with the b4f rules |
| Schema conventions | Int autoincrement ids, cents as Int. They conflict with Salamiyah's money model and the uuid decision (02 §5.6) |
| Sanad branding | Name «سَنَد», wordmark, manifest name, OG text: rebrand everything that is moved |

---

## 4. Tailwind: take Sanad's theme, or convert Salamiyah's?

**Evidence**
- Sanad is already Tailwind **3.4.19** (`web/package-lock.json`), the exact b4f version. Its `tailwind.config.ts` +
  `globals.css` use only v3 features (`@tailwind` directives, `theme.extend`, `<alpha-value>` CSS vars, `darkMode: "class"`).
- Salamiyah's theme is small: `globals.css` = 25 lines, an `@theme` with 11 tokens, **no dark mode** (0 `dark:` classes).
- Class usage in Salamiyah `apps/web/src/**/*.tsx` (grep counts):

  | Salamiyah class family | Uses | Exists in Sanad config? |
  |---|---|---|
  | `brand-50/100/500/600/700` | 45 | ✔ same names (`brand` scale 50–950). The hue changes: green `#1f8a5b` → teal `#2f9386` |
  | `text/bg-muted` | 58 | ✔ `muted` |
  | `text-ink` | 2 | ✔ `ink` |
  | `border-line` / `bg-line` | 44 | ✘. Sanad's name is `border` (and the DEFAULT border colour), so this is one search-replace |
  | `urgent` / `pending` | 6 | ✘ → `danger` / `warning` |
  | raw palette (`red/amber/green/…`, `gray/…`) | 26 | works, but should move to semantic tokens to get dark mode |

  About **105 of ~181** token uses work unchanged with Sanad's config, and ~50 more are one mechanical rename.

| Option | Work | Estimate | Result |
|---|---|---|---|
| **A. Convert Salamiyah's Tailwind 4 → 3 as it is** | Write `tailwind.config.ts` with the 11 tokens, `@tailwind` directives, `postcss.config.js`; check v4/v3 default differences (bare `border` colour, `shadow-sm` scale); visual QA. Then still add the b4f component classes and primitives and a dark theme (02 W5) | 2–4 h (02 W6) + 2–4 h (W5) = **4–8 h** | Same plain look, still no dark mode or primitives unless more work is added |
| **B. Adopt Sanad's theme + `components/ui`, restyle Salamiyah pages** | Copy config + globals and rebrand colours (1–2 h); port ~12 primitives (~470 lines) and decouple their Arabic default labels and i18n hook (2–3 h); rename `line`→`border`, `urgent/pending`→`danger/warning`, raw colours → tokens (1–2 h); refactor the ~15 Salamiyah pages and components onto `Button`/`Field`/`Badge`/`StatCard`/`ProgressBar`/`Tabs` (4–6 h); QA light + dark + RTL (2 h) | **10–15 h** (replaces 02 W6 + most of W5) | Accessible tokens (WCAG-AA measured), dark mode, Arabic font sizing, one component set reused by **all the new screens in §2.1** (donate, admin CRUD, disbursement, collector, transparency) |

**Opinion:** take **Option B**. The net extra over A is about 6–7 hours. In return, every missing screen from 02b is built
on finished primitives instead of raw utilities, so those new screens go faster, and the jury-facing UI gains dark mode and
a consistent, accessible look. Option A converts a theme that would then have to be extended anyway. Keep Salamiyah's
green brand hue if the team wants continuity: replace the `brand` scale values in `tailwind.config.ts` and the matching
`--ring` / `--accent*` RGB triplets in `globals.css`. That is a 30-minute change and does not affect the estimate.

---

## 5. CollectionPoint `type` field: required schema change

**Current state** (`apps/api/prisma/schema.prisma:274-284`):
```prisma
model CollectionPoint {
  id        String   @id @default(cuid())
  name      String   // comment refers to a mosque / point
  mukhiName String?
  area      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  collectors User[]   @relation("CollectorPoints")
  pledges    Pledge[]
}
```
**There is no `type` field.** The model also carries a field named after a religious role (`mukhiName`), which violates the
naming decision.

**Required change** (applied together with the Prisma 5 migration regeneration and the uuid/`@@map` switch, 02 §5.6):
```prisma
enum CollectionPointType { MOSQUE  CENTER  OFFICE  SHOP  OTHER }

model CollectionPoint {
  id          String              @id @default(uuid()) @db.Uuid
  name        String
  type        CollectionPointType @default(OTHER)
  contactName String?             // replaces mukhiName
  area        String
  isActive    Boolean             @default(true)
  createdAt   DateTime            @default(now())
  collectors  User[]              @relation("CollectorPoints")
  pledges     Pledge[]
  @@map("collection_points")
}
```
A mosque is just one `type` value. No role, screen or entity is named after it.

**Every place that must follow the rename** (grep of the code):

| File | Line(s) | Change |
|---|---|---|
| `apps/api/prisma/schema.prisma` | 276–277 | Add `type`, rename `mukhiName` → `contactName`, fix the comment |
| `apps/api/src/hospitals/lookups.controller.ts` | 36–39 | `CreateCollectionPointDto`: `contactName` + `@IsEnum(CollectionPointType) type` |
| `apps/api/src/verifications/verifications.service.ts` | 31 | select `contactName`, `type` |
| `apps/web/src/app/[locale]/dashboard/finance/page.tsx` | 20 | Type and label: show «نقطة الجمع» + type |
| `apps/api/prisma/seed.ts` | 91–96 | Seed points with `type` (e.g. one CENTER, one MOSQUE) and a neutral `contactName`; rewrite the comment |
| copied shared enums (api/web/mobile, 02 §5.5) | — | Add `CollectionPointType` to every copy and to the enum-sync test |
| UI labels | — | «مسؤول نقطة جمع» / «نقطة الجمع», "Collector" / "Collection Point", plus per-type labels |

Effort: about 1 hour on top of the planned migration regeneration (no data migration needed; the dev DB is reseeded).
