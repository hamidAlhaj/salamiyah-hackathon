# Majlis Fund (مجلس فند) — Donation Automation for the Local Council in Salamiyah

Hackathon proof of concept (official idea, Team 4) for the Local Council of Salamiyah, Syria: a simple web platform
(plus a donor mobile app) to manage and document local donation campaigns transparently. The council creates campaigns
in data-driven categories — **orphan sponsorship, home renovation, medical aid** and any category an admin adds — with a
target amount. Donors browse campaigns and give by transfer, local e-wallet (simulated payments carry a «Demo» badge) or
cash at a collection point, and get an instant notification confirming receipt. A public transparency view shows the
total collected, the amounts spent with proof, and the beneficiaries — by anonymous code only, never their identities.

> **Status:** `api/` (P02–P06) and the public `web/` pages (P04, P07: home, campaign account, track, receipts) are in
> place. Staff screens, donations, notifications and `mobile/` follow (see `docs/_analysis/05-execution-plan.md` §7).

## Repository layout

```
api/      NestJS 10 + Prisma 5 + PostgreSQL       (own package.json / package-lock.json)
web/      Next.js 15 (App Router) + Tailwind 3      (own package.json / package-lock.json)
mobile/   Expo SDK 58 donor app                     (own package.json / package-lock.json)
docs/     input/ (source PDFs, brief, idea, meeting) · analysis/ · _analysis/ (reports 01–05) · tools/
```

Three separate npm projects: no workspaces, no shared packages, no Docker. Rules for contributors and Claude Code are in
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
git clone <repo-url>
```
```powershell
cd salamiyah-hackathon
```

### 3. Create the project database (once)
The script creates a login role `majlis` and a database `majlis_fund`. You choose the role's password on the command
line; it is never stored in the repository. If `psql` is not on your PATH, use its full path, e.g.
`& "C:\Program Files\PostgreSQL\18\bin\psql.exe"`. It asks for the **postgres** superuser password.
```powershell
psql -U postgres -h localhost -p 5432 -v app_password="choose-a-password" -f api/prisma/dev-db-setup.sql
```

### 4. API
```powershell
cd api
```
```powershell
copy .env.example .env
```
Edit `api/.env`:
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

### 5. Web
```powershell
cd web
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

### 6. Mobile (donor app)
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

### 7. Install the collector app (PWA)
Collectors («مسؤول نقطة جمع») use the web dashboard `/dashboard/collector` on their phone and can add it to the home
screen. The service worker (`web/public/sw.js`, offline page only, never caches donation data) registers in a
**production build** on a **secure origin** only:
```powershell
cd web; npm run build; npm start
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

### 8. Demo accounts
`npm run seed` prints one fictional account per role (DONOR, STAFF, CASE_OFFICER, FINANCE_VERIFIER, ADMIN, COLLECTOR).
The demo walkthrough is in `DEMO.md` (added in P13).

## Checks before every push
```powershell
cd api; npm run lint; npm test; npm run build
```
```powershell
cd web; npm run lint; npm test; npm run build
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
- **All seed data is fictional** (hospitals, collection points, collectors, donors, cases). Real team WhatsApp numbers
  for the live demo go only in `api/.env` (`DEMO_WHATSAPP_NUMBERS`); the seed falls back to fictional numbers when it is empty.
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
| `@nestjs/throttler` | api | Rate limit on login/register | 6.8.0 | P02 |
| `sharp` | api | Strip EXIF/GPS from uploaded receipts and documents | 0.35.5 | P02 |
| `exceljs`, `csv-parse` | api | Beneficiary Excel/CSV import | 4.4.0 / 7.0.3 | P02 |
| `@types/multer` (dev) | api | Types for `Express.Multer.File` (matches the multer 2.0.x bundled with `@nestjs/platform-express` 10.4.22) | 2.0.0 | P02 |
| `next-intl` | web | Arabic/English text (cookie locale, no URL routing) | 4.15.1 | P04 |
| `i18next`, `react-i18next` | mobile | Arabic/English text | 27.2.1 / 18.0.3 | P06 |
| `react-native-svg` | mobile | Category icons and cover illustrations drawn like the web SVGs (Expo 58 bundled version) | 15.16.0 | P09 |
| `expo-clipboard` | mobile | Copy a receiving account number (Expo 58 SDK module) | ~58.0.4 | P09 |
| `@expo-google-fonts/ibm-plex-sans-arabic`, `@expo-google-fonts/noto-kufi-arabic` | mobile | The web fonts (IBM Plex Sans Arabic body, Noto Kufi Arabic headings) bundled for expo-font | 0.4.2 / 0.4.3 | P09 |
| `qrcode` | api or web | QR verification code on official receipts | pinned exactly in P11 | P11 |

## Docs
- `docs/input/`: council PoC proposal (**primary requirement source**), full system specification, team brief (ar/en),
  original idea, meeting recording.
- `docs/analysis/`: meeting transcript and summary, earlier requirements/architecture drafts (historical).
- `docs/_analysis/`: reports 01–05. `05-execution-plan.md` is the build plan; its "Decision updates" section is binding.
