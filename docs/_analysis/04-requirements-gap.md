# 04 — Requirements Gap Analysis

> Read-only. Ground truth for "what exists" = 02b §5 (demo readiness), re-checked in code where marked.
> Plan for UI gaps = 03 §2. Architecture and versions = 01 and 02.
> **Naming:** wherever a source names the person or place that collects cash, this report uses **COLLECTOR**
> («مسؤول نقطة جمع») and **CollectionPoint** («نقطة الجمع», `CollectionPointType` MOSQUE / CENTER / OFFICE / SHOP / OTHER).

**Sources, in priority order**

| Code | Document | Role |
|---|---|---|
| **[PoC]** | `مقترح مشروع منصة التمويل الجماعي الطبي ونموذج الهاكاثون (PoC).pdf`: §2 (5-step journey), §3 (5 MVP modules), §5 | **Primary** (approved for the hackathon) |
| **[SPEC]** | `الوثيقة الشاملة لهندسة المنظومة والتحول الرقمي … (1).pdf`: §1–§6 | Long-term vision, mostly Future |
| **[IDEA]** | `docs/input/idea.jpg`: «أتمتة التبرعات للمجلس المحلي في سلمية» | Transparency dashboard |
| **[BRIEF]** | `docs/input/brief_en.pdf` / `brief_ar.pdf` (team scoping brief) | Secondary |
| **[MEET]** | `docs/analysis/meeting_summary.md` (from `meeting.ogg`) | Secondary |
| **[TEAM]** | Salamiyah `CLAUDE.md` (team decisions) | Not a council source; listed because it conflicts with [PoC] |

**Legend.** Priority: **Must** = needed for the PoC demo, **Should** = strongly expected by [PoC], **Could** = nice to have,
**Future** = [SPEC] / Future Scope. Effort: **S** ≤ ½ day · **M** ½–1½ days · **L** > 1½ days (one developer, on top of the
02 alignment work). "Fill from": **Salamiyah** = keep or extend existing code, **sanad** = per 03 decisions, **new** = build.

---

## 1. Coverage matrix

### 1.1 Public storefront and donation ([PoC] §2.1, §2.3, §3.1, §3.2)

| # | Requirement | Source | Exists? (where) | What's missing | Fill from | Priority | Effort |
|---|---|---|---|---|---|---|---|
| R1 | Public campaigns page: individual case cards (surgery, medication, incubators) **and** admin-created ongoing campaigns (e.g. cancer patients' transport and doses) | [PoC] §3.1 | ✔ api `GET /campaigns`, web `/[locale]`, mobile `index.tsx`. Ongoing campaign seeded | Restyle only | Salamiyah + sanad theme (03 §4) | Must | S |
| R2 | Card content: documented **file number** (patient dignity), approved hospital, urgency, amount | [PoC] §2.1 | ✔ `fileNo` = case `trackingNo`, `priority`, `targetAmount`, hospital (api `campaigns.service.ts` `getPublic`) | — | Salamiyah | Must | — |
| R3 | Card shows **the approved medical report image** | [PoC] §2.1 | ✘ by design: documents are private (`documents/:id/file` staff-only) | See conflict **C4** | — | Should (pending C4) | S–M |
| R4 | **Filter by priority** | [PoC] §3.1 | ✔ api `?priority=`, web home filter chips. ✘ mobile has no filter | Mobile filter chips | Salamiyah | Must | S |
| R5 | **Live progress bar** | [PoC] §3.1, §2.4 ("rises instantly") | ◐ Bar exists (web, mobile). The web detail page uses ISR `revalidate: 30`; mobile updates only on screen load | Live refresh (polling route) and a "pending/received" segment (see C2) | sanad `LiveCampaign.tsx` + `live/route.ts` (03 §2.3) | Must | M |
| R6 | **Unique ID for each case** | [PoC] §3.2, [SPEC] §2 | ✔ Case `trackingNo` `MF-YYYY-XXXXX` (`common/utils/codes.ts:13`). Beneficiary record with national-ID HMAC (`nationalIdHash`) | — | Salamiyah | Must | — |
| R7 | **Unique ID for each donor** (record of contributions and receipts) | [PoC] §3.2, [SPEC] §2 | ◐ Registered donors have an internal `User.id` (cuid, never shown); pledges have `referenceNo` `P-XXXXXX`. Council/collector donors have no donor identity | A human-readable donor code (e.g. `D-XXXXXX`) shown in mobile "My donations" and on receipts. Optionally link council pledges to a donor by phone | new (small schema field + display) | Should | S |
| R8 | **"Donate now"**: amount, show name or donate as «فاعل خير» (anonymous) | [PoC] §2.3, §3.2 | ✔ mobile `pledge/[campaignId].tsx` (anonymous switch → `isAnonymousDisplay`). ✘ **web has no donate flow** (02b) | Web donate flow | sanad `DonationForm` (UI) + Salamiyah two-phase API (03 §2.1) | Must | M |
| R9 | **Simulated instant e-payment**: ShamCash, PayPal, Visa | [PoC] §2.3, §3.2, §5 | ✔ api `POST /pledges/demo` (only with `DEMO_MODE=true`, instant VERIFIED, `isDemo`); `DEMO_PAYMENT_METHODS` (BEMO, SHAM_CASH, PAYPAL, VISA…); mobile demo buttons. ✘ web | Web buttons (part of R8). A per-method **simulated checkout screen** (fake card / wallet form) makes the demo convincing. See C1 | Salamiyah + sanad UI; `PaymentMethodConfig` (03 §2.2) | Must | S (+S for checkout screens) |
| R10 | **Cash option: choose the nearest collection point** to hand over cash | [PoC] §2.3, §3.2 | ✘ Donors cannot pick a collection point. Today only COLLECTOR / STAFF record cash (`POST /pledges/collector`, `/pledges/council`). The schema already has `Pledge.collectionPointId` | New donor channel: pledge `method=CASH`, `channel=COLLECTOR`, `collectionPointId` chosen by the donor (list by `area` and `type`), status PLEDGED → awaiting the collector. Public `GET /collection-points` (active only). Web + mobile picker | new | Must | M |

### 1.2 Collector, receipts and messaging ([PoC] §2.2, §2.4, §3.3, §3.4; [SPEC] §5)

| # | Requirement | Source | Exists? (where) | What's missing | Fill from | Priority | Effort |
|---|---|---|---|---|---|---|---|
| R11 | **Collector mobile interface**: review pending donations **in his area**, **confirm cash received with one tap** | [PoC] §3.3, §2.4; [SPEC] §5 | ◐ api: `GET /collection-points/mine`, `POST /pledges/collector` (collector *records* a new cash amount), `GET /pledges/recorded`. ✘ No "pending pledges at my points" endpoint, no confirm endpoint, **no UI at all** (web redirects COLLECTOR to `/`; mobile login rejects non-donors) | `GET /collector/pledges?status=PLEDGED` (only the collector's points), `POST /pledges/:id/collect` (→ COLLECTED + Verification PENDING), the existing "record box amount" form, and a history list. UI per §6 | new | Must | L |
| R12 | Collector confirmation makes the **campaign progress rise immediately** | [PoC] §2.4 | ✘ The progress bar moves only on finance approval (`verifications.service.ts` `approve`). Collector cash stays COLLECTED until then | See **C2** (pending segment vs instant verify) | new | Must (pending C2) | S |
| R13 | Collector records the **monthly box collection** for the collection point | [PoC] §3.3; [SPEC] §5 | ◐ `POST /pledges/collector` can record an anonymous total **for a campaign**. No monthly-budget concept | See **C3** | Salamiyah (+ ongoing "monthly budget" campaign) | Should / Future (pending C3) | S |
| R14 | **Alerts to registered donors** («الخيرين») by WhatsApp, sent from the platform **when an urgent case is published**, with a campaign link | [PoC] §2.2, §3.4; [SPEC] §6 | ✘ Nothing. No opt-in field, no message model, no send action. `notifications.service.ts:5` states "no push and no WhatsApp API in the MVP" | Donor opt-in (`User.whatsappOptIn`), an `OutboundMessage` outbox, an "alert donors" action on publish (auto for VERY_URGENT/URGENT), and an outbox screen. Mechanism per §5 | new | Must | M |
| R15 | **Instant digital WhatsApp receipt** to the donor on payment confirmation | [PoC] §2.4, §3.4 | ◐ Official receipt number `R-YYYY-NNNNNN` from a Postgres sequence (`verifications.service.ts:81`), public page `/[locale]/receipts/[no]` with a manual "send via WhatsApp" `wa.me` link, and an in-app notification on verify. **Collector channel gets no receipt number** (`verifications.service.ts` skips COLLECTOR). Nothing is sent automatically | Auto-create an outbox message (with the receipt link) on verify, and on collector confirm (acknowledgement, see C2). Issue receipts for donor-chosen collector pledges | new (outbox from R14) | Must | S (after R14) |
| R16 | Receipt with **serial number + QR verification code** | [SPEC] §5 | ◐ Serial ✔ (`officialReceiptNo`, `common/utils/codes.ts:23`), public verification page ✔. ✘ **No QR** (no QR library or code anywhere) | QR on the receipt page and in the shared image, encoding the public receipt URL. Needs a QR generator: a new dependency (not in b4f, so it must be listed as an addition, see 02 R12) or a small server-side SVG encoder | new | Should | S |

### 1.3 Admin and oversight ([PoC] §2.1, §2.5, §3.5; [SPEC] §3–§4)

| # | Requirement | Source | Exists? (where) | What's missing | Fill from | Priority | Effort |
|---|---|---|---|---|---|---|---|
| R17 | Publish an approved case as a campaign (after vetting by the revival committee and doctor) | [PoC] §2.1 | ✔ api `POST /cases/:id/publish` (CASE_OFFICER), web case-detail publish form | [PoC] says the **platform manager** publishes. See C5 | Salamiyah | Must | S |
| R18 | **Create and manage campaigns**, including ongoing ones | [PoC] §3.5 | ◐ api `POST /campaigns` (ADMIN, ongoing), `PATCH /campaigns/:id/status`, `POST /campaigns/:id/updates`, `GET /campaigns/staff/all`. ✘ **No UI** | Admin campaigns list + detail + "new ongoing campaign" form + status / pause-pledges + post update | sanad admin-campaigns layout (03 §2.1) | Must | M |
| R19 | **Severity rating** by vetters (very urgent / urgent / normal) | [PoC] §3.5; [SPEC] §3.2 | ✔ `Priority` enum set in `POST /cases/:id/review`, web review form, priority badges | — | Salamiyah | Must | — |
| R20 | **SLA delay alerts** for requests left without review | [PoC] §3.5; [SPEC] §3.3 | ◐ `Case.slaDueAt` (7 days, `SLA_DAYS`), `isOverdue`, web "overdue" filter and count (`dashboard/cases/page.tsx`). ✘ No alert is *sent*: nothing notifies supervisors | A check (on dashboard load or a Nest interval) that writes Notifications to CASE_OFFICER/ADMIN for newly overdue cases, plus a red badge in the sidebar (03 Sidebar counts) | new | Should | S |
| R21 | **Lock the approved hospital** (and doctor + amount) for disbursement | [PoC] §3.5, §2.5; [SPEC] §4 | ✔ Review sets `hospitalId`, `doctorName`, `approvedAmount`; a hospital change or amount increase → UNDER_REVIEW + pledges paused (`cases.service.ts` `changeHospitalOrAmount`); disbursement is forced to `campaign.hospitalId` | — (web form exists) | Salamiyah | Must | — |
| R22 | **Violations log** + **administrative suspension** (invisible, blocks new requests) + **reactivation** by senior management | [PoC] §3.5; [SPEC] §4 | ◐ `Beneficiary.isSuspended` + `suspensionNote` exist, and intake silently refuses suspended beneficiaries (`cases.service.ts:37`). ✘ No endpoint or UI to suspend, reactivate or log a violation. No violation-log entity (only the generic `AuditLog`) | `BeneficiaryNote` model (kind VIOLATION/NOTE, text, author, caseId?) or an AuditLog action convention. `POST /beneficiaries/:id/suspend` and `/reactivate` (ADMIN, reason required, audited). A beneficiary page with history + notes + suspend toggle (no public badge) | new | Must | M |
| R23 | **Direct disbursement to the hospital** + campaign status **«تم الإنجاز»** | [PoC] §2.5; [SPEC] §4 | ◐ api complete: `POST /disbursements` (invoice, ≤ verified balance, approved hospital only) → COMPLETED + case CLOSED. ✘ **No UI** (02b) | Disbursement form + disbursement timeline. Display COMPLETED as «تم الإنجاز». Show it on public transparency | sanad parts (03 §2.1) | Must | M |
| R24 | **Admin screens: users** (staff with any role, isActive, collector ↔ collection points) | [PoC] §3.5 (implied); [SPEC] §6 | ◐ api `/users` GET/POST/PATCH (ADMIN). ✘ No UI | Users list + create + inline edit | sanad Form/Row pattern | Must | M |
| R25 | **Admin screens: hospitals** | [SPEC] §4 | ◐ api `GET/POST /hospitals`. ✘ No update endpoint, no UI | `PATCH /hospitals/:id` (name, isActive) + UI | sanad Form/Row | Must | S |
| R26 | **Admin screens: collection points** (with `type`) | [PoC] §3.3; [SPEC] §5 | ◐ api `GET/POST /collection-points`. ✘ No update, no UI, no `type` field (03 §5) | Schema change (03 §5), `PATCH`, UI with type select and collector assignment | sanad Form/Row + new | Must | S–M |
| R27 | **Notifications display** | [PoC] §2.4 (donor told of receipt); [IDEA] | ◐ api `GET /notifications`, `POST /:id/read`; written on verify/reject. ✘ No UI (web or mobile) | Bell + list on web (b4f `NotificationBell` pattern) and a mobile list. Notification links must point to existing routes (bug B2) | new (b4f pattern) | Should | S–M |
| R28 | **Audit log display** | [SPEC] §3 (A-to-Z documentation); [MEET] p.9 | ◐ api `GET /audit?entityType&entityId` (ADMIN); every mutation is logged. ✘ No UI | "History" panel on the case and campaign detail pages (ADMIN), reading `/audit` | new | Should | S |
| R29 | **Transparency dashboard**: total collected, total disbursed, beneficiaries **without identities** | [IDEA]; [BRIEF] §2 | ◐ Per-campaign `GET /campaigns/:id/transparency` + section on the campaign page. ✘ No platform-wide page | `GET /stats/transparency` (verified total, disbursed total and %, by channel, by hospital, # cases helped; **demo excluded**) + public `/transparency` page | sanad transparency page (03 §2.1) + new query | Must | M |
| R30 | Admin dashboard (overview + queue counts) | [PoC] §3.5 ("لوحة تحكم الإدارة والرقابة") | ✘ ADMIN lands on the case list | Overview with StatCards + Sidebar badges (pending verifications, cases to review, overdue, collector pending) | sanad admin overview + Sidebar (03) | Should | M |

### 1.4 Case pipeline from [SPEC] (context, mostly existing)

| # | Requirement | Source | Exists? | Missing | Fill from | Priority | Effort |
|---|---|---|---|---|---|---|---|
| R31 | Intake at the local council with a tracking number | [SPEC] §3.1 | ✔ web `/dashboard/intake`, api `POST /cases` | — | Salamiyah | Must | — |
| R32 | Beneficiary tracks their request | [MEET] p.9 | ✔ web `/track` | — | Salamiyah | Should | — |
| R33 | Duplicate detection (national ID, other programs) | [SPEC] §2 | ✔ intake warnings | — | Salamiyah | Should | — |
| R34 | Excel import of historical data | [SPEC] §2 | ✔ web import wizard | — | Salamiyah | Could | — |
| R35 | Joint approval (head of the revival committee + local council representative) | [SPEC] §3.4 | ✘ single CASE_OFFICER review | Second approver step | new | Future (see C5) | M |
| R36 | Routing to Aga Khan referral / monthly budget | [SPEC] §3.4 | ◐ `CaseRoute` set at review; only CROWDFUNDING can publish | Transfer workflows | — | Future | — |
| R37 | Monthly reconciliation statement across all collection points | [SPEC] §5 | ✘ | Report by point and month | new | Future | M |

**Must items still missing or partial:** R5, R8, R9 (web), R10, R11, R12, R14, R15, R18, R22, R23, R24, R25, R26, R29.
Rough total ≈ **12–17 developer-days** on top of the 02 alignment (45–85 h).

---

## 2. Extras in code: out of scope or complicating the demo

| Item | Where | Why it matters | Decision |
|---|---|---|---|
| Refresh-token flow (`/auth/refresh`, cookie refresh in middleware, mobile auto-refresh) | api `auth/*`, web `middleware.ts`, mobile `lib/api.ts` | Conflicts with b4f (02 §5.1) | **delete** (in the 02 alignment) |
| next-intl locale routing (`[locale]` + middleware) | web | Conflicts with b4f "no middleware" (02 R6) | **delete** → sanad cookie switch (03) |
| MinIO service + `STORAGE_DRIVER=minio` stub | `docker-compose.yml`, `storage.service.ts:30` | Starts a container that is never used; misleading | **delete** MinIO from compose and env (keep local storage) |
| 10 unused zod schemas, unused enum arrays, `OptionalUser`, Expo template images | `packages/shared/src/schemas.ts`, api decorators, `apps/mobile/assets/images/*` | Dead code (02b §4) | **delete** while copying shared code |
| Beneficiary Excel import wizard | web `/dashboard/imports`, api `imports/*` | [SPEC] item, not [PoC]. Works; adds menu noise | **keep**, but show it in the STAFF menu only (not in the judge walkthrough unless time allows) |
| Council in-person pledge (`POST /pledges/council`) | api only | [SPEC]/[TEAM], not [PoC]. No UI | **keep** API. **Hide** (no UI needed for the PoC) |
| `CaseRoute` AGA_KHAN_REFERRAL / MONTHLY_BUDGET | schema, review form | [SPEC] Future workflows | **keep** (data only). Review form can keep the select |
| Donor `cancel` pledge | api, mobile | Harmless | **keep** |
| Pledge `Currency` USD | schema | [BRIEF] mentions USD anchoring | **keep** |
| `docs/input/meeting.ogg`, `scripts/transcribe.py`, `scripts/__pycache__/` | repo root | Not part of the product; `__pycache__` is build output | **delete** `__pycache__`; keep docs and script out of the app folders |
| Demo amounts merged into public totals | `campaigns.service.ts` `transparency()` | Confuses "real vs demo" (bug B3) | **keep** feature, fix display |

---

## 3. Known bugs (from 02b) and fixes

| # | Bug | Evidence | Fix |
|---|---|---|---|
| B1 | `GET /health` returns **401** without a token | `health.controller.ts` has no `@Public()`; global `JwtAuthGuard` in `app.module.ts` | In the aligned API (class-level guards, 02 §5.1) `HealthController` simply has **no guard**, so it becomes public with no extra code. Before alignment: add `@Public()` |
| B2 | Rejection notification links to **`/pledges/{id}`**, which exists on neither web nor mobile | `verifications.service.ts` `reject()` → `link: /pledges/${id}` | The donor re-uploads on **mobile** `receipt/[pledgeId].tsx`. Store `link: /receipt/{pledgeId}` (a mobile route) and resolve links per client. If the web donate flow (R8) adds a "my pledges" page, point web links there. Add a test that every notification `link` matches a known route pattern |
| B3 | Public transparency total includes **demo** payments | `campaign-stats.service.ts:44-46` adds `isDemo` VERIFIED sums when `DEMO_MODE=true`; `campaigns.service.ts` `transparency()` adds `stats.demo` to `verifiedAmount` | Return `demoAmount` as a **separate field** and never add it to `verifiedAmount`. UI shows «منها X محاكاة (Demo)» with a Demo badge. Exclude demo from the platform-wide `/stats/transparency` (R29). For the live bar (R5), draw demo as its own striped segment |

---

## 4. Conflicts between sources

Each conflict is reported with two options. The recommendation is the analyst's view; the **decision belongs to the team
and the council**.

**C1. Payment model: simulated instant e-payment vs Pledge & Verify**
- [PoC] §2.3, §3.2, §5: the donor pays through **simulated instant e-payment (ShamCash, PayPal, Visa)** or cash. It is a
  headline feature of the live demo.
- [TEAM] `CLAUDE.md` "قرارات الفريق": simulation is **demo-only** ("المجلس لا يريدها"); the real path is Pledge & Verify
  (pledge → receipt upload → manual verification). [MEET] p.2–3: Bemo bank is the channel that works; about 80% have no
  wallet; "the platform does not hold money". [BRIEF] §2: progress updates only after finance verification.
- **Option A:** The PoC journey uses simulation as the primary path (instant VERIFIED, receipt issued). Pledge & Verify is shown second.
- **Option B:** Pledge & Verify (Bemo transfer + receipt) is the primary path. Simulation is shown as a clearly labelled «وضع العرض» feature.
- **Recommendation:** B, with simulation **visible on every donate screen** (ShamCash / PayPal / Visa buttons with a fake
  checkout and a Demo badge), so [PoC] is fully demonstrated while totals stay honest (B3). Ask the council to confirm the
  quote in `CLAUDE.md`, because the [PoC] they approved does not contain it.

**C2. Cash confirmation: collector confirms → progress rises instantly vs finance verifies first**
- [PoC] §2.4: the collector taps "confirm received", the campaign bar **rises immediately**, and the donor gets an
  **official** WhatsApp receipt. [SPEC] §5: the receipt is issued "as soon as the collector confirms", with a serial number and QR.
- [TEAM]: the collector **cannot** verify or raise the balance; status "received at collection point" → cash handed to the
  council → FINANCE_VERIFIER verifies → balance updated. Box collections get **no individual receipt**. [BRIEF] §2:
  "progress bars update only upon finance verification". Code follows [TEAM] (`pledges.service.ts` `createCollector`,
  `verifications.service.ts`).
- **Option A:** The collector's confirmation counts as verification for cash (instant VERIFIED + official receipt). Faster and literal to [PoC], but no separation of duties.
- **Option B:** The collector's confirmation sets COLLECTED. The bar shows a **second, lighter "received, pending
  verification" segment immediately**, and the donor instantly gets a WhatsApp **acknowledgement** (pledge reference, no
  official number). The official numbered receipt + QR follows on finance approval.
- **Recommendation:** B. It satisfies "rises instantly" and "instant WhatsApp message" visibly in the demo, and keeps the
  [BRIEF]/[TEAM] control that [SPEC] §4 itself motivates (preventing procedural abuse).

**C3. Monthly box collection**
- [PoC] §3.3 lists "recording the monthly collection of the collection point's box" inside the PoC collector module.
  [SPEC] §5 adds a monthly reconciliation statement.
- [TEAM]: "monthly collection = Future Scope"; in the hackathon the collector only receives cash for medical campaigns.
- **Option A:** Minimal in PoC: the collector records the box total as an anonymous pledge to an admin-created ongoing campaign («الصندوق الشهري»). Uses existing `POST /pledges/collector`, no new model.
- **Option B:** Keep it Future; the PoC demo shows only cash for medical campaigns.
- **Recommendation:** A (about S effort; it reuses existing code). Monthly reconciliation stays Future (R37).

**C4. Medical report image on the public card vs beneficiary privacy**
- [PoC] §2.1: the public card shows the **approved medical report image**.
- [BRIEF] §2 "Anonymized Case Mode"; [TEAM]/code: documents are private, the public sees only `redactedSummary`, and the
  case is anonymous by default.
- **Option A:** On publish, the Case Officer uploads a separately **redacted** report image (new `DocumentKind` `PUBLIC_REPORT`), shown on the card.
- **Option B:** No image. The card shows a "verified by the revival committee, hospital X" badge and the file number.
- **Recommendation:** A, optional per case and off by default. It meets [PoC] without exposing the private original.

**C5. Who publishes and approves**
- [PoC] §2.1: the **platform manager** publishes after vetting. [SPEC] §3.4: **joint approval** by the head of the revival
  committee and the local council's representative. Code: only CASE_OFFICER reviews and publishes.
- **Option A:** Allow both ADMIN and CASE_OFFICER to publish; keep a single review.
- **Option B:** Add a second approval step before publishing.
- **Recommendation:** A for the PoC; joint approval is Future (R35).

**C6. WhatsApp: automated sending vs share links only**
- [PoC] §2.2, §3.4 and [SPEC] §5: **automated** WhatsApp alerts and receipts sent **from the platform**.
- [TEAM] Deliverables: "WhatsApp **sharing**"; code: `wa.me` share links only, and `notifications.service.ts:5` says "no WhatsApp API in the MVP".
- Options and recommendation: §5.

**C7. Scope: medical only vs wider causes**
- [IDEA]: orphan sponsorship, house renovation, medical aid; [BRIEF] §1/§5: also education, scholarships and infrastructure.
- [PoC] (medical, including ongoing programmes) and [TEAM] ("medical only, binding").
- **Option A:** Medical only; the others are Future.
- **Option B:** Add a generic campaign category now.
- **Recommendation:** A. `CampaignType` already allows adding values later.

**C8. Collector app: dedicated mobile dashboard vs optional participation**
- [PoC] §3.3: a dedicated mobile dashboard for every collector. [SPEC] §6: 40–70+ collectors.
- [TEAM]: collectors are **offered** the role, never obliged; the council can assign a staff member or volunteer instead; the UI wording should express "clearance of responsibility" («براءة ذمة»).
- Not a hard conflict: both hold if the COLLECTOR role can be given to anyone. **Recommendation:** build the dashboard ([PoC]) with [TEAM]'s wording rules.

**C9. Currency anchoring**
- [BRIEF] §5.3: anchor targets in USD and show SYP conversions. Code: SYP default, USD per campaign, no conversion.
- **Option A:** Keep per-campaign currency, no conversion.
- **Option B:** Add an admin-set exchange rate and dual display.
- **Recommendation:** A for the PoC (the brief lists it as an open decision).

---

## 5. WhatsApp without a paid API in Syria

| Option | How it works | Cost / access | Automation | Demo value | Risks |
|---|---|---|---|---|---|
| **1. Generated `wa.me` links** | Platform builds `https://wa.me/<phone>?text=<message>` per recipient (already in `packages/shared/src/utils.ts:51`). Staff tap → WhatsApp opens with the text → they press send from the council's own number | Free; works wherever WhatsApp works; no Meta account | **Manual** (one tap + send per recipient) | Real WhatsApp message on a real phone | Does not scale to hundreds of donors without effort; depends on staff acting |
| **2. Simulated internal outbox** | Every alert or receipt is written to an `OutboundMessage` table (`to`, `body`, `kind`, `status` QUEUED → SENT_SIMULATED, `relatedId`) and shown in an admin "Outbox" screen and the donor's in-app notifications | Free, offline-safe | "Automatic" inside the system, but nothing leaves it | Shows the **automation logic** ([PoC] "fully automated") instantly | Must be labelled as simulation to stay honest |
| **3. WhatsApp Cloud API (Meta)** | Business account + verified phone number + **pre-approved message templates** for business-initiated messages; webhook for status | Per-conversation fees; requires a Meta business account and a payment method. Meta's services are **likely unavailable to a Syria-based organisation** (sanctions / restricted-country terms), to be verified, not assumed | Fully automatic | Real automation | Account approval and template review take days; it cannot be counted on within a hackathon; cloud dependency |
| (Unofficial gateways, e.g. WhatsApp-Web automation libraries) | Automate a personal WhatsApp session | Free | Automatic | — | Violates WhatsApp's terms; the council's number could be banned. **Not recommended** |

**Recommendation: 2 + 1 combined.** Write every alert and receipt to the **outbox** immediately: urgent case published →
one message per opted-in donor; payment confirmed → receipt message with the receipt link + QR. Then give each outbox row a
**"send via WhatsApp" button** that opens the prefilled `wa.me/<phone>` link, plus a "send all" mode that steps through the
list. The demo shows instant, automatic generation (the [PoC] promise) and a real message arriving on a phone, with no API
account. Put the sending behind a small `MessageChannel` interface (`simulated` | `wa_link`; later `cloud_api`), so option 3
can be plugged in if the council ever gets access. This resolves C6 by letting the council see both behaviours.

---

## 6. Mobile scope: where the collector interface lives

| | Same Expo app, role-based screens after login | Mobile web (responsive pages in the Next app, installable via the PWA from 03) |
|---|---|---|
| Fit to [PoC] §3.3 "a dashboard for the mobile phone" | ✔ | ✔ |
| Distribution to 40–70+ collectors | Needs an APK/IPA install (sideloading or an Expo build) on every phone. Some collectors are older and reluctant ([TEAM] C8) | A link; "Add to home screen" via the PWA; works on any phone with a browser |
| Reuse | Mobile already has login, SecureStore, the API client, i18n and 3 small UI components. Collector screens need new RN components | Reuses the web stack being built anyway: Server Actions (b4f-binding pattern, 01), sanad components (03), admin data loaders |
| Architecture risk | No b4f reference for mobile; more custom code | Follows the binding b4f web pattern |
| Effort for R11 | L (new screens, role gate change in `login.tsx`, new API calls) | M (2–3 pages + 2 Server Actions) |
| Demo | Collector and donor on the same app on two phones | Collector on a phone browser (installed PWA icon), donor on the Expo app; this also shows **both** deliverables |

**Recommendation: mobile web (PWA) for the collector; keep the Expo app donor-focused.**
1. Zero-install distribution matches how collectors would really adopt it.
2. It sits on the binding b4f web architecture and the 03 component set, so it is cheaper and lower-risk.
3. The demo still runs on a phone.

Two small mobile changes stay worthwhile: the login screen should show a friendly message to staff roles ("use the
web/dashboard") instead of a bare rejection, and the donor app gets the collection-point picker (R10).

---

## 7. Demo scenario for the judges (7 steps, web + mobile)

| Step | Who / device | What the judges see | Exists today? | Missing to make it work |
|---|---|---|---|---|
| 1 | STAFF, web | Registers a new urgent case (newborn incubator) with the medical report. Gets tracking no. `MF-2026-XXXXX` and a duplicate warning (same national ID seen in another programme) | ✔ | Restyle only |
| 2 | CASE_OFFICER, web | Rates severity **very urgent**, locks hospital + doctor + approved amount, publishes. The campaign appears publicly. The **outbox** fills with WhatsApp alerts to opted-in donors; one is tapped and arrives on a phone | ◐ review/publish ✔ | R14 outbox + alert, opt-in seed data, `wa.me` send button |
| 3 | DONOR A, Expo app | Opens the campaign from the WhatsApp link, donates as «فاعل خير» via **ShamCash simulation**. On the projector, the web campaign page's **progress bar moves live** | ◐ demo pledge ✔ | R5 live refresh; B3 demo segment labelling; deep link from WhatsApp |
| 4 | DONOR B, phone browser (web) | Chooses **cash at the nearest collection point** (type CENTER) and gets a pledge reference | ✘ | R8 web donate flow, R10 collection-point picker, 03 §5 schema |
| 5 | COLLECTOR, phone (PWA) | Sees DONOR B's pending pledge at his point and taps **confirm received**. The bar shows a "received, pending verification" segment and DONOR B gets an acknowledgement message | ✘ | R11 collector UI + endpoints, R12/C2 pending segment, R15 acknowledgement |
| 6 | FINANCE_VERIFIER, web | Approves the cash and a Bemo receipt uploaded earlier (seeded). Official receipt `R-2026-000…` with **QR**; the receipt message lands in the outbox. Campaign reaches target → FUNDED | ◐ verification ✔ | R16 QR, R15 auto receipt message |
| 7 | FINANCE_VERIFIER, web → public | Disburses directly to the **locked hospital** with an invoice → campaign «**تم الإنجاز**». The public **transparency dashboard** shows collected vs disbursed, with no beneficiary identities | ◐ API ✔ | R23 disbursement UI, R29 transparency page |

Optional 30-second extra (exists today): the Case Officer changes the hospital (national → private, 15M → 25M). The case
goes back to review and **donations pause automatically**, which shows [SPEC] §4 protection live.

**To make the full scenario work:** R5, R8, R10, R11, R12, R14, R15, R16, R23, R29, plus the 03 §5 schema change and the
B3 fix. Admin screens (R18, R22, R24–R26) are not in the walkthrough but are needed to **set it up** (collector user,
collection point, opt-in donors), unless the seed covers them. Seed additions needed: opted-in donors with phone numbers,
one collection point of each demo type, the collector assigned to it, and one seeded Bemo pledge with an uploaded receipt
(already present: `P-SEEDRCPT`).
