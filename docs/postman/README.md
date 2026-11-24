# Postman collection — Athar API

Project and team: «أثر» / Athar.

`salamiyah-hackathon.postman_collection.json` — **Postman Collection v2.1**, every endpoint of the NestJS API
(**103 endpoints in 17 folders** + 6 demo logins), grouped by domain in the same order as the README
"Backend API Overview".

| Folder | Endpoints |
|---|---|
| Health | 1 |
| Auth (+ Demo logins) | 7 (+6) |
| Categories | 5 |
| Campaigns | 10 |
| Payment methods & receiving accounts | 7 |
| Beneficiaries | 9 |
| Medical cases | 8 |
| Donations (pledges) | 14 (incl. the fund: allocation preview, held money → fund) |
| Collector (Mukhi) | 5 |
| Verifications (finance) | 3 |
| Expenditures (spending) | 6 |
| Notifications & WhatsApp outbox | 7 |
| Transparency (stats) | 2 |
| Hospitals & collection points | 9 |
| Users | 3 |
| Imports | 4 |
| Audit | 3 |

## Import and use

1. Start the API (README §3–§4): `cd api`, `npm run demo:reset`, then `npm run start:dev`. It listens on
   `http://localhost:4000`; Swagger is at `http://localhost:4000/api/docs`.
2. Postman → **Import** → choose `docs/postman/salamiyah-hackathon.postman_collection.json`.
3. Collection → **Variables**: `baseUrl` defaults to `http://localhost:4000` (use `http://<LAN-IP>:4000` from another
   device). `token` starts empty.
4. Run **Auth → Login (saves {{token}})**, or one of **Auth → Demo logins → Login as <ROLE>**. Each login's test script
   stores `accessToken` in the collection variable `{{token}}`. Every protected request inherits
   `Authorization: Bearer {{token}}` from the collection; public requests are set to *No Auth*.
5. Requests that need an id use collection variables filled by earlier requests:

| Variable | Filled by |
|---|---|
| `campaignId`, `campaignSlug` | Campaigns → *Public campaigns of every category* |
| `categoryId` | Categories → *Active campaign categories* |
| `collectionPointId` | Hospitals & collection points → *Active collection points* |
| `pledgeId`, `pledgeReference` | Donations → *create pledge* / *cash pledge* |
| `verificationId` | Verifications → *finance queue* |
| `officialReceiptNo` | Verifications → *approve* |
| `caseId`, `beneficiaryId`, `hospitalId`, `userId`, `notificationId` | the matching *list* request |

   The remaining ids (`expenditureId`, `importId`, `outboxId`, `documentId`, `receiptId`) are copied by hand from a
   response.
6. File fields (receipt, proof, medical report, import file) are `form-data` entries of type *File*: pick a JPEG, PNG or
   PDF (the API checks the real file type, strips EXIF and limits the size).

### Suggested order (the demo story)
Auth → Login as DONOR → Campaigns → list → Donations → create pledge → upload receipt → Login as FINANCE_VERIFIER →
Verifications → list → approve → Donations → official receipt by number → Transparency → stats.

## Demo accounts
All accounts are **fictional** seed accounts (README §8, `DEMO.md`); the shared demo password is the collection variable
`demoPassword` (`Majlis@2026`, development only). No real phone numbers, tokens or secrets are stored in the collection.

| Role | Phone |
|---|---|
| ADMIN | `0900000001` |
| CASE_OFFICER | `0900000002` |
| FINANCE_VERIFIER | `0900000003` |
| STAFF | `0900000004` |
| COLLECTOR («مكي» / Mukhi) | `0900000005` |
| DONOR | `0900000006` |

Login is rate-limited (10 requests per minute per client, register 5): wait a minute after a `429`.

Errors always have the shape `{ statusCode, message, error, path, timestamp }`, where `message` carries a stable code
(e.g. `phone_taken`).

## Tools (`docs/postman/tools/`, Node 24 built-ins only, no dependencies)

| Script | What it does |
|---|---|
| `build-collection.cjs` | Rebuilds the collection from the running API's Swagger document (`/api/docs-json`) and saves `openapi.snapshot.json`; `--offline` rebuilds from the snapshot. Request bodies come from the DTO schemas and their examples. |
| `compare-endpoints.cjs` | Reads every `@Controller` / `@Get|@Post|@Patch|@Put|@Delete` in `backend/src` and compares it with the collection. Result on 2026-11-24: **103 controller endpoints = 103 collection endpoints**. |
| `run-collection.cjs` | Runs the main flow from the collection itself (public pages → donor pledge + receipt + demo payment + cash → collector → finance approval → official receipt → admin views → a 403 role check) through a small `pm` shim. It changes data: run `npm run demo:reset` in `backend/` afterwards. |

```powershell
node docs/postman/tools/build-collection.cjs
```
```powershell
node docs/postman/tools/compare-endpoints.cjs
```
```powershell
node docs/postman/tools/run-collection.cjs
```

After a backend change (new endpoint or DTO), run the first two again and commit the collection with the change.
