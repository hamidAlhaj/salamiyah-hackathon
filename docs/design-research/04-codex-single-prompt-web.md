# برومت واحد لـ Codex: الويب فقط، مستلهم من The Ismaili

انسخ كل الكتلة اللي تحت برسالة وحدة بمحادثة Codex جديدة.

- **الوقت المتوقع:** ≈ 1.5–2 ساعة، مع الفحوص.
- **آخر الشغل:** Codex بيفتح Pull Request وما بيدمج.
- **قبل الدمج:** صاحب الريبو بيشغّل الـ e2e عنده.

```
You are redesigning the look of the Athar («أثر») web app — Next.js 15 + Tailwind 3 in frontend/ — in the repo
hamidAlhaj/salamiyah-hackathon, inspired ONLY by The Ismaili website (https://the.ismaili/): calm and
institutional, a white page, ONE deep green, mint tints of that green for section bands and chips, green-tinted
neutral text, soft deep card shadows, pill buttons, generous section spacing, a dark charcoal footer.
Web only. Work through the phases below in order, in this one session.

== 0. Setup and rules (read before touching anything) ==
- git fetch; create branch p31-redesign from origin/p30-design-research (= main + the research docs).
- Read fully: CLAUDE.md (project rules; treat it as AGENTS.md, it overrides your defaults),
  docs/design-research/01-the-ismaili.md (measured CSS of The Ismaili), docs/design-research/01-proposal.md §1
  (exact token values) and §5 (must keep), docs/design-research/00-summary.md §2 (contrast). Look at a few
  screenshots in docs/design-research/shots/01/. Ignore the other reference reports (02–05).
- Change files ONLY under frontend/, plus docs/screenshots/athar/ and one attribution line in README.md.
  Never touch backend/, mobile/, e2e/, docs/brand/, package.json / lockfiles, configs, .env, CLAUDE.md.
- Visual changes only. Do NOT change visible texts or their meaning, data-testid attributes, routes, API calls,
  server actions or logic. No new libraries, no new fonts (keep IBM Plex Sans Arabic + Noto Kufi Arabic; do not
  copy The Ismaili's Montserrat/Open Sans, logo, photos or wording). No `any`, no unused code, no duplicated
  components; edit existing ones. Keep the diff focused.
- Must keep: Arabic RTL first + English LTR (logical utilities only: ms-/me-/ps-/pe-/start-/end-/text-start;
  directional icons flip with rtl:-scale-x-100); Western digits; Arabic text ≥ 13px, no uppercase/letter-spacing
  on Arabic; visible keyboard focus ring in both themes (The Ismaili removes it — do NOT copy that); dark mode;
  print styles; loading/error/empty/disabled states; the «Demo» badge; distinct labels for verified / pending /
  demo / spent amounts; `give` (saffron) colour only for donate actions and funding progress; prefers-reduced-motion;
  CSS transitions 150–300ms only, never `transition: all`; 375px layouts without horizontal scroll.
- Git: commit after each phase with the message given. NEVER merge into main, never push to main, never
  force-push, never rewrite history, never delete branches, never commit .env/secrets/phone numbers.
- After EACH phase run: cd frontend && npm run lint && npm test && npm run build. All green before the next phase.
  If a test only asserted an old class name, update it; never weaken or delete a behaviour test. If you cannot run
  something, say exactly what and why — never claim it passed.

== 1. Tokens (frontend/tailwind.config.ts + frontend/src/app/globals.css) ==
Use the exact values of 01-proposal.md §1. Key values:
- brand scale anchored on the logo green: brand-600 #0F6B2F (≈ The Ismaili's measured #007041), brand-700
  #0B5224, brand-800 #0B3D2A; gold { 400: #D9B45A, 500: #C9A13B, 700: #8A6A1C } for decoration only (never text
  on white); new `footer` colours from CSS vars; maxWidth.content 75rem; borderRadius.panel 1.25rem;
  fontSize.read 1.125rem / 1.8; transitionTimingFunction.calm cubic-bezier(0.2,0.8,0.2,1).
- Light vars: --page and --surface #FFFFFF, --surface-muted #EBF2EE (mint band), --border #E3EAE5, --track #DDE7E1,
  --text #182420, --text-muted #4A5A54, --accent and --ring #0F6B2F, --accent-strong #0B5224, --accent-soft #E6F2EC,
  --panel #0B3D2A, --panel-ink #E6F2EC, --footer #17211C, --footer-ink #C9D3CE, --footer-muted #A3B1AA.
- Dark vars: keep page/surface/border/text as today; --accent and --ring #6BCFA5, --accent-strong #ACD9C5,
  --accent-soft #163628, --panel #0A291D, --footer #0A100D (footer ink/muted as light).
- Shadows (The Ismaili's, measured): --shadow-card 0 1px 2px rgb(24 36 32/.04), 0 20px 40px -24px rgb(24 36 32/.28);
  --shadow-lift 0 24px 48px -20px rgb(24 36 32/.32). Dark keeps outline-style shadows.
- Add .section-title (2px × 3rem gold #C9A13B underline under section headings) and .hero-scrim (dark gradient,
  darkest on the inline-start side; separate rule for [dir=ltr]). Keep :focus-visible, .skeleton, theme cross-fade
  and the reduced-motion block. Update the contrast comment with 00-summary.md §2 ratios.
Commit: style(web): Ismaili-inspired design tokens

== 2. Shared components ==
- ui/Button.tsx: rounded-full pills; primary bg-brand-600 hover:bg-brand-700 (both themes); secondary 1px
  border-accent text-accent hover:bg-accent-soft; give/ghost/danger kept; transition-colors duration-150 ease-out
  + active:scale-[0.98]; focus ring unchanged.
- ui/Card.tsx, StatCard.tsx, Badge.tsx, Tabs.tsx: new shadow token; badges/chips rounded-full bg-accent-soft
  text-accent-strong; active tab also gets a 2px underline (not colour only).
- campaigns/CampaignCard.tsx (The Ismaili card recipe): 1px border, 16px radius, shadow-card → shadow-lift on hover
  (remove -translate-y); cover inside overflow-hidden zooms group-hover:scale-[1.03] duration-300 ease-calm
  motion-reduce:transform-none; mint category chip; amounts row separated by border-t. Keep the whole-card link
  and data-testid="completed-badge".
- Replace rounded-[28px] panels with rounded-panel wherever they appear (login, receipt, home ledger, campaign
  page cover).
Commit: style(web): pill buttons, cards and chips in the new style

== 3. Home page and footer ==
Hero image (licence-checked, no people, no religious symbols):
- Download https://commons.wikimedia.org/wiki/File:View_from_Shmemis_Castle.jpg (CC BY-SA 3.0, by Jdowny).
  View it full size first; if it shows people, use the CC0 file
  https://commons.wikimedia.org/wiki/File:--%D9%82%D9%84%D8%B9%D8%A9_%D8%B4%D9%85%D9%8A%D9%85%D9%8A%D8%B3.jpg instead.
- Crop/export with tools already installed (e.g. the Playwright Chrome in e2e/node_modules drawing to a canvas):
  WebP 1920×800 (≈120 KB) and 750×900 (≈60 KB) into frontend/public/images/hero/. No new dependencies.
frontend/src/app/(public)/page.tsx:
- Full-bleed hero band in The Ismaili's style: the photo as background (750 version on phones), .hero-scrim,
  bg-panel fallback colour, white title and body on the inline-start side. CTAs: one primary pill
  «تصفح الحملات» (#campaigns) + the existing council-fund give button (keep data-testid="home-fund-cta");
  the "track a request" link becomes a plain text link (same text and href).
- The ledger panel (keep data-testid="platform-ledger" and "ledger-transparency-link") moves to a band right
  under the hero; rounded-panel; gold underline on its title.
- Sections alternate white / bg-surface-muted, padding py-[clamp(3rem,7vw,5.5rem)], container max-w-content,
  headings use .section-title, campaign grid gap-6. Keep campaign-grid, campaign-count, the filters and the empty
  state unchanged in behaviour.
frontend/src/app/(public)/layout.tsx footer (The Ismaili's charcoal footer):
- bg-footer text-footer-ink, max-w-content, 3 columns: the council text (existing common.council) · links to
  campaigns, transparency, council fund, track (reuse existing nav translation keys) · a bottom row with the
  transparency link and the photo credit: «صورة الواجهة: View from Shmemis Castle — Jdowny، CC BY-SA 3.0، ويكيميديا
  كومنز» / "Hero photo: View from Shmemis Castle — Jdowny, CC BY-SA 3.0, Wikimedia Commons" with links to the file
  page and the licence (new translation keys in BOTH frontend/messages/ar.json and en.json). Links
  text-footer-muted hover:text-white hover:underline underline-offset-4; keep print:hidden.
- Add the same credit line to README.md (one line, under a "Credits" heading).
- Campaign detail page: only the container width (max-w-content), rounded-panel and the reading text
  (summary in text-read max-w-[68ch]). Nothing else there.
Commit: style(web): Ismaili-inspired home hero, section bands and footer

== 4. Full verification, screenshots, pull request ==
1. cd frontend && npm run lint && npm test && npm run build.
2. backend (do not edit it): npm ci if needed, npm run build && npm run demo:reset; start the API
   (node dist/main.js) and the web (cd frontend && npx next start -p 3000), per README (local PostgreSQL).
3. e2e: cd e2e && npx playwright test → expected 44 passed, 1 skipped (LAN test). If something fails, fix the
   styling cause (never edit tests to hide a regression), npm run demo:reset, restart the API, run again.
4. Screenshots (overwrite) into docs/screenshots/athar/: web-home-light.png, web-home-dark.png,
   web-login-light.png, web-login-dark.png (1280×800), web-home-phone.png and web-home-phone-dark.png (375×812).
   Look at them yourself: title readable on the photo, focus ring visible, nothing overlapping, no horizontal
   scroll at 375px, Arabic and English.
5. Stop every server you started; run npm run demo:reset again.
6. Commit "docs(docs): screenshots after the redesign", push the branch p31-redesign and open a pull request into
   main titled "Redesign: Ismaili-inspired web". Do NOT merge. In the PR description: what changed per phase, every
   check result with numbers (lint, tests, build, e2e), anything you could not run, and the screenshot paths.
Reply with the PR link and a 10-line summary, then stop.
```
