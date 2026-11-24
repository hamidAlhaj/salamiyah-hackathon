# برومتات إعادة تصميم «أثر» لـ Codex: بالترتيب

## قبل ما تبلّش

- **الريبو:** `hamidAlhaj/salamiyah-hackathon`، والفرع `p30-design-research`.
- **الأداة:** اشتغل بـ **Codex CLI على جهازك** بعد ما تعمل clone. الفحوص بدها PostgreSQL محلي وChrome والسيرفرات
  شغّالة، والطريقة بالـ README.
- **طريقة الإرسال:**
  - كل برومت برسالة لحاله، وبالترتيب اللي تحت.
  - لا تبعت البرومت اللي بعده إلا لما Codex يقول إنه lint وtest وbuild نجحوا.
- **اللي ما لازم توافق عليه:** إذا Codex اقترح يغيّر نصوص أو `data-testid`، أو يضيف مكتبة، أو يدمج على main، لا
  توافق.
- **آخر كل جزء:** Codex بيفتح **Pull Request** وبيوقف. صاحب الريبو بيشغّل الفحوص والـ e2e عنده وبيدمج بنفسه.

| # | البرومت | شو بيعمل | الوقت |
|---|---|---|---|
| 1 | القواعد | بيقرأ `CLAUDE.md` والمقترح وبيثبّت القواعد (بدون تعديل) | 5 د |
| 2 | Prompt 0 | بيعمل الفرع وبيقرأ الملفات (بدون تعديل) | 5 د |
| 3 | Prompt 1 | الألوان الجديدة والأزرار البيضاوية (ويب) | 40 د |
| 4 | Prompt 2 | بطاقة الحملة والفوتر (ويب) | 45 د |
| 5 | Prompt 3 | الواجهة مع صورة قلعة شميميس والأشرطة (ويب) | 60–75 د |
| 6 | Prompt 4 | كل الفحوص ولقطات الشاشة وفتح PR (ويب) | 45 د |
| 7 | Prompt 6 | الموبايل بنفس الألوان والأشكال، والتأكد من اللوغو، وفتح PR | 30–45 د |
| 8 | Prompt 5 | تحسينات إضافية (اختياري، إذا ضل وقت) | 90 د |
| 9 | المراجعة | فحص النتيجة على قائمة «Must keep» (اختياري، بدون تعديل) | 15 د |

**ملاحظات:**
- **بالتوازي:** Prompt 6 (الموبايل) بيقدر ينبعت مباشرة بعد Prompt 0، لأنه ما في ولا ملف مشترك مع برومتات الويب.
- **إذا الوقت ضيّق:** الأساسي من 1 لـ 7.

**الملفات اللي بيعتمد عليها Codex** (كلها على الفرع):

| الملف | فيه |
|---|---|
| `CLAUDE.md` | قواعد المشروع |
| `docs/design-research/01-proposal.md` | القيم الدقيقة، والملفات، والترتيب |
| `docs/design-research/00-summary.md` | الأسباب وفحوص التباين |
| `docs/design-research/shots/01/` | صور موقع The Ismaili، يعني الشكل المطلوب |

---

## 1 · القواعد

```
Before any work, read and follow these rules for the whole session (they apply to every later prompt I send):

Context
- Repo: hamidAlhaj/salamiyah-hackathon. Product: «أثر» / Athar (Next.js web in frontend/, Expo app in mobile/).
- The project rules are in CLAUDE.md (not AGENTS.md). Read CLAUDE.md fully now and treat it as AGENTS.md:
  it overrides your defaults. Confirm by listing its 10 most important rules in your reply.
- The task: a visual redesign close to The Ismaili's style. Everything is specified in branch p30-design-research:
  docs/design-research/01-proposal.md (exact tokens, files, order), 00-summary.md (contrast checks).
  I will send you the step prompts one by one. Read 01-proposal.md now.

Scope (hard limits)
- You may change files ONLY under frontend/ and mobile/ (plus docs/screenshots/athar/ for screenshots and the
  hero attribution line in README.md when a prompt asks for it). Never touch backend/, e2e/, docs/brand/,
  package.json / package-lock.json files, configs, .env or CLAUDE.md.
- Visual changes only: do not change visible texts, translation meanings, data-testid / testID attributes, routes,
  API calls, server actions or business logic. Do not add, remove or upgrade any library or font.
- Do not add code that is not needed: prefer editing existing components; no new abstractions, no duplicated
  components, no unused code. The diff should be small and focused — if a step grows beyond ~300 changed lines,
  stop and tell me why.

Git
- Work on the branch each prompt names. Commit with the exact message each prompt gives.
- NEVER merge into main and NEVER push to main. When a prompt's work is finished, push its branch and open a pull
  request into main, then stop and report the PR link. The repo owner runs the checks and merges.
- Never force-push, never rewrite history, never delete branches. Never commit secrets, .env or phone numbers.

Checks
- After every step run: cd frontend && npm run lint && npm test && npm run build
  (for mobile: cd mobile && npx tsc --noEmit && npx expo lint). Report the real output summary; if something
  fails, fix it or tell me — never weaken or delete a test to make it pass.
- If you cannot run something (no database, no browser, no network), say exactly what you could not run instead
  of claiming it passed.

Reply now with: your understanding of the task in 5 lines, the 10 CLAUDE.md rules, and "ready for Prompt 0".
Do not change any file in this message.
```

---

## 2 · Prompt 0: setup

```
You are implementing a visual redesign of the Athar web app (Next.js 15 + Tailwind 3, folder frontend/) in the repo
hamidAlhaj/salamiyah-hackathon. Do NOT start coding in this message: set up, read and confirm.

1. git fetch, then create branch p31-redesign from origin/p30-design-research (it is main + the research docs).
2. Read in full: CLAUDE.md, docs/design-research/01-proposal.md, docs/design-research/00-summary.md. Look at a few
   screenshots in docs/design-research/shots/01/ (The Ismaili = the target style: calm, white page, one deep green,
   mint section bands, soft card shadows, pill buttons, charcoal footer).
3. Reply with: the branch name, the 13 steps of 01-proposal.md §2 in one line each, and anything unclear.

Rules for the whole job (repeat them to yourself before every step):
- Follow 01-proposal.md exactly: token values, file list and order. Do not invent colours.
- Visual changes only: no changes to data, API calls, routes, server actions, translations' meaning, data-testid
  attributes or visible strings (the e2e tests rely on them). Never touch backend/. The web prompts (1–5) touch
  frontend/ only; mobile/ is changed only by the mobile prompt (Prompt 6), on its own branch.
- No new libraries, no new fonts, no client-side JS libraries; CSS/Tailwind only. No `any`, no unused code.
- Arabic RTL first, English LTR: logical utilities only (ms-/me-/ps-/pe-/start-/end-/text-start); directional icons
  flip with rtl:-scale-x-100. Western digits. Arabic text never below 13px; no uppercase/letter-spacing on Arabic.
- Keep the visible keyboard focus ring, dark mode, print styles, loading/error/empty/disabled states, the «Demo»
  badge, and distinct labels for verified / pending / demo / spent amounts. `give` (saffron) colour only for donate
  actions and funding progress.
- Respect prefers-reduced-motion; CSS transitions 150–300ms only; never `transition: all`.
- Never commit .env, secrets or real phone numbers. Never force-push, never rewrite history, never delete branches.
- After each step: cd frontend && npm run lint && npm test && npm run build — all green before you continue.
  Commit after each prompt with the message I give you.
```

---

## 3 · Prompt 1: tokens and buttons (web)

```
Do steps 1, 2 and 3 of docs/design-research/01-proposal.md §2:
- frontend/tailwind.config.ts: brand scale anchored on #0F6B2F, `gold` and `footer` colours, maxWidth.content
  (75rem), borderRadius.panel (1.25rem), fontSize.read (1.125rem / 1.8), transitionTimingFunction.calm — exact
  values from §1.
- frontend/src/app/globals.css: replace the light and dark variables with the §1 table (new --footer,
  --footer-ink, --footer-muted), add .section-title and .hero-scrim (both directions), update the contrast comment
  with the ratios from 00-summary.md §2. Keep :focus-visible, .skeleton, theme cross-fade and reduced-motion blocks.
- frontend/src/components/ui/Button.tsx: pill buttons (rounded-full); primary bg-brand-600 hover:bg-brand-700 in
  both themes; secondary = 1px border-accent text-accent, hover bg-accent-soft; give/ghost/danger kept;
  transition-colors duration-150 ease-out + active:scale-[0.98]; focus ring unchanged.
Then grep the frontend for hard-coded old values (#18734b, rounded-[28px], dark:bg-brand-600 etc.) and list them
for later steps (do not change pages yet).
Check: lint, test, build green. Open the home page in light and dark (npm run build && npx next start, with the API
running per README) and confirm text is readable and the focus ring is visible (Tab through the header).
Commit: style(web): Ismaili-style design tokens and pill buttons
```

---

## 4 · Prompt 2: campaign card and footer (web)

```
Do steps 4, 5 and 8 of docs/design-research/01-proposal.md §2:
- ui/Card.tsx, StatCard.tsx, Badge.tsx, Tabs.tsx: new shadow token; chips/badges rounded-full bg-accent-soft
  text-accent-strong; active tab gets a 2px underline (not colour only).
- components/campaigns/CampaignCard.tsx: cover zoom on hover (transition-transform duration-300 ease-calm
  group-hover:scale-[1.03] motion-reduce:transform-none) inside overflow-hidden; hover = shadow-lift, remove the
  -translate-y; mint category chip; amounts row separated by border-t. Keep the whole-card link and every
  data-testid (completed-badge).
- app/(public)/layout.tsx: new footer bg-footer text-footer-ink, 3 columns: about the council (existing
  common.council text) · links (campaigns, transparency, council fund, track — reuse existing nav translation keys)
  · a bottom legal row with a transparency link; links text-footer-muted hover:text-white hover:underline
  underline-offset-4; print:hidden kept. If a new translation key is truly needed, add it to BOTH
  frontend/messages/ar.json and en.json.
Check: lint, test, build; look at home at 1440px and 375px, light and dark; no horizontal scroll at 375px.
Commit: style(web): campaign card and footer in the new style
```

---

## 5 · Prompt 3: home hero with a landscape photo and section bands (web)

```
Do step 9a and 9b of docs/design-research/01-proposal.md (§2 and §3).

Image (licence-checked; no people, no religious symbols):
- Download "View from Shmemis Castle" from Wikimedia Commons:
  https://commons.wikimedia.org/wiki/File:View_from_Shmemis_Castle.jpg — licence CC BY-SA 3.0, author Jdowny.
  Open it full size first and confirm there are no people; if there are, use instead the CC0 file
  https://commons.wikimedia.org/wiki/File:--%D9%82%D9%84%D8%B9%D8%A9_%D8%B4%D9%85%D9%8A%D9%85%D9%8A%D8%B3.jpg .
- Using tools already installed (e.g. the e2e Playwright Chrome to draw it on a canvas and export), crop and export
  two WebP files: 1920x800 (≈120 KB) and 750x900 (≈60 KB) into frontend/public/images/hero/. No new dependencies.
- Add the attribution line in the footer: "صورة الواجهة: View from Shmemis Castle — Jdowny, CC BY-SA 3.0, Wikimedia
  Commons" (English: "Hero photo: …"), with links to the file page and the licence. Record it in README too.

Home page (frontend/src/app/(public)/page.tsx):
- Full-bleed hero band: the photo as background (responsive: the 750 version on phones), .hero-scrim on top,
  bg-panel fallback colour, white title and body, CTAs = one primary «تصفح الحملات» (href #campaigns) + one give
  button (the council fund link, keep data-testid="home-fund-cta"); «تتبع طلب مساعدة» becomes a text link.
  Text sits on the inline-start side (right in Arabic) where the scrim is darkest.
- The ledger panel (keep data-testid="platform-ledger" and ledger-transparency-link) moves to a band right under
  the hero, panel radius rounded-panel, gold underline on its title.
- Sections alternate white / bg-surface-muted with py-[clamp(3rem,7vw,5.5rem)], container max-w-content,
  section titles use .section-title. Campaign grid gap-6. Keep campaign-grid, campaign-count, filters and the
  empty state.
Check: lint, test, build; screenshots of home at 1440 and 375, light and dark, Arabic and English: title readable
on the photo, nothing overlaps, LCP image is the WebP.
Commit: style(web): home hero with Salamiyah landscape and section bands
```

---

## 6 · Prompt 4: full checks, screenshots, pull request (web)

```
Run the full verification for branch p31-redesign:
1. frontend: npm run lint, npm test, npm run build (fix any test that only asserted old class names; never weaken
   a behaviour test).
2. backend: npm run build && npm run demo:reset; start the API (node dist/main.js) and the web
   (npx next start -p 3000).
3. e2e: cd e2e && npx playwright test — must be 44 passed, 1 skipped (the LAN test). If anything fails, fix the
   styling cause (never edit tests to hide a real regression), re-run demo:reset + restart the API, run again.
   If you cannot run the e2e here, say so clearly.
4. Screenshots (overwrite) into docs/screenshots/athar/: web-home-light/dark, web-login-light/dark,
   web-home-phone (375px light) and web-home-phone-dark.
5. Stop every server you started; run npm run demo:reset again.
6. Commit the screenshots, push the branch p31-redesign and open a pull request into main titled
   "Redesign: Ismaili-style web". Do NOT merge. In the PR description list what changed, every check result
   (with numbers) and the screenshot paths. Reply with the PR link and stop.
Commit (screenshots): docs(docs): screenshots after the redesign
```

---

## 7 · Prompt 6: mobile in the same style as the web

```
Make the Athar donor app (folder mobile/, Expo SDK 58) match the redesigned web: it is the same product.
Read CLAUDE.md (Mobile rules, UI rules), docs/design-research/01-proposal.md §1 (the web tokens) and
docs/design-research/00-summary.md §2 (contrast). Work on a new branch p33-mobile-style created from
origin/p30-design-research (git fetch first). Touch ONLY mobile/ (and docs/screenshots/athar/mobile-home.png).
No new libraries, no `any`, no unused code.

1. Logo (already the final v2 logo: check, do not redraw or regenerate):
   - mobile/app.json must use: icon ./assets/brand/athar-icon-green.png; ios.icon athar-icon-green-square.png;
     android adaptiveIcon foreground athar-adaptive-foreground.png on #0B3D2A; web favicon athar-icon-green.png;
     expo-splash-screen image athar-logo-white-bg.png on #FFFFFF, dark image athar-logo-dark.png on #0B3D2A.
     Fix anything that differs. Change the top-level "backgroundColor" from #eef2ef to #FFFFFF (new page colour).
   - The header logo in mobile/src/app/_layout.tsx (HeaderLogo, white-word athar-icon-dark.png on the green header)
     stays. Do not touch docs/brand/.
2. Colours: in mobile/src/ui/theme.ts set the palettes to these exact values (same as the web tokens):
   light: page #FFFFFF, surface #FFFFFF, surfaceMuted #EBF2EE, border #E3EAE5, track #DDE7E1, control #6E8278,
          ink #182420, muted #4A5A54, accent #0F6B2F, accentStrong #0B5224, accentSoft #E6F2EC,
          panel #0B3D2A, panelInk #E6F2EC, give #B45512, giveInk #FFFFFF, givePending #FED7AA, seriesSpent #0F6B2F
          (danger, dangerSoft, warning, warningSoft, demo, cover* unchanged).
   dark:  accent #6BCFA5, accentStrong #ACD9C5, accentSoft #163628, panel #0A291D, panelInk #D6ECE1,
          give #F6A34A, giveInk #1A0F05, givePending #8F4211, seriesSpent #6BCFA5 (everything else unchanged).
   Update the doc comment of theme.ts. Then grep mobile/src for hard-coded hex colours (e.g. src/app/transparency.tsx)
   and replace them with palette entries; leave CampaignCover illustration colours as they are.
3. Shapes (like the web): buttons and chips pill-shaped (radius.pill); cards radius 16 (set radius.lg to 16),
   1px border c.border, a soft shadow on light (shadowColor #182420, opacity ~0.12, radius ~16, offset y 8;
   elevation 3 on Android) and no shadow in dark. Since page and surface are now both white in light mode, every
   card MUST keep its 1px border so cards stay visible. Section backgrounds that group content may use surfaceMuted.
   Selected amount / payment choices: border c.accent + background c.accentSoft + a ✓ icon (not colour only).
   Tap targets ≥ 44pt; Arabic text ≥ 13 (type.xs stays 13).
4. Keep: RTL Arabic + English, Western digits, light/dark following the phone, the «Demo» badge, distinct labels for
   verified / pending / demo / spent, the funding bar filling from the reading start, every testID (e2e and the web
   screenshot script use home-fund-cta), all loading/error/empty/disabled states.
5. Check: cd mobile && npx tsc --noEmit && npx expo lint && npx expo install --check && npx expo config --json
   (icons and splash resolve). Then start the API (backend: npm run build && node dist/main.js) and
   CI=1 EXPO_PUBLIC_API_URL=http://localhost:4000 npx expo start --web --port 8081; screenshot the home, a campaign
   page and the donate screen at 375px in light and dark; overwrite docs/screenshots/athar/mobile-home.png with the
   light home. Make sure white cards are distinguishable from the white page and every text is readable.
   Stop every server you started.
6. Commit "style(mobile): same design tokens and shapes as the web", push the branch p33-mobile-style and open a
   pull request into main titled "Redesign: mobile in the same style". Do NOT merge. List the changes, check
   results and screenshots in the PR description. Reply with the PR link and stop.
```

---

## 8 · Prompt 5: extra polish (optional, only if time remains)

```
Do steps 6, 7 and 10 of docs/design-research/01-proposal.md §2 on a new branch p32-redesign-polish created from
p31-redesign (or from main if p31-redesign is already merged):
- components/campaigns/FundingBar.tsx: verified bg-give-700 dark:bg-give-400; pending bg-give-200
  dark:bg-give-800 with a diagonal hatch; 2px gap between segments; demo stripes unchanged; keep the % label,
  role="progressbar", aria values and data-segment attributes. Update the legend swatches to match.
- components/layout/SiteHeader.tsx: container max-w-content; active nav link underlined with aria-current="page"
  (a small client component NavLinks using usePathname; the header stays a server component); sign-in as a
  primary pill. Keep nav-fund and nav-transparency-mobile test ids.
- app/(public)/campaigns/[slug]/page.tsx: rounded-panel; a proof line under the title (beneficiary code(s), area,
  donors count, «حملة موثّقة» — only data that is already public on this page); summary in text-read
  max-w-[68ch]; aside funding card shows the verified amount first, then «من هدف …» as a sentence, then the bar
  and legend.
Then repeat Prompt 4 steps 1–5 (all checks + e2e), commit, push the branch and open a pull request into main
titled "Redesign: polish". Do NOT merge. Reply with the PR link and stop.
Commit: style(web): funding bar contrast, active nav and campaign page polish
```

---

## 9 · Review (optional, at the end)

```
Review the open redesign pull requests (p31-redesign, p33-mobile-style, and p32-redesign-polish if it exists)
against docs/design-research/01-proposal.md §5 "Must keep": go through each bullet and answer pass/fail with
evidence (file:line or screenshot). Check WCAG AA contrast of every new text/background pair with the values in
00-summary.md §2, keyboard focus visible on header, cards, buttons and donate form, 375px with no horizontal
scroll, Arabic and English. Also list every file changed outside frontend/ and mobile/ (there should be none
except docs/screenshots/athar/ and the README attribution line). Do not change code in this message.
```
