# Majlis Fund (مجلس فند) — Donation Automation for the Local Council in Salamiyah

Hackathon proof of concept (official idea, Team 4) for the Local Council of Salamiyah, Syria: a simple web platform
(plus a donor mobile app) to manage and document local donation campaigns transparently. The council creates campaigns
in data-driven categories — **orphan sponsorship, home renovation, medical aid** and any category an admin adds — with a
target amount. Donors browse campaigns and give by transfer, local e-wallet (simulated payments carry a «Demo» badge) or
cash at a collection point, and get an instant notification confirming receipt. A public transparency view shows the
total collected, the amounts spent with proof, and the beneficiaries — by anonymous code only, never their identities.

> **Status:** hackathon release `v1.0-hackathon` (P01–P22): backend, frontend (public pages, staff workspace, admin setup,
> collector PWA, transparency dashboard, optional Google sign-in) and the Expo donor app, with a deterministic demo seed,
> the judges' walkthrough in [DEMO.md](DEMO.md) (Arabic) and a Playwright suite for it in `e2e/`. The build log is
> `docs/_analysis/overnight-report.md`; the plan is `docs/_analysis/05-execution-plan.md` §7.

## Main Features

- **Campaigns by category** (data, not an enum): medical aid, orphan sponsorship, home renovation and any category an
  admin adds, each with a target amount, an anonymised summary and a public campaign account (verified, pending, demo,
  spent, remaining).
- **Donations on every path**, web and mobile: transfer + receipt photo (Pledge & Verify), simulated e-wallet / card
  («Demo», never counted as verified money), cash handed to the «مكي» (Mukhi) at a collection point, council desk entry.
- **General council fund** («صندوق المجلس العام»): give to the council without a campaign; when a donation is more than a
  campaign still needs, the donor chooses to give only the remaining need or the full amount with the surplus to the
  fund (`docs/fund-contract.md`). One transfer is counted once in the platform totals.
- **Instant notifications** on every donation (in-app + WhatsApp outbox with `wa.me` links), then an **official receipt**
  `R-YYYY-NNNNNN` with a verification QR after finance approval (separation of duties).
- **Spending with public-safe proof**, monthly sponsorship runs, campaign lifecycle and an audit log.
- **Transparency dashboard**: totals collected / spent / remaining, per category and month, beneficiaries by anonymous
  code `B-XXXX` only.
- **Medical pipeline** (intake → review → publish), beneficiary import, admin setup, Arabic RTL first + English,
  light / dark themes, collector PWA and an Expo donor app.

## Backend API Overview

Every endpoint, grouped by domain like the Postman folders (`docs/postman/`); full request and response
schemas in Swagger at `http://localhost:4000/api/docs`. 🔒 = `Authorization: Bearer <token>` (role checked in the
service); the others are public.

| Domain | Endpoints |
|---|---|
| Health (1) | `GET /health` |
| Auth (7) | `POST /auth/register` · `POST /auth/login` · `GET /auth/google/enabled` · `GET /auth/google` · `GET /auth/google/callback` · `GET /auth/me` 🔒 · `PATCH /auth/me/phone` 🔒 |
| Categories (5) | `GET /categories` · `POST /categories` 🔒 · `GET /categories/all` 🔒 · `PATCH /categories/:id` 🔒 · `DELETE /categories/:id` 🔒 |
| Campaigns (10) | `GET /campaigns` · `POST /campaigns` 🔒 · `GET /campaigns/:slug` · `GET /campaigns/:id/ledger` · `GET /campaigns/:id/transparency` · `GET /campaigns/staff/all` 🔒 · `GET /campaigns/staff/:id` 🔒 · `PATCH /campaigns/:id` 🔒 · `PATCH /campaigns/:id/status` 🔒 · `POST /campaigns/:id/updates` 🔒 |
| Payment methods & receiving accounts (7) | `GET /payment-methods` · `GET /campaigns/:id/payment-accounts` · `GET /payment-methods/config` 🔒 · `PATCH /payment-methods/config/:method` 🔒 · `GET /campaigns/:id/payment-accounts/overrides` 🔒 · `PUT /campaigns/:id/payment-accounts/:method` 🔒 · `DELETE /campaigns/:id/payment-accounts/:method` 🔒 |
| Beneficiaries (9) | `GET /campaigns/:id/beneficiaries` · `POST /campaigns/:id/beneficiaries` 🔒 · `GET /beneficiaries` 🔒 · `POST /beneficiaries` 🔒 · `PATCH /beneficiaries/:id` 🔒 · `POST /beneficiaries/:id/suspend` 🔒 · `POST /beneficiaries/:id/reactivate` 🔒 · `POST /beneficiaries/:id/notes` 🔒 · `PATCH /campaigns/:id/beneficiaries/:beneficiaryId` 🔒 |
| Medical cases (8) | `GET /cases/track` · `POST /cases` 🔒 · `GET /cases` 🔒 · `GET /cases/:id` 🔒 · `POST /cases/:id/review` 🔒 · `PATCH /cases/:id/hospital-amount` 🔒 · `POST /cases/:id/publish` 🔒 · `GET /documents/:id/file` 🔒 |
| Donations (pledges) (14) | `GET /campaigns/:id/allocation` · `GET /official-receipts/:no` · `POST /pledges` 🔒 · `POST /pledges/demo` 🔒 · `POST /pledges/cash` 🔒 · `POST /pledges/council` 🔒 · `POST /pledges/collector` 🔒 · `GET /pledges/mine` 🔒 · `GET /pledges/recorded` 🔒 · `GET /pledges/:id` 🔒 · `POST /pledges/:id/receipts` 🔒 · `POST /pledges/:id/cancel` 🔒 · `POST /pledges/:id/allocation-decision` 🔒 · `GET /receipts/:id/file` 🔒 |
| Collector (Mukhi) (5) | `GET /collector/points` 🔒 · `GET /collector/pledges` 🔒 · `GET /collector/pledges/by-reference/:referenceNo` 🔒 · `POST /collector/pledges/:id/confirm` 🔒 · `GET /collector/history` 🔒 |
| Verifications (finance) (3) | `GET /verifications` 🔒 · `POST /verifications/:id/approve` 🔒 · `POST /verifications/:id/reject` 🔒 |
| Expenditures (spending) (6) | `GET /campaigns/:id/spending` · `GET /expenditures/:id/proof` · `POST /expenditures` 🔒 · `POST /campaigns/:id/expenditures/monthly` 🔒 · `GET /campaigns/:id/spending-context` 🔒 · `GET /campaigns/:id/expenditures` 🔒 |
| Notifications & WhatsApp outbox (7) | `GET /notifications` 🔒 · `GET /notifications/unread-count` 🔒 · `POST /notifications/read-all` 🔒 · `POST /notifications/:id/read` 🔒 · `GET /outbox` 🔒 · `GET /outbox/next` 🔒 · `POST /outbox/:id/opened` 🔒 |
| Transparency (stats) (2) | `GET /stats/transparency` · `GET /stats/transparency.csv` |
| Hospitals & collection points (9) | `GET /collection-points/active` · `GET /hospitals` 🔒 · `POST /hospitals` 🔒 · `GET /hospitals/all` 🔒 · `PATCH /hospitals/:id` 🔒 · `GET /collection-points` 🔒 · `POST /collection-points` 🔒 · `GET /collection-points/mine` 🔒 · `PATCH /collection-points/:id` 🔒 |
| Users (3) | `GET /users` 🔒 · `POST /users` 🔒 · `PATCH /users/:id` 🔒 |
| Imports (4) | `POST /imports/preview` 🔒 · `POST /imports/:id/validate` 🔒 · `POST /imports/:id/commit` 🔒 · `GET /imports/:id/errors.csv` 🔒 |
| Audit (3) | `GET /audit` 🔒 · `GET /audit/campaigns/:id` 🔒 · `GET /audit/cases/:id` 🔒 |

## Repository layout

```
backend/      NestJS 10 + Prisma 5 + PostgreSQL       (own package.json / package-lock.json)
frontend/      Next.js 15 (App Router) + Tailwind 3      (own package.json / package-lock.json)
mobile/   Expo SDK 58 donor app                     (own package.json / package-lock.json)
e2e/      Playwright smoke + demo scenario          (own package.json / package-lock.json, dev tool only)
scripts/  demo-start.ps1 (starts api, web and Expo for the LAN demo)
DEMO.md   the judges' walkthrough (Arabic): roles, logins, clicks, expected numbers, checklist
docs/     input/ (source PDFs, brief, idea, meeting) · analysis/ · _analysis/ (reports 01–06, overnight report) · screenshots/ · tools/
```

Three separate npm projects (plus the `e2e/` test tool): no workspaces, no shared packages, no Docker. Rules for contributors and Claude Code are in
[CLAUDE.md](CLAUDE.md).

## Run it locally (Windows first)

### 1. Install once
- **Git**
- **Node 24.12.0**. With [nvm-windows](https://github.com/coreybutler/nvm-windows):
  ```powershell
  nvm install 24.12.0
  ```
  ```powershell
  nvm use 24.12.0
  ```
- **PostgreSQL** installed locally (14 or newer; this project was set up against PostgreSQL 18 running as the Windows
  service `postgresql-x64-18` on port 5432). Make sure the service is running:
  ```powershell
  Get-Service *postgres*
  ```
- **Expo Go** on your phone (for the donor app).

### 2. Get the code
```powershell
git clone https://github.com/hamidAlhaj/salamiyah-hackathon.git
```
```powershell
cd salamiyah-hackathon
```

### 3. Create the project database (once)
The script creates a login role `majlis` and a database `majlis_fund`. You choose the role's password on the command
line; it is never stored in the repository. If `psql` is not on your PATH, use its full path, e.g.
`& "C:\Program Files\PostgreSQL\18\bin\psql.exe"`. It asks for the **postgres** superuser password.
```powershell
psql -U postgres -h localhost -p 5432 -v app_password="choose-a-password" -f backend/prisma/dev-db-setup.sql
```

### 4. API
```powershell
cd backend
```
```powershell
copy .env.example .env
```
Edit `backend/.env`:
- `DATABASE_URL="postgresql://majlis:<your-password>@localhost:5432/majlis_fund?schema=public"`
- generate `JWT_SECRET` and `NATIONAL_ID_HMAC_KEY`: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- optional, live demo only: `DEMO_WHATSAPP_NUMBERS="+963…,+963…"` (team phones; this file is never committed)

```powershell
npm ci
```
```powershell
npx prisma migrate dev
```
```powershell
npm run seed
```
```powershell
npm run start:dev
```
API on `http://localhost:4000`, Swagger at `http://localhost:4000/api/docs`.

`npm run demo:reset` rebuilds the demo database in one step: it refuses unless `DATABASE_URL` is the local
`majlis_fund` database (the seed-safety check), runs `prisma migrate reset --force --skip-seed`, empties `backend/uploads/`
and runs the deterministic seed. Run it before every rehearsal and before the demo.

### 5. Web
In a second terminal (the API keeps running in the first), from the repository root:
```powershell
cd frontend
```
```powershell
copy .env.example .env
```
```powershell
npm ci
```
```powershell
npm run dev
```
Open `http://localhost:3000`. Collector pages are mobile-first and installable from the phone browser (PWA).

`SESSION_COOKIE_SECURE` (in `frontend/.env`) sets the `Secure` flag of the HttpOnly session cookie. Empty = on in production,
off in development. For the **LAN demo** (a production build served over plain HTTP at `http://<LAN-IP>:3000`) set it
to `"false"`, otherwise phones drop the cookie and login fails. Never set it to `"false"` behind HTTPS.

### 5a. Sign in with Google (optional, off by default)
Phone + password stays the main login (staff, collectors, older donors) and is unchanged. "Continue with Google"
appears under the login form **only** when `backend/.env` has all three of `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
and `GOOGLE_CALLBACK_URL`; otherwise the button is hidden and the Google API routes answer 404
`google_sign_in_disabled`. No keys are committed; you create the OAuth client yourself:

1. Open <https://console.cloud.google.com/>, create (or pick) a project, e.g. "Majlis Fund demo".
2. **Google Auth Platform → Branding / Audience** (older consoles: *APIs & Services → OAuth consent screen*):
   user type **External**, app name «مجلس فند» / Majlis Fund, your support and developer email. Scopes: only
   `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` (non-sensitive). Leave the publishing status on
   **Testing** and add every Gmail address that will try it as a **test user** (only they can sign in while testing).
3. **Clients → Create client** (older: *Credentials → Create credentials → OAuth client ID*), application type
   **Web application**:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
   (The redirect goes to the **web** app, not to the API on :4000.)
4. Copy the client ID and secret into `backend/.env` (never into git, never into `frontend/.env`):
   ```
   GOOGLE_CLIENT_ID="<client id>.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="<client secret>"
   GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
   ```
   Restart the API. `http://localhost:4000/auth/google/enabled` must now say `"enabled": true`, and the login page
   at `http://localhost:3000/login` shows the button.
5. **LAN / phones:** Google only accepts plain-`http` redirect URIs on `localhost`, never on a raw IP address, so
   `http://192.168.x.x:3000/...` cannot be registered (the console rejects it). On the LAN demo the button is
   therefore hidden automatically on any host other than the callback's (phones keep phone + password). To use
   Google from other devices you need an HTTPS host name (a real domain or an HTTPS tunnel): add
   `https://<host>` as an origin and `https://<host>/auth/google/callback` as a redirect URI, and set
   `GOOGLE_CALLBACK_URL` to that URL.

How it works: `/auth/google/start` (web) stores a random CSRF `state` in an HttpOnly cookie and sends the browser to
Google; Google returns to `/auth/google/callback` (web), which checks the state and hands Google's one-time code to the
API server-side (`GET /auth/google/callback`, `passport-google-oauth20`). The API returns the same 8h session as
`POST /auth/login`; the token goes only into the HttpOnly `session` cookie, never into a URL. Rules:
- A new Google account becomes a **DONOR** without phone or password. Before donating it must add a phone on
  «ملفي» / *My profile* (`/dashboard/profile`, same phone rules as registration, unique): every donate endpoint
  refuses with `403 phone_required` until then, because receipts and alerts go out on WhatsApp.
- A Google account is matched by its Google id. If none is linked yet and Google reports a **verified** email that
  belongs to an existing **DONOR**, that donor is linked once (audited). Staff, collector and admin accounts are
  never linked or entered through Google (`google_staff_account`); they keep phone + password.
- The mobile app keeps phone + password only (no native Google sign-in) and shows the `phone_required` message if
  the API ever returns it.

### 6. Mobile (donor app)
In a third terminal, from the repository root:
```powershell
cd mobile
```
```powershell
copy .env.example .env
```
Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SITE_URL` to your PC's LAN IP (`ipconfig` → IPv4 Address), e.g.
`http://192.168.1.10:4000`. `localhost` on a phone means the phone itself.
```powershell
npm ci
```
```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.1.10"; npx expo start
```
Use your own LAN IP. Setting it makes the QR code use the Wi-Fi address even when a VPN or VirtualBox adapter is
present. Scan the QR code with Expo Go (the API must be running). On first launch, if the layout is left-to-right,
reload once from the Expo Go menu: Arabic right-to-left takes effect after a restart.

Windows Firewall blocks the phone until you allow the dev ports on the local network. Run once in an **administrator**
PowerShell:
```powershell
New-NetFirewallRule -DisplayName "Majlis Fund dev (API 4000, Metro 8081)" -Direction Inbound -Protocol TCP -LocalPort 4000,8081 -RemoteAddress LocalSubnet -Action Allow -Profile Private,Public
```
Remove it after the hackathon: `Remove-NetFirewallRule -DisplayName "Majlis Fund dev (API 4000, Metro 8081)"`.
For the LAN demo, phones also open the web app on port 3000: see the checklist in [DEMO.md](DEMO.md).

### 7. Install the collector app (PWA)
Collectors (role `COLLECTOR`, shown as «مكي» / "Mukhi") use the web dashboard `/dashboard/collector` on their phone and can add it to the home
screen. The service worker (`frontend/public/sw.js`, offline page only, never caches donation data) registers in a
**production build** on a **secure origin** only (from the repository root, instead of `npm run dev`):
```powershell
cd frontend; npm run build; npm start
```
- On the PC, `http://localhost:3000` is a secure origin: Chrome shows "Install app" (DevTools → Application → Manifest
  shows no installability errors).
- On a phone over the LAN (`http://192.168.x.x:3000`) the page is **not** a secure origin, so there is no install prompt
  and no offline page. "Add to Home screen" from the browser menu still creates an icon that opens the dashboard.
- Workaround for a real install on Android without new tools (USB cable, Developer options on the phone): on the PC open
  `chrome://inspect/#devices` in Chrome, enable **Port forwarding** `3000 → localhost:3000` (and `4000 → localhost:4000`
  if the phone also calls the API), then open `http://localhost:3000` in Chrome on the phone. It is now a secure origin
  and Chrome offers "Install app".
- Alternative for a quick demo: in Chrome on the phone open `chrome://flags/#unsafely-treat-insecure-origin-as-secure`,
  add `http://<LAN-IP>:3000`, relaunch. Use only on a demo device.

### 8. Demo accounts and the walkthrough
All seed accounts are fictional and share the password `Majlis@2026` (development only):

| Role | Login |
|---|---|
| ADMIN | `0900000001` |
| CASE_OFFICER | `0900000002` |
| FINANCE_VERIFIER | `0900000003` |
| STAFF | `0900000004` |
| COLLECTOR («مكي» / "Mukhi", CENTER + MOSQUE points) | `0900000005` |
| DONOR (opted in to WhatsApp alerts) | `0900000006` |
| DONOR (diaspora, English) | `+4915100000007` |

The judges' scenario, the 2-minute version, the expected numbers, the pre-demo checklist (VPN, firewall, LAN variables,
start order) and troubleshooting are in [DEMO.md](DEMO.md). `scripts/demo-start.ps1` starts api, web and Expo for the
LAN demo (read it first; it is documented step by step).

### 9. End-to-end tests (Playwright)
`e2e/` is a fourth, test-only npm project with one pinned dev dependency (`@playwright/test`, see "Additions beyond
b4f"). It is separate so the three app projects stay unchanged, and it runs on the installed Google Chrome
(`channel: "chrome"`), so no browser download is needed. `npx playwright@<version> test` alone cannot work: test files
import `@playwright/test`, which must resolve from a local `node_modules`. From the repository root, reset the data
first, then **start (or restart) the API after the reset**: the API checks for overdue cases 5 s after it starts and then only
every 10 minutes (`SLA_CHECK_MINUTES`), so an API started before the reset misses the seeded overdue case and the
SLA-alert test fails.
```powershell
cd backend; npm run demo:reset; cd ..
```
```powershell
cd e2e; npm ci; npx playwright test
```
With the backend (4000) and the frontend (3000) running, it logs in once per role, checks the public pages (seeded numbers, the completed
campaign with public proofs, a verifiable receipt, no beneficiary identity or phone on any public page or endpoint) and
runs the 7-step demo scenario. The scenario changes the data: run `npm run demo:reset` again afterwards. Options:
`E2E_WEB_URL` / `E2E_API_URL` (defaults `http://localhost:3000` / `:4000`), `E2E_LAN_URL=http://<LAN-IP>:3000` (checks the
LAN login), `E2E_ALERT_DONORS` (1 + the count of `DEMO_WHATSAPP_NUMBERS`, default 3), `E2E_SCREENSHOTS=1` (writes
`docs/screenshots/p16/`).

## Checks before every push
Each line starts from the repository root.
```powershell
cd backend; npm run lint; npm test; npm run build; cd ..
```
```powershell
cd frontend; npm run lint; npm test; npm run build; cd ..
```
```powershell
cd mobile; npx tsc --noEmit; npx expo lint; npx expo install --check; npx expo-doctor
```
TypeScript stays on 5.9.3 (team decision) although Expo 58 suggests 6.0: `expo.install.exclude` in `mobile/package.json`
skips it in the version check.

## Hackathon-only notes
- **Demo payments:** ShamCash, PayPal and Visa are **simulated** and always carry a «Demo» badge. Demo money is shown
  separately and never counts as verified money. The real path is Pledge & Verify (transfer → receipt upload → finance
  verification).
- **Bemo account details** in the transfer instructions are **fake placeholders**.
- **All seed data is fictional** (hospitals, collection points, collectors, donors, cases, beneficiaries, payment accounts). Real team WhatsApp numbers
  for the live demo go only in `backend/.env` (`DEMO_WHATSAPP_NUMBERS`); the seed falls back to fictional numbers when it is empty.
- **WhatsApp:** messages are generated in an internal outbox and sent with one-tap `wa.me` links. No WhatsApp API is used.

## Pinned versions (from the b4f reference)
NestJS 10.4.22 · Prisma 5.22.0 · passport-jwt 4.0.1 · bcrypt 5.1.1 · class-validator 0.14.4 · Jest 29.7.0 ·
Next 15.5.24 · React 19.3.0 · Tailwind 3.4.19 · Redux Toolkit 2.13.0 · Vitest 3.2.7 · TypeScript 5.9.3 ·
ESLint 8.57.1 (legacy `.eslintrc`) · Expo SDK 58 · Node 24.12.0 · npm.

## Additions beyond b4f
Libraries used here that the b4f reference does not have. Each one is pinned to an exact version when it is added to a
`package.json`, and recorded in this table.

| Package | Project | Why | Version | Added in |
|---|---|---|---|---|
| `@nestjs/throttler` | backend | Rate limit on login/register | 6.8.0 | P02 |
| `sharp` | backend | Strip EXIF/GPS from uploaded receipts and documents | 0.35.5 | P02 |
| `exceljs`, `csv-parse` | backend | Beneficiary Excel/CSV import | 4.4.0 / 7.0.3 | P02 |
| `@types/multer` (dev) | backend | Types for `Express.Multer.File` (matches the multer 2.0.x bundled with `@nestjs/platform-express` 10.4.22) | 2.0.0 | P02 |
| `next-intl` | frontend | Arabic/English text (cookie locale, no URL routing) | 4.15.1 | P04 |
| `i18next`, `react-i18next` | mobile | Arabic/English text | 27.2.1 / 18.0.3 | P06 |
| `react-native-svg` | mobile | Category icons and cover illustrations drawn like the web SVGs (Expo 58 bundled version) | 15.16.0 | P09 |
| `expo-clipboard` | mobile | Copy a receiving account number (Expo 58 SDK module) | ~58.0.4 | P09 |
| `@expo-google-fonts/ibm-plex-sans-arabic`, `@expo-google-fonts/noto-kufi-arabic` | mobile | The web fonts (IBM Plex Sans Arabic body, Noto Kufi Arabic headings) bundled for expo-font | 0.4.2 / 0.4.3 | P09 |
| `qrcode`, `@types/qrcode` (dev) | backend | QR code (server-side SVG) on official receipts, encoding the public receipt URL | 1.5.4 / 1.5.6 | P13 |
| `@playwright/test` (dev) | e2e | Smoke tests and the demo scenario in a separate test-only project; runs on the installed Chrome | 1.64.1 | P16 |
| `passport-google-oauth20`, `@types/passport-google-oauth20` (dev) | backend | Optional "Sign in with Google" (OAuth 2.0 strategy for the installed `passport` 0.7.0 / `@nestjs/passport` 10.0.3); off unless the three `GOOGLE_*` keys are set | 2.0.0 / 2.0.17 | P22 |

## Docs
- `docs/input/`: council PoC proposal (**primary requirement source**), full system specification, team brief (ar/en),
  original idea, meeting recording.
- `docs/analysis/`: meeting transcript and summary, earlier requirements/architecture drafts (historical).
- `docs/_analysis/`: reports 01–06 and `overnight-report.md` (what each prompt built and checked). `05-execution-plan.md`
  is the build plan; its "Decision updates" sections are binding.
