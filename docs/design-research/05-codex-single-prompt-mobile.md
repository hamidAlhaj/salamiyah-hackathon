# برومت واحد لـ Codex: تصميم الموبايل بنفس أسلوب الويب (The Ismaili)

انسخ الكتلة اللي تحت برسالة وحدة بمحادثة Codex جديدة. الويب الجديد صار على main، وهالبرومت بيخلّي تطبيق الموبايل
بنفس الألوان والأشكال.

- **الوقت المتوقع:** ≈ 45–75 دقيقة مع الفحوص.
- **آخر الشغل:** Codex بيفتح Pull Request وما بيدمج.

```
You are restyling the Athar («أثر») donor mobile app — Expo SDK 58, folder mobile/ — in the repo
hamidAlhaj/salamiyah-hackathon, so it matches the redesigned web on main (inspired by The Ismaili website:
calm, institutional, white page, ONE deep green, mint tints, green-tinted neutral text, soft card shadows,
pill buttons). It is the same product: web and mobile must look like one brand. Mobile only.

== 0. Setup and rules ==
- git fetch; create branch p33-mobile-style from origin/main.
- Read fully: CLAUDE.md (project rules; treat it as AGENTS.md — it overrides your defaults; read "Mobile rules"
  and "UI rules" twice). Look at the web for reference: frontend/src/app/globals.css (tokens),
  frontend/src/components/ui/Button.tsx, frontend/src/components/campaigns/CampaignCard.tsx, and the screenshots
  docs/screenshots/athar/web-home-phone.png and web-home-phone-dark.png (the target look on a phone).
- Change files ONLY under mobile/ (plus docs/screenshots/athar/mobile-home.png). Never touch frontend/, backend/,
  e2e/, docs/brand/, any package.json / package-lock.json, app config other than mobile/app.json, .env, CLAUDE.md.
- Visual changes only: do not change texts or their meaning, testID props, routes, API calls, auth/token handling
  or logic. No new libraries, no new fonts (keep IBM Plex Sans Arabic + Noto Kufi Arabic), no `any`, no unused
  code, no duplicated components — edit mobile/src/ui/theme.ts and mobile/src/ui/components.tsx first, screens
  only where they hard-code styles.
- Must keep: Arabic RTL + English, Western digits, light/dark following the phone setting, the «Demo» badge,
  distinct labels for verified / pending / demo / spent amounts, the funding bar filling from the reading start,
  every testID (home-fund-cta and others used by tests/scripts), all loading/error/empty/disabled states,
  Arabic text ≥ 13 (type.xs stays 13), tap targets ≥ 44pt, screen-reader labels.
- Git: commit after each phase with the message given. NEVER merge into main, never push to main, never
  force-push, never rewrite history, never delete branches, never commit secrets or phone numbers.
- After EACH phase run: cd mobile && npx tsc --noEmit && npx expo lint. Both green before the next phase.
  If you cannot run something, say exactly what and why — never claim it passed.

== 1. Colours (mobile/src/ui/theme.ts) — exactly the web tokens on main ==
light: page #FFFFFF, surface #FFFFFF, surfaceMuted #EBF2EE, border #E3EAE5, track #DDE7E1, control #6E8278,
       ink #182420, muted #4A5A54, accent #0F6B2F, accentStrong #0B5224, accentSoft #E6F2EC,
       panel #0B3D2A, panelInk #E6F2EC, give #B45512, giveInk #FFFFFF, givePending #FED7AA,
       seriesSpent #0F6B2F. Keep danger, dangerSoft, warning, warningSoft, demo and cover* as they are.
dark:  page #0E1512, surface #16201B, surfaceMuted #111A16, border #2C3A33, track #3A4A42, control #71837A,
       ink #ECF2EE, muted #A0B0A7 (all as today), accent #6BCFA5, accentStrong #ACD9C5, accentSoft #163628,
       panel #0A291D, panelInk #D6ECE1, give #F6A34A, giveInk #1A0F05, givePending #8F4211,
       seriesSpent #6BCFA5. Keep the rest.
- Update the doc comment at the top of theme.ts (same tokens as frontend/src/app/globals.css).
- grep mobile/src for hard-coded hex colours (e.g. src/app/transparency.tsx) and replace them with palette
  entries; leave CampaignCover illustration colours as they are.
- mobile/app.json: top-level "backgroundColor" #eef2ef → #FFFFFF. Do NOT change icon, adaptiveIcon, splash or
  favicon entries (the final logo v2 is already wired); just confirm with npx expo config --json that they resolve.
Commit: style(mobile): same colour tokens as the web

== 2. Shapes and components (mobile/src/ui/components.tsx, then screens) ==
- radius in theme.ts: sm 10, md 12, lg 16, pill 999.
- Buttons: pill shape (radius.pill), min height 48; primary = accent background, white text; donate = give
  background with giveInk text (give only for donate actions and funding progress); secondary = 1px accent border,
  accent text, transparent background; pressed state = darker (accentStrong) or opacity 0.85, no layout jump;
  disabled = opacity 0.6.
- Cards: radius 16, 1px border c.border, surface background; light mode soft shadow (shadowColor #182420,
  shadowOpacity 0.12, shadowRadius 16, shadowOffset {0, 8}; Android elevation 3); dark mode: no shadow, border
  only. Page and surface are both white in light mode, so every card MUST keep its border.
- Chips/badges/category tags: pill, accentSoft background, accentStrong text, 13+ size, weight 600.
- Selected choices (donation amount, payment method, collection point): border 1.5px c.accent + background
  c.accentSoft + a ✓ icon (not colour only); unselected: border c.border.
- Section headings: Noto Kufi display font, and a short gold underline under main section titles on the home
  screen (2 × 32, colour #C9A13B in light / #D9B45A in dark) — decoration only, never gold text.
- Group sections on the home screen with surfaceMuted bands where it helps scanning (e.g. the open-ledger /
  transparency summary), generous vertical spacing (24–32 between sections, 16 inside cards).
- Header stays the deep-green panel with the white-word logo (HeaderLogo in src/app/_layout.tsx) — do not change it.
- Funding bar: verified = give, pending = givePending, demo stays as is; keep the text percentage and labels.
Commit: style(mobile): pill buttons, cards and chips like the web

== 3. Verify, screenshots, pull request ==
1. cd mobile && npx tsc --noEmit && npx expo lint && npx expo install --check && npx expo config --json.
2. Start the API (cd backend && npm run build && npm run demo:reset && node dist/main.js; local PostgreSQL per
   README) and Expo web: cd mobile && CI=1 EXPO_PUBLIC_API_URL=http://localhost:4000
   EXPO_PUBLIC_SITE_URL=http://localhost:3000 npx expo start --web --port 8081.
3. Screenshot at 375×812 in light and dark: home, a campaign page, the donate screen, my donations. Look at them
   yourself: white cards clearly separated from the white page, every text readable, selected states visible
   without colour, nothing clipped in Arabic and English. Overwrite docs/screenshots/athar/mobile-home.png with
   the light home; keep the others only in the PR description (attach or describe), not in the repo.
4. Stop every server you started; run cd backend && npm run demo:reset again.
5. Commit "docs(docs): mobile screenshot after the redesign", push p33-mobile-style and open a pull request into
   main titled "Redesign: mobile in the same style as the web". Do NOT merge. In the description: what changed,
   every check result, anything you could not run.
Reply with the PR link and a short summary, then stop.
```
