# 01 · Redesign proposal: closer to The Ismaili, still Athar

This is a proposal for a later Claude Code session to implement. Nothing here is implemented yet. The evidence and
contrast checks are in `00-summary.md`.

**Scope**
- Changes: tokens, shared UI and public pages.
- Unchanged: data, API, routes, `data-testid`s and wording (e2e relies on text and test ids).
- No new libraries, CSS only.

## 1. The new token set

### `frontend/tailwind.config.ts`

```ts
colors: {
  // Athar green, anchored on the logo green #0F6B2F (≈ The Ismaili's measured #007041).
  brand: {
    50: '#f1f7f3', 100: '#e6f2ec', 200: '#c4e2d0', 300: '#8fcaa8', 400: '#6bcfa5' /* mint, dark accent */,
    500: '#1f8a4c', 600: '#0f6b2f' /* logo green */, 700: '#0b5224', 800: '#0b3d2a' /* logo tile */,
    900: '#082e20', 950: '#05201a',
  },
  // Logo gold: decoration only (underlines, eyebrows on dark panels). Never text on white.
  gold: { 400: '#d9b45a', 500: '#c9a13b', 700: '#8a6a1c' },
  give: { /* unchanged */ },
  // ...semantic cssVar() colours unchanged, plus:
  footer: { DEFAULT: cssVar('--footer'), ink: cssVar('--footer-ink'), muted: cssVar('--footer-muted') },
},
maxWidth: { content: '75rem' },            // 1200px container
borderRadius: { panel: '1.25rem' },         // 20px (was rounded-[28px])
boxShadow: {
  card: 'var(--shadow-card)',
  lift: 'var(--shadow-lift)',
},
transitionTimingFunction: { calm: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
```

Font families stay IBM Plex Sans Arabic + Noto Kufi Arabic. Add `fontSize.read: ['1.125rem', { lineHeight: '1.8' }]`
for story and summary text. The existing size scale is kept, so the 13 px floor stays.

### `frontend/src/app/globals.css`

Values are `R G B`, as today.

| Variable | Light | Dark |
|---|---|---|
| `--page` | `255 255 255` (#FFFFFF) | `14 21 18` (#0E1512) |
| `--surface` | `255 255 255` | `22 32 27` (#16201B) |
| `--surface-muted` (mint band) | `235 242 238` (#EBF2EE) | `17 26 22` (#111A16) |
| `--border` | `227 234 229` (#E3EAE5) | `44 58 51` (#2C3A33) |
| `--track` | `221 231 225` (#DDE7E1) | `58 74 66` (#3A4A42) |
| `--control` | `110 130 120` (#6E8278) | `113 131 122` (#71837A) |
| `--text` | `24 36 32` (#182420) | `236 242 238` (#ECF2EE) |
| `--text-muted` | `74 90 84` (#4A5A54) | `160 176 167` (#A0B0A7) |
| `--ring` | `15 107 47` (#0F6B2F) | `107 207 165` (#6BCFA5) |
| `--accent` | `15 107 47` (#0F6B2F) | `107 207 165` (#6BCFA5) |
| `--accent-strong` | `11 82 36` (#0B5224) | `172 217 197` (#ACD9C5) |
| `--accent-soft` | `230 242 236` (#E6F2EC) | `22 54 40` (#163628) |
| `--danger`, `--warning`, `--info` (+ soft/line) | unchanged | unchanged |
| `--panel` | `11 61 42` (#0B3D2A) | `10 41 29` (#0A291D) |
| `--panel-ink` | `230 242 236` (#E6F2EC) | `214 236 225` (#D6ECE1) |
| `--footer` (new) | `23 33 28` (#17211C) | `10 16 13` (#0A100D) |
| `--footer-ink` (new) | `201 211 206` (#C9D3CE) | `201 211 206` |
| `--footer-muted` (new) | `163 177 170` (#A3B1AA) | `163 177 170` |
| `--series-collected` / `--series-spent` | `180 85 18` (give-700) / `15 107 47` | `246 163 74` (give-400) / `107 207 165` |
| `--shadow-card` | `0 1px 2px rgb(24 36 32 / .04), 0 20px 40px -24px rgb(24 36 32 / .28)` | `0 0 0 1px rgb(255 255 255 / .04)` |
| `--shadow-lift` | `0 24px 48px -20px rgb(24 36 32 / .32)` | `0 0 0 1px rgb(255 255 255 / .08), 0 14px 32px -12px rgb(0 0 0 / .7)` |

Also in `globals.css`:

- **Section underline:**
  ```css
  .section-title::after { content:''; display:block; inline-size:3rem; block-size:2px; margin-block-start:.5rem; background:#C9A13B; }
  ```
  It is decorative. Use `#D9B45A` on panels.
- **Hero scrim, logical direction:**
  ```css
  .hero-scrim { background: linear-gradient(to left, rgb(0 0 0 / .62), rgb(0 0 0 / .25) 55%, transparent); }
  [dir=ltr] .hero-scrim { background: linear-gradient(to right, rgb(0 0 0 / .62), rgb(0 0 0 / .25) 55%, transparent); }
  ```
  The darkest side sits behind the text, which is on the inline-start side.
- **Keep the existing blocks:** `:focus-visible`, `.skeleton`, theme cross-fade and the reduced-motion block all stay
  as they are.

## 2. Files to change, in order

| # | Path | Change | Effort |
|---|---|---|---|
| 1 | `frontend/tailwind.config.ts` | brand scale on `#0F6B2F`, `gold`, `footer` colours, `maxWidth.content`, `borderRadius.panel`, `fontSize.read`, `ease-calm` | 15 min |
| 2 | `frontend/src/app/globals.css` | new light/dark variables (§1), `.section-title`, `.hero-scrim`; update the contrast comment | 20 min |
| 3 | `frontend/src/components/ui/Button.tsx` | `rounded-full`; primary `bg-brand-600 hover:bg-brand-700` (same in dark); secondary = 1 px `border-accent text-accent` and on hover a fill `bg-accent-soft`; keep `give`, `ghost`, `danger`; transitions `transition-colors duration-150 ease-out` + `active:scale-[0.98]`; focus ring unchanged | 15 min |
| 4 | `frontend/src/components/ui/Card.tsx`, `StatCard.tsx`, `Badge.tsx`, `Tabs.tsx` | Card keeps `rounded-2xl`, picks up the new shadow token; badges and chips become `rounded-full bg-accent-soft text-accent-strong`; the active tab gets a 2 px underline (not colour only) | 20 min |
| 5 | `frontend/src/components/campaigns/CampaignCard.tsx` | wrap the cover in `overflow-hidden`, cover `transition-transform duration-300 ease-calm group-hover:scale-[1.03] motion-reduce:transform-none`; card hover = `shadow-lift` (drop `-translate-y`); category chip mint; footer row separated by a `border-t` (Non-profit card shape) | 20 min |
| 6 | `frontend/src/components/campaigns/FundingBar.tsx` | verified `bg-give-700 dark:bg-give-400`; pending = `bg-give-200 dark:bg-give-800` + hatch `bg-[repeating-linear-gradient(135deg,…)]` + `gap-[2px]` between segments; demo stripes as now; % label kept. **Keep `data-segment` attributes.** | 20 min |
| 7 | `frontend/src/components/layout/SiteHeader.tsx` | container `max-w-content`; nav links get an active underline (`aria-current="page"` + `border-b-2 border-accent`). This needs the pathname, so it becomes a small client `NavLinks` child; the header itself stays a server component. Sign-in becomes a `primary` pill; language and theme stay quiet icon buttons. | 30 min |
| 8 | `frontend/src/app/(public)/layout.tsx` | new footer: `bg-footer text-footer-ink`, 3 columns (about the council · links: campaigns, transparency, council fund, track · contact/legal row with «تقرير الشفافية»), links `text-footer-muted hover:text-white underline-offset-4 hover:underline` | 25 min |
| 9 | `frontend/src/app/(public)/page.tsx` | (a) **hero**: full-bleed band with the landscape image (§3) as a CSS background + `.hero-scrim`, white title and body, CTA hierarchy = one `primary` («تصفح الحملات») + one `give` («تبرع لصندوق المجلس العام», keeps `data-testid="home-fund-cta"`), «تتبع طلب مساعدة» as a text link; the ledger panel moves to a band directly under the hero (keeps `data-testid="platform-ledger"`); (b) sections alternate white / `bg-surface-muted`, padding `py-[clamp(3rem,7vw,5.5rem)]`, titles get `.section-title`; (c) optional **spotlight**: the first URGENT campaign in a wide card with a label/value table (collected · spent · remaining · beneficiaries) | 60–75 min |
| 10 | `frontend/src/app/(public)/campaigns/[slug]/page.tsx` | panel radius `rounded-panel`; under the title a **proof line**: beneficiary code(s), area, donors and «حملة موثّقة» with icons (Madad); summary in `text-read max-w-[68ch]`; aside funding card **amount first**, then «من هدف …» as a sentence, then the bar and its legend | 30 min |
| 11 | `frontend/src/components/donate/DonateFlow.tsx` | amount and method choices as pills: selected = `border-accent bg-accent-soft` + ✓ icon (not colour only); tap targets ≥ 44 px; the submit stays `give` and full-width on phones | 25 min |
| 12 | `frontend/src/app/(auth)/login/page.tsx`, `receipts/[no]/page.tsx`, `(app)` layout | `rounded-[28px]` → `rounded-panel`; panel colour follows the token; gold underline on the panel title | 15 min |
| 13 | Checks | `npm run lint` · `npm test` (snapshot/class tests may need updating) · `npm run build` · e2e after `demo:reset` · light and dark screenshots at 1440 / 375 into `docs/screenshots/athar/` | 30 min + 15 min e2e |

**Total ≈ 5–5.5 h** for everything, or **≈ 2.5 h for the "must" set** (§6).

## 3. Hero and section images

None of the reference images may be reused:
- Behance projects are "All rights reserved".
- The Ismaili's terms allow non-commercial use with credit and no changes, and most of its images show people or
  religious buildings.

Nothing was downloaded into `images/candidates/`. Use these free-licence photos instead. They show local landscape and
architecture, with no people and no religious symbols. Each must still be checked at full size before use. If it is
used, credit it in the footer or on an «حقوق الصور» line, and keep the CC BY-SA licence on any edited version.

| Use | Image | Licence | Attribution text |
|---|---|---|---|
| **Hero (first choice)** | [View from Shmemis Castle](https://commons.wikimedia.org/wiki/File:View_from_Shmemis_Castle.jpg): wide hazy plain near Salamiyah, low contrast, good under a scrim (3648×2056); viewed, no people | CC BY-SA 3.0 | "View from Shmemis Castle" by Jdowny, CC BY-SA 3.0, via Wikimedia Commons |
| Hero (alternative) | [Ash Shmemis castle](https://commons.wikimedia.org/wiki/File:Ash_Shmemis_castle.jpg): basalt ruins in warm evening light (2048×1536); viewed, no people | CC BY-SA 3.0 | "Ash Shmemis castle" by Heretiq, CC BY-SA 3.0, via Wikimedia Commons |
| Hero (no attribution needed) | [قلعة شميميس](https://commons.wikimedia.org/wiki/File:--%D9%82%D9%84%D8%B9%D8%A9_%D8%B4%D9%85%D9%8A%D9%85%D9%8A%D8%B3.jpg): castle on the extinct volcano with trees (4128×3096) | CC0 1.0 | none required; credit Wikimedia Commons as a courtesy |
| Section band (impact / ledger) | [Olive groves in Syria](https://commons.wikimedia.org/wiki/File:Olive_groves_in_Syria.jpg) | CC BY 3.0 DE | "Olive groves in Syria" by High Contrast, CC BY 3.0 DE, via Wikimedia Commons (not yet viewed: check for people) |
| Section texture | [Polygonal sandstone and limestone wall](https://commons.wikimedia.org/wiki/File:Polygonal_sandstone_and_limestone_wall.jpg) | CC0 | none required |
| Spotlight / empty states | [Seedlings in tilled soil](https://unsplash.com/photos/seedlings-sprout-from-the-freshly-tilled-earth-v_rgqR0vvOE) by Hannes Knutsson | Unsplash License | "Photo by Hannes Knutsson on Unsplash" (not viewed by the agents: check for hands) |

**Delivery**
- Pre-crop the chosen image to 1920×800 and 750×900, export as WebP at about 120 KB and 60 KB, and place it in
  `frontend/public/images/hero/`.
- Use `next/image` with `priority` and `sizes="100vw"`, or a CSS `image-set()` background.
- Use a solid `bg-panel` fallback colour while it loads.
- No autoplay or parallax.
- Campaign covers stay illustrations (CLAUDE.md).

## 4. Motion (CSS only)

- **Buttons:** `transition-colors duration-150 ease-out` and `active:scale-[0.98]`. No sliding fills, because their
  direction would need mirroring.
- **Cards:** cover `scale(1.03)` over 300 ms `ease-calm`, plus a shadow change to `shadow-lift` over 200 ms. No
  translate.
- **Funding bar:** the existing `grow` animation and width transition stay as they are.
- **Links:** underline appears on hover (`underline-offset-4`) with a colour change at 150 ms.
- **Reduced motion:**
  - Everything above is decoration. The global `prefers-reduced-motion: reduce` block in `globals.css` already sets
    durations to 0.01 ms.
  - Also add `motion-reduce:transform-none` on the scale effects.
  - Never use `transition: all`.

## 5. Must keep (acceptance list)

- Arabic RTL first and English LTR. Use logical utilities only (`ms-/me-/ps-/pe-/start-/end-`, `text-start`).
  Directional icons flip with `rtl:-scale-x-100`. The progress bar grows from the reading start.
- Western digits everywhere (`formatMoney` and `formatNumber` as today) and `tabular-nums` on amounts.
- A visible keyboard focus ring on every interactive element in both themes (`--ring`). Don't copy The Ismaili's
  removed outlines.
- Loading (`.skeleton`, `loading.tsx`), error (`error.tsx`), empty (`EmptyState`) and disabled (`disabled:opacity-60
  pointer-events-none`) states, all restyled but not removed.
- Distinct text labels for verified, pending, demo and spent amounts. The bar's three segments stay distinguishable
  without colour (hatch for pending, stripes for demo). The «Demo» badge stays on every simulated payment.
- `give` only on donate actions and funding progress.
- Arabic text ≥ 13 px; no uppercase or letter-spacing on Arabic labels.
- Mobile layouts at 375 px: no horizontal scroll, 44 px tap targets, the donate CTA full-width on phones.
- All `data-testid`s and visible strings the e2e suite relies on (`home-fund-cta`, `platform-ledger`,
  `campaign-grid`, `campaign-count`, `nav-fund`, `nav-transparency-mobile`, `ledger-transparency-link`,
  `completed-badge`, `official-receipt`, `data-segment` …).
- The e2e suite stays green: 44 passed, 1 skipped.
- Dark mode, the theme toggle and print styles for receipts.
- Low bandwidth: one compressed hero image, no new fonts and no client libraries.

## 6. If time is short (deadline today 16:00)

**Must (≈ 2.5 h): the visible "Ismaili feel"**
- Steps **1–3** (tokens and buttons).
- Step **5** (campaign card).
- Step **8** (footer).
- Step **9a and 9b** (hero image with scrim, white/mint bands, section underlines).
- Step **13** (checks).

**Should (≈ 1.5 h)**
- Step **6** (funding bar contrast fix, a real AA gap today).
- Step **7** (active nav underline).
- Step **10** (campaign page proof line and reading column).

**Can skip**
- Step 9c (spotlight).
- Step 11 (donate pills).
- Step 12 (panel radius elsewhere).
- Linking the transparency stat tiles.
- The full-screen mobile menu.

**Never do under time pressure**
- Renaming test ids or copy.
- Adding a carousel, parallax or a new font.
