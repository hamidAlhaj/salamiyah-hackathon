# 06 — Scope change: build exactly the official hackathon idea

> Written 2026-11-22, after P04. **Binding.** This report, the updated `CLAUDE.md` and the rewritten
> `05-execution-plan.md` §7 override earlier analysis wherever they disagree (in particular 04 decision **C7**
> "medical only" and the §2 tier tables of 05).

**Why:** the hackathon judges require the official approved idea (Team 4). The council's "medical only" decision applies
to their separate future product, not to the hackathon build. Everything already built (P01–P04) stays: architecture,
pinned versions, auth contract, roles, the medical case pipeline (it becomes the `MEDICAL_AID` campaign type), and the
planned collector flow, WhatsApp outbox, QR receipts, web + mobile.

**State at the time of writing:** P01–P04 merged on `main` (`92f96fb`). **P05 not started** (no branch, no stash, clean tree).

---

## 1. The official idea

**Arabic (original, Team 4, approved):**
> أتمتة التبرعات للمجلس المحلي في سلمية
> منصة ويب مبسطة مخصصة للمجلس المحلي في مدينة سلمية لإدارة وتوثيق حملات التبرع المحلية بشكل شفاف. تتيح المنصة للمجلس
> إنشاء حملات (مثل: كفالة أيتام، ترميم منازل، مساعدات طبية) مع تحديد المبلغ المستهدف، بينما يمكن للمتبرعين تصفح الحملات
> والمساهمة مالياً (عبر الحوالات أو المحافظ المحلية) وتلقي إشعارات فورية بتأكيد استلام تبرعهم. الأهم أن المنصة توفر لوحة
> شفافية تظهر إجمالي التبرعات المجمعة، والمبالغ التي تم صرفها، والمستفيدين (بدون كشف هوياتهم)، مما يعزز الثقة بين المجتمع
> والمجلس المحلي.

**English:**
> Donation Automation for the Local Council in Salamiyah. A simplified web platform dedicated to the Local Council of
> Salamiyah to manage and document local donation campaigns transparently. The platform lets the council create campaigns
> (e.g. orphan sponsorship, home renovation, medical aid) with a target amount, while donors can browse campaigns,
> contribute financially (via money transfers or local e-wallets), and receive instant notifications confirming receipt of
> their donation. Most importantly, the platform provides a transparency dashboard showing the total donations collected,
> the amounts spent, and the beneficiaries (without revealing their identities), strengthening trust between the community
> and the local council.

---

## 2. Requirements derived from the idea

Status: **✔ built** (in P01–P04, at least in the API) · **◐ needs change** · **✘ new**. "Prompt" = where it is delivered in
the rewritten 05 §7.

### Sentence 1 — "simplified web platform … manage and document local donation campaigns transparently"
| ID | Requirement | Status | Notes | Prompt |
|---|---|---|---|---|
| H1 | A web platform for the Local Council of Salamiyah (Arabic RTL first, English second) | ✔ | Next.js skeleton, theme, cookie i18n, login (P04) | — |
| H2 | Council staff manage campaigns of several kinds (not only medical cases) | ◐ | API has campaigns but `CampaignType` = `MEDICAL` only; no create UI | P05, P06, P08 |
| H3 | Every money and campaign action is documented (who, what, when) | ✔ / ◐ | `AuditService.log` on mutations (API). History panel is Tier 3 | P19 |
| H4 | Simple to use: few screens per role, one dashboard per role | ◐ | Placeholder dashboards per role (P04) | P08 |

### Sentence 2 — "create campaigns (orphan sponsorship, home renovation, medical aid) with a target amount"
| ID | Requirement | Status | Notes | Prompt |
|---|---|---|---|---|
| H5 | Campaign types `ORPHAN_SPONSORSHIP`, `HOME_RENOVATION`, `MEDICAL_AID`, enum kept extensible | ◐ | Rename `MEDICAL` → `MEDICAL_AID`, add two values (shared copies + enum-sync test) | P05 |
| H6 | ADMIN creates a campaign of any type directly: title, anonymised summary, target amount, currency, cover illustration, area | ✘ | Today only "ongoing campaign" (`POST /campaigns`, ADMIN) without type/cover | P06, P08 |
| H7 | CASE_OFFICER creates/publishes `MEDICAL_AID` campaigns; the intake → review → publish pipeline produces them | ✔ / ◐ | Pipeline exists in the API; must set `type = MEDICAL_AID`; web screens are not ported yet | P06, P08 |
| H8 | Each campaign links to anonymised beneficiaries (public code `B-XXXX`, kind, area at most) | ✘ | `Beneficiary` exists (with private identity fields); public code + link table are new | P05, P06 |
| H9 | Each campaign has a "campaign account": ledger (collected/verified, pending, demo separately, spent, remaining) and receiving details shown to donors | ✘ | Stored `verifiedAmount`/`disbursedAmount`; stats service computes pending/demo; receiving details were env vars (fake) | P05, P06 |

### Sentence 3 — "donors browse campaigns, contribute via transfers or local e-wallets, receive instant notifications"
| ID | Requirement | Status | Notes | Prompt |
|---|---|---|---|---|
| H10 | Public browsing of all campaign types (web + mobile): list with type filter, detail with ledger, cover, beneficiaries count | ◐ | API list/detail exist (medical shape); web public pages not ported; mobile not aligned | P07, P09 |
| H11 | Pay by **local transfer** (Bemo/bank) with the campaign's receiving details → receipt upload → finance verification | ✔ / ◐ | Pledge & Verify API exists; account details must come from `PaymentMethodConfig` (+ campaign override) | P06, P10 |
| H12 | Pay by **local e-wallet** (ShamCash, Syriatel Cash, MTN Cash — fake accounts) and PayPal / Visa as **simulated** instant payment, always «Demo» badge, kept separate from verified totals | ◐ | Demo pledge API exists for SHAM_CASH/PAYPAL/VISA; add Syriatel/MTN; a real-looking checkout screen is new | P05, P10 |
| H13 | Cash at a collection point → COLLECTOR confirms → finance verifies | ◐ | API for collector-recorded cash exists; donor-chosen point + collector UI are new | P10, P12 |
| H14 | **Instant notification confirming receipt** for every donation path: in-app notification + WhatsApp outbox message; official receipt with QR after verification | ◐ | `Notification` model + list API exist; `OutboundMessage`, triggers on every path and QR are new | P11, P13 |
| H15 | Donor history: "my donations" with status per pledge and receipts | ✔ / ◐ | `GET /pledges/mine` exists; web + mobile screens | P09, P10 |

### Sentence 4 — "transparency dashboard: total donations collected, amounts spent, beneficiaries (no identities)"
| ID | Requirement | Status | Notes | Prompt |
|---|---|---|---|---|
| H16 | Public transparency dashboard (headline feature): platform totals collected / spent / remaining, demo shown **separately** | ✘ | Only a per-campaign medical endpoint exists | P15 |
| H17 | Breakdown by campaign type | ✘ | | P15 |
| H18 | Per-campaign ledger with a spending timeline and downloadable proof (invoice/photo, no personal data) | ✘ | | P14, P15 |
| H19 | Beneficiaries count and codes, never names, phones, national IDs or private documents | ✘ | Rule already in CLAUDE.md for medical cases; extended to all types | P05, P15 |
| H20 | Spending is recorded as an **expenditure** per campaign: payee type (HOSPITAL, CONTRACTOR, SUPPLIER, BENEFICIARY_FAMILY, OTHER), amount ≤ available balance, date, description, proof upload | ◐ | Replaces hospital-only `Disbursement` | P05, P14 |
| H21 | `MEDICAL_AID` keeps the locked-hospital rule; `ORPHAN_SPONSORSHIP` supports recurring monthly payments to its anonymised beneficiaries | ◐ / ✘ | Locked hospital exists in disbursement service | P14 |

### Sentence 5 — "strengthening trust between the community and the local council"
| ID | Requirement | Status | Notes | Prompt |
|---|---|---|---|---|
| H22 | Verifiable receipts: `R-YYYY-NNNNNN` + QR that opens the public receipt page | ◐ | Receipt number sequence + public receipt API exist; QR new | P13 |
| H23 | A verifier never verifies their own entry; collectors never verify; demo money never reaches real totals | ✔ | API rules + specs (P03) | — |
| H24 | Campaign progress shows verified / received-pending / demo segments live | ✘ | | P10 |

---

## 3. Impact per layer

### 3.1 Prisma schema (one migration in P05; the dev DB is reseeded, no data migration needed)

| Change | Detail |
|---|---|
| `enum CampaignType` | `MEDICAL_AID`, `ORPHAN_SPONSORSHIP`, `HOME_RENOVATION` (was `MEDICAL`). Extensible: future values are appended. Default removed (type is chosen on create). |
| `Campaign` | `disbursedAmount` → **`spentAmount`** (`spent_amount`); new `coverKey String?` (key of a bundled illustration, e.g. `orphans-1`, no photos of people), `area String?`, `beneficiaries CampaignBeneficiary[]`, `paymentAccounts CampaignPaymentAccount[]`, `expenditures Expenditure[]`. `verifiedAmount` stays (real verified money only). `hospitalId` stays, used only by `MEDICAL_AID`. Remaining balance = `verifiedAmount − spentAmount` (computed, never stored). |
| `enum BeneficiaryKind` (new) | `PATIENT`, `ORPHAN`, `FAMILY`, `OTHER`. |
| `Beneficiary` | add `publicCode String @unique` (`B-XXXX`, generated, the only public identifier), `kind BeneficiaryKind`, `area String?` (neighbourhood at most). Identity fields (`fullName`, `phone`, `nationalIdHash`, …) stay private. |
| `CampaignBeneficiary` (new) | `campaignId`, `beneficiaryId`, `monthlyAmount Decimal(14,2)?` (orphan sponsorship), `startedAt`, `endedAt?`; `@@unique([campaignId, beneficiaryId])`. |
| `enum PayeeType` (new) | `HOSPITAL`, `CONTRACTOR`, `SUPPLIER`, `BENEFICIARY_FAMILY`, `OTHER`. |
| `Expenditure` (new, **replaces `Disbursement`**) | `campaignId`, `payeeType`, `payeeLabel` (public-safe text, e.g. «مقاول ترميم»), `hospitalId?` (required and locked for `MEDICAL_AID` + `HOSPITAL`), `beneficiaryId?` (for `BENEFICIARY_FAMILY`; shown by code only), `amount`, `currency`, `description`, `paidAt`, `periodMonth String?` (`YYYY-MM`, monthly sponsorship), `proofDocumentId` (unique), `recordedById`, `createdAt`. Table `expenditures`. |
| `enum DocumentKind` | add `EXPENDITURE_PROOF` (public-safe invoice/photo), keep `HOSPITAL_INVOICE` for existing medical data or fold it into `EXPENDITURE_PROOF` (decided in P05: fold, since the DB is reseeded). |
| `enum PaymentMethod` | `BEMO_TRANSFER`, `BANK_TRANSFER`, `SHAM_CASH`, `SYRIATEL_CASH`, `MTN_CASH`, `PAYPAL`, `VISA`, `CASH` (generic `E_WALLET` removed). |
| `PaymentMethodConfig` (new) | `method` (unique), `kind` (`TRANSFER`/`WALLET`/`CARD`/`CASH`), `labelAr`, `labelEn`, `accountName`, `accountNumber`, `instructionsAr/En`, `allowsReceiptUpload` (Pledge & Verify), `allowsDemoCheckout` (simulated instant payment), `isActive`, `sortOrder`. All account data **fake** for the hackathon. |
| `CampaignPaymentAccount` (new) | per-campaign override of `accountName`/`accountNumber`/note for one `method`; `@@unique([campaignId, method])`. |
| `enum PledgeStatus` | add `DEMO_CONFIRMED` (simulated payment done; never counted as verified). |
| `OutboundMessage` (new, P11) | `userId?`, `phone`, `channel` (`WHATSAPP`), `template`, `body`, `link`, `status` (`QUEUED`/`OPENED`), `relatedType`, `relatedId`, `createdAt`, `openedAt?`. |
| `User` | add `whatsappOptIn Boolean @default(false)`. |
| `Notification` | unchanged model; new `type` values per donation event. |

Shared enum copies (`api/src/common/shared`, `web/src/shared`, `mobile/src/shared`) change together with the schema; the api
enum-sync spec and the web copy test must pass.

### 3.2 API modules

| Module | Change |
|---|---|
| `campaigns` | `POST /campaigns` (ADMIN: any type; CASE_OFFICER: `MEDICAL_AID` only) with type, titles, anonymised summary, target, currency, `coverKey`, area, beneficiary links; `GET /campaigns?type=&status=`; `GET /campaigns/:id/ledger` (collected/verified, pending, demo, spent, remaining, donors count, beneficiaries count); `GET /campaigns/:id/payment-accounts` (config merged with overrides; demo methods flagged). Case publish creates `type = MEDICAL_AID`. |
| `beneficiaries` (new, small) | create/link anonymised beneficiaries (ADMIN, STAFF), generate `B-XXXX`; public list of codes + kind + area per campaign. |
| `payment-config` (new) | `GET /payment-methods` (public, active only); ADMIN CRUD + per-campaign override (Tier 2 UI). |
| `pledges` | methods per `PaymentMethodConfig`; demo checkout for every wallet/card method → `DEMO_CONFIRMED`, `isDemo = true`; transfer → receipt upload; donor CASH with `collectionPointId`. Each path fires the notification service. |
| `notifications` + `outbox` (new) | one `NotificationsService.donationEvent(...)` used by pledges, collector and verifications: in-app `Notification` + `OutboundMessage` with a `wa.me` link (opted-in users and donor phone). |
| `collector` (new or inside pledges) | COLLECTOR-scoped pending cash at my points, confirm received. |
| `verifications` | unchanged rules; on approve: receipt number + receipt notification + outbox message. |
| `expenditures` (replaces `disbursements`) | `POST /campaigns/:id/expenditures` (FINANCE_VERIFIER) with proof upload, amount ≤ remaining, locked hospital for medical; `POST /campaigns/:id/expenditures/monthly` for orphan sponsorship (one row per active `CampaignBeneficiary` with `monthlyAmount`); `GET` timeline (public-safe). |
| `stats` (new) | `GET /stats/transparency`: totals, by type, per campaign, demo separate, beneficiaries count. |
| `cases`, `imports`, `auth`, `users`, `lookups` | unchanged except `MEDICAL_AID` naming. |

### 3.3 Web pages

| Route | Who | Status |
|---|---|---|
| `(public)/` home: hero + campaigns of all types with type tabs + totals strip | public | rewrite placeholder (P07) |
| `(public)/campaigns/[slug]`: cover, summary, ledger + live 3-segment bar, beneficiaries count/codes, spending timeline, "donate" | public | new (P07, P10, P14) |
| `(public)/campaigns/[slug]/donate`: method choice → simulated wallet/card checkout (Demo) · transfer instructions + receipt upload · cash point picker | donor | new (P10) |
| `(public)/transparency`: platform dashboard | public | new (P15) |
| `(public)/receipts/[no]` + QR, `(public)/track` | public | new/ported (P07, P13) |
| `(app)/dashboard` per role | staff/donor | placeholder → real (P08) |
| `(app)/campaigns` list + new campaign form (type, target, cover, beneficiaries) | ADMIN, CASE_OFFICER | new (P08) |
| `(app)/cases/*`, `(app)/intake`, `(app)/imports` | STAFF, CASE_OFFICER | port (P08) |
| `(app)/finance` queue, `(app)/finance/expenditures` | FINANCE_VERIFIER | port + new (P13, P14) |
| `(app)/collector/*` (PWA) | COLLECTOR | new (P12) |
| `(app)/outbox`, notifications bell, `(app)/my-donations` | staff / donor | new (P11) |
| `(app)/admin/*`: users, hospitals, collection points, payment methods + per-campaign accounts, beneficiaries | ADMIN | Tier 2 (P17) |

### 3.4 Mobile screens (Expo, donor only)
Campaign list with type chips (all three types) → campaign detail (cover, ledger bar, beneficiaries count, spending
summary) → donate: simulated wallet/card checkout with «Demo» badge · transfer instructions + receipt upload · cash point
picker → "my donations" with statuses and receipt links → notifications list. Register with WhatsApp opt-in.

### 3.5 Seed (P16, fictional only)
- At least **2 campaigns per type** (6+): e.g. «كفالة 12 يتيماً لعام 2027», «كفالة أيتام حي الشيخ بدر», «ترميم سقف منزل
  أسرة في حي البعث», «ترميم منازل متضررة من الأمطار», two `MEDICAL_AID` from the case pipeline (heart surgery, incubator)
  + the ongoing oncology programme.
- Anonymised beneficiaries with `B-XXXX` codes linked to each campaign (12 orphans with monthly amounts, 3 families, 2
  patients).
- Expenditures with proof images (generated placeholders): contractor payment, supplier invoice (roofing material), hospital
  payment for medical, two months of orphan sponsorship.
- `PaymentMethodConfig` for every method with **fake** account names/numbers; one campaign with an override.
- Pledges on every path and status (pending receipt, collected cash, verified with receipt, demo confirmed, rejected).
- Users per role, opted-in donors (real demo numbers only from `DEMO_WHATSAPP_NUMBERS`), collection points of types
  CENTER/MOSQUE/OFFICE with an assigned collector.

---

## 4. Obsolete or renamed

| Item | Where | Action |
|---|---|---|
| "Scope: medical only", orphans/home repair listed as Future Scope | `CLAUDE.md`, 04 C7, 05 §2 decisions | Replaced by the official idea (done in this change). Future Scope keeps: food baskets, education, monthly box collection, joint approval, Aga Khan transfers, monthly reconciliation. |
| `CampaignType.MEDICAL` | schema, shared copies, seed | → `MEDICAL_AID` (P05). |
| `Disbursement` model, `disbursements` module, «صرف للمشفى المعتمد فقط» | schema, API, docs | → `Expenditure` / `expenditures`; hospital lock kept for `MEDICAL_AID` only (P05, P14). |
| `disbursedAmount` | schema, API views | → `spentAmount`. |
| `PaymentMethod.E_WALLET`, Bemo details in env vars | schema, seed, `.env` | → named wallets + `PaymentMethodConfig` (P05/P06). |
| Medical-only copy | `web/messages/*.json`: `meta.description`, `home.title/subtitle/heroTitle/heroBody`, `auth.panelTitle/panelBody/panelPoints`, `home.steps[3]` («ندفع للمشفى»), dashboard task texts; README intro | Rewrite for all campaign types (P07/P08). Medical-specific keys (`cases.*`, `intake.*`) stay for the medical pipeline. |
| `docs/screenshots/p04` | | Historical; new screenshots in later prompts. |
| 04 §7 demo scenario | | Superseded by §5 below. |

---

## 5. New demo scenario for the judges (7 steps, web + mobile)

| Step | Who / device | What the judges see |
|---|---|---|
| 1 | ADMIN, web | Creates an **orphan sponsorship** campaign «كفالة 12 يتيماً لعام 2027»: target amount, cover illustration, area, links 12 anonymised beneficiaries (`B-0412`…) with a monthly amount. It appears on the public home next to the **home renovation** and **medical aid** campaigns (type tabs). |
| 2 | CASE_OFFICER, web | Approves a registered medical case (incubator) and publishes it → a **MEDICAL_AID** campaign. The WhatsApp outbox fills with alerts to opted-in donors; one is tapped and arrives on a phone. |
| 3 | DONOR A, Expo app | Opens the orphan campaign, pays with **Syriatel Cash (simulated, «Demo» badge)** → an **instant notification** "تم استلام تبرعك" appears in the app and a WhatsApp outbox message is queued. On the projector the campaign bar moves live in the separate demo segment. |
| 4 | DONOR B, phone browser | Opens a **home renovation** campaign, chooses **bank transfer**, sees the campaign account (fake account name/number), uploads the transfer receipt → notification "received, pending verification". |
| 5 | COLLECTOR, phone (PWA) | Confirms cash handed in at a collection point for the medical campaign → «received, pending verification» segment; the donor gets an acknowledgement. |
| 6 | FINANCE_VERIFIER, web | Verifies DONOR B's transfer and the collector's cash → official receipts `R-2026-…` with **QR**; receipt notifications + outbox messages; the ledgers' "collected" rises. |
| 7 | FINANCE_VERIFIER → public | Records an **expenditure** on the renovation campaign (payee: contractor, invoice photo as proof) and this month's orphan sponsorship payments. The public **transparency dashboard** shows totals collected / spent / remaining, the breakdown by type, the spending timeline with proof, and the beneficiaries count — no identities, demo money shown separately. |

Optional 30-second extra: the Case Officer changes the hospital/amount of the medical campaign → pledges pause automatically.

Everything in this scenario is **Tier 1 (cut line A)** in the rewritten 05 §7 (P05–P16).
