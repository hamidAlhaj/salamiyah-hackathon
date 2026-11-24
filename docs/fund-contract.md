# General council fund and surplus allocation — contract (minimal version)

Branch `p26-council-fund`. Written before the code; the implementation follows it.

## 1. Model (one additive migration)

| Change | Type | Meaning |
|---|---|---|
| `Campaign.isGeneralFund` | `Boolean @default(false)` | Exactly one campaign is the general council fund («صندوق المجلس العام»). It is a normal campaign for every donation path (transfer + receipt, simulated wallet «Demo», cash at a collection point, council desk, collector), with `isOngoing = true`, `targetAmount = 0` (no target), slug `general-fund`, category `GENERAL_FUND` (a system category). Never set FUNDED or COMPLETED automatically, never listed among ordinary campaigns. |
| `Pledge.fundAmount` | `Decimal(14,2) @default(0)` | The share of this pledge that goes to the general fund (surplus). `campaignShare = amount − fundAmount − heldAmount`. |
| `Pledge.heldAmount` | `Decimal(14,2) @default(0)` | Money received and verified that neither the campaign (already full) nor the fund (donor did not choose it) may take: state «بانتظار قرار المتبرع» / "needs donor decision". Not counted in any campaign or fund balance until the donor decides. |

Old pledges get `fundAmount = 0`, `heldAmount = 0`: everything stays with their campaign, nothing to migrate.

**One source of truth:** one transfer = one pledge = one receipt = one official receipt number. The pledge belongs to
the campaign the donor chose; the fund share is a column on the same row. Platform totals add
`campaign.verifiedAmount` over all public campaigns **including the fund**, so a split pledge counts **once**
(campaign share + fund share = amount). Demo and pending money stay outside verified balances as before.

**Receiving accounts:** a split transfer is **one** payment to the account shown for the chosen campaign (the council
reconciles internally). The fund has its own fake receiving accounts only for direct fund donations. The UI never
implies one transfer reached two accounts.

## 2. Remaining need (server, exact decimals, campaign currency)

```
remaining = max(0, target − verified − reserved)
reserved  = Σ (amount − fundAmount − heldAmount) of the campaign's pledges that are
            RECEIPT_UPLOADED or COLLECTED, or PLEDGED and created in the last 72 hours
```

Reservation policy: an unpaid transfer pledge (PLEDGED) reserves its campaign share for **72 hours**, then it no
longer blocks other donors (it can still be paid; approval re-checks the cap, §4). Demo pledges never reserve.
Campaigns with no cap: the fund and ongoing programmes (`isOngoing`) → no surplus logic.

## 3. Endpoints

### `GET /campaigns/{id}/allocation?amount=50000` (public) — preview before any pledge

```json
{
  "campaignId": "…", "currency": "SYP", "capped": true,
  "offered": "50000.00", "remaining": "30000.00",
  "campaignShare": "30000.00", "surplus": "20000.00",
  "state": "SURPLUS",
  "fund": { "id": "…", "slug": "general-fund", "title": "صندوق المجلس العام" }
}
```

`state`: `WITHIN` (amount ≤ remaining, or uncapped campaign: normal flow, no extra step), `SURPLUS`
(0 < remaining < amount), `COMPLETE` (remaining = 0). Errors: `campaign_not_found` (404), validation (400).

### Pledge creation — `POST /pledges`, `/pledges/demo`, `/pledges/cash` (DONOR)

Two optional body fields on all three:

| Field | Values | Meaning |
|---|---|---|
| `surplusChoice` | `SPLIT` \| `REMAINING_ONLY` | the donor's choice after the notice |
| `expectedCampaignShare` | decimal string | the campaign share the donor saw; a different server value → `allocation_changed` |

Server rules, inside the creating transaction with the campaign row locked (`SELECT … FOR UPDATE`):

| Situation | Result |
|---|---|
| uncapped campaign or amount ≤ remaining | normal pledge, `fundAmount = 0` |
| remaining = 0 | 409 `campaign_complete` (client offers the fund or other campaigns) |
| amount > remaining, no `surplusChoice` | 409 `surplus_choice_required` |
| `expectedCampaignShare` ≠ remaining | 409 `allocation_changed` (client re-previews and shows the revised split) |
| `REMAINING_ONLY` | pledge `amount = remaining`, `fundAmount = 0` |
| `SPLIT` | pledge `amount = offered`, `fundAmount = offered − remaining` |

Example (remaining 30,000, offered 50,000, `SPLIT`) → `201`:

```json
{ "pledge": { "referenceNo": "P-7K2QXM", "amount": "50000.00",
              "campaignShare": "30000.00", "fundShare": "20000.00", "heldAmount": "0.00", "status": "PLEDGED" },
  "instructions": [ { "method": "BEMO_TRANSFER", "accountNumber": "0000-1111-2222 (FAKE)", "…": "…" } ] }
```

Cancel (browse other campaigns or cancel in the notice) → **no request, no record**.

Council desk and collector entries (`/pledges/council`, `/pledges/collector`) keep their current body; they are
capped at approval (§4).

### `POST /verifications/{id}/approve` (FINANCE_VERIFIER) — one `$transaction`

```
room     = uncapped ? ∞ : max(0, target − campaign.verified)        (rows locked)
share    = amount − fundAmount
credit   = min(share, room);  excess = share − credit
excess > 0 and fundAmount > 0 (donor chose SPLIT) → fundAmount += excess
excess > 0 and fundAmount = 0                     → heldAmount  = excess  (needs donor decision, donor notified)
campaign.verified += credit;  fund.verified += fundAmount;  FUNDED only for capped campaigns at target
```

Response adds `campaignShare`, `fundShare`, `heldAmount`. The audit log records the split.

### `POST /pledges/{id}/allocation-decision` (DONOR who owns the pledge, or FINANCE_VERIFIER) — body `{ "decision": "FUND" }`

Moves `heldAmount` to the fund (`fund.verified += held`, `fundAmount += held`, `heldAmount = 0`), audited, donor
notified. 409 `nothing_held` when there is nothing to decide. Any other decision (refund, another campaign) is handled
by the council offline (Known Limitation).

## 4. Views

- `PledgeView` (my donations, finance queue, collector, receipts): `campaignShare`, `fundShare`, `heldAmount`.
- Official receipt (`GET /official-receipts/{no}`): the same three values; the QR and number are unchanged.
- Ledgers: a campaign's `pending` counts only campaign shares; the fund's `pending` also includes the fund shares of
  pending pledges on other campaigns.
- `PublicCampaign.isGeneralFund`; the fund is excluded from `GET /campaigns` and read with `GET /campaigns/general-fund`.
  Its page shows collected / spent / remaining, no target and no progress bar.
- Transparency: the fund is a public campaign of category `GENERAL_FUND`, so it appears in totals and per category.

## 5. UI

- Web home + header navigation and mobile home: «تبرّع لصندوق المجلس العام» / "Donate to the general council fund"
  → the fund's donate page/screen (all paths).
- Before creating a pledge the donate flow calls the preview:
  - `WITHIN` → unchanged flow.
  - `SURPLUS` → notice «اكتملت الحملة تقريباً: المتبقي X. هل تريد الاحتفاظ بالباقي (Y) أم التبرع به لصندوق المجلس
    العام؟» with: donate only X · give the full amount (X campaign + Y fund) · cancel.
  - `COMPLETE` → «اكتملت هذه الحملة» with: donate to the general fund instead · browse other campaigns · cancel.
  - The notice is a labelled region (`role="alertdialog"`, focus moved to it, keyboard reachable, AR/EN).
- A campaign that is FUNDED shows «اكتملت هذه الحملة» and a button to the fund instead of the donate button.

## 6. Out of scope (Known Limitations)

Two currencies in one split (the fund takes the campaign's currency share; seed uses SYP only), refunds of held money,
moving held money to another campaign, separate fund receiving account for split transfers.
