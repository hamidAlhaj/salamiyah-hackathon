# 00 · Design research summary: Athar vs The Ismaili and four references

Branch `p30-design-research`, 24 Nov 2026. Analysis only: no app code changed.

**Sources**
- Reference reports: `01-the-ismaili.md` (primary, measured CSS), `02-nonprofit-community.md`,
  `03-hyperactive-charity.md`, `04-madad-template.md`, `05-muslim-support-foundation.md`. Screenshots are in `shots/0N/`.
- Our values are read from `frontend/tailwind.config.ts`, `frontend/src/app/globals.css`, `components/ui/*`
  (Button, Card), `components/campaigns/*` (CampaignCard, FundingBar), `components/layout/SiteHeader.tsx`,
  `app/(public)/layout.tsx`, `app/(public)/page.tsx` and `app/(public)/campaigns/[slug]/page.tsx`. Logo values come
  from `docs/brand/v2/`.

**Measured vs observed**
- **The Ismaili:** every value is *measured CSS* (`getComputedStyle` and its stylesheets).
- **The four Behance pages:** values are *observed in image*. Colours were sampled from pixels (±4–10 per channel),
  plus the swatches the designers printed in their own presentations.

**Limitations**
- Behance refused headless Chrome on all four pages (HTTP 400/403). The agents did not try to get around this. They
  used a visible Chrome window or the app's browser pane, plus the project images Behance's CDN serves publicly.
- None of the Behance projects has a real mobile layout except Madad, so their 375 px shots are scaled desktop images.
- The Hyperactive project's Vimeo demos were blocked, so its hover and motion behaviour could not be observed.
- The.ismaili rendered in light mode only.

## 1. Token comparison

| Token | Ours now | The Ismaili (measured) | Other refs (observed) | Recommendation |
|---|---|---|---|---|
| **Primary colour** | brand-600 `#18734b`, hover `#135b3c` | one green: `#007041` (token `#046f44`), the only accent on screen | Hyperactive `#075D44`; Madad teal `#0E5E5B`; Non-profit olive `#676931` | Anchor the brand on the **logo green `#0F6B2F`**, which is within a few steps of The Ismaili's `#007041`. Hover `#0B5224`. Keep one accent only. |
| **Tinted band / soft** | surface-muted `#eff5f1`, accent-soft `#e1f4e9` | mint band `#ebf2ee`, chips `#e6f4ef`, section bg ≈`#ebf4f0` | Madad sand `#F6F0E4`, Non-profit `#f7f7f5` | Mint **`#EBF2EE`** for section bands and **`#E6F2EC`** for chips and selected states. These are tints of our own green, like The Ismaili's. |
| **Page** | `#f6f9f7` (mint-white) | `#ffffff` | white (all four) | **`#FFFFFF`** page with white cards. Separate them with the mint band and hairline borders, not a grey page. |
| **Ink** | `#0d1c15` | `#1d1d1d` body, `#182420` titles (green-black) | `#0A2A2A` Madad ink | **`#182420`**: green-tinted near-black, as in The Ismaili's newer components. |
| **Muted text** | `#45574e` | `#4a5a54` excerpts; `#6b7280` and `#828282` meta (the latter fails AA) | greys ≈`#6a6a6a`, `#696969` (fail AA at small sizes) | **`#4A5A54`** (7.3:1 on white). Never use their lighter greys. |
| **Border** | `#dee7e2` | `#e3eae5` card border | `#E6E8EC` (Hyperactive) | **`#E3EAE5`**. |
| **Footer** | page colour, one line of text | charcoal `#272727`, links `#818181` (fails AA), 2 px underline bars `#3a4b39` | Non-profit `#181818`; MSF 4 columns plus a "Transparency report" link | Green-charcoal **`#17211C`** footer with `#C9D3CE` / `#A3B1AA` text (AA), 3–4 columns, and a transparency link. |
| **Brand panel** | `#0e4a33` light / `#0a291d` dark | dark photo scrims, no flat panel | Madad ink `#0A2A2A` | **`#0B3D2A`**, the logo tile colour, so panels and the app icon match. |
| **Gold** | not used | token `#d99a26` exists but was never seen rendered | Madad saffron `#F2A33A` reserved for donate | Logo gold **`#C9A13B` / `#D9B45A`** for decoration only: hairline underlines and the eyebrow on dark panels. It is never text on white (2.4:1). |
| **Give (donate)** | give-700 `#b45512` button, give-600 bar | none | Madad saffron used only for donate; Hyperactive pink used only for donate | **Keep** our `give` scale and its "donate only" rule (it matches Madad and Hyperactive). Use give-700 for the verified bar (3.9:1 against the track). |
| **Fonts** | IBM Plex Sans Arabic (body) + Noto Kufi Arabic (display) | Montserrat + Open Sans (Latin only); Noto Naskh Arabic for their Arabic editions | Madad: Alexandria + IBM Plex Sans Arabic; MSF: DM Sans | **Keep ours.** No reference font has Arabic glyphs except Madad's Plex, which we already use. Copy the *scale*, not the faces. |
| **Body size** | 16 px / 1.75 | 16 px UI; **18 px / 1.7** reading text, ≈68ch column | MSF 48/32/20 scale | 16 px UI, **18 px / 1.8** for campaign stories and summaries (Arabic needs the taller line-height), max 68ch. |
| **Headings** | 5xl 48 px / 1.25 hero, Kufi bold | hero 48 px / 600, section 32 px / 400–700, card title 19.2 px / 600 | MSF 48/32/20 | Keep 48 px hero and 30–32 px section titles; card title 18–19 px. Add a **2 px, 48 px-wide gold underline** under section titles (The Ismaili uses a green one). |
| **Eyebrow** | `text-sm text-accent` | 11–11.5 px uppercase, letter-spacing 0.08–0.12em | dot-plus-label (Non-profit), chip (MSF) | Eyebrow at **13 px, weight 600, no uppercase or tracking** (Arabic has no case, and tracking breaks letter joins), shown as a mint chip. |
| **Container** | `max-w-6xl` 1152 px | 1240 px (content 1216) | MSF ≈1320 px | **1200 px** (`max-w-[75rem]`). A bit wider, still calm. |
| **Grid gap** | `gap-5` 20 px | 24 px, 3 columns | 24–32 px | **24 px** (`gap-6`). |
| **Section spacing** | `pb-14` / `py-12` | `clamp(2rem, 6vw, 4rem)` | ≈90–100 px bands (MSF) | Section padding **`clamp(3rem, 7vw, 5.5rem)`** with alternating white and mint bands. |
| **Card radius** | `rounded-2xl` 16 px; 28 px on panels | 16 px cards, 10 px on home | 16–24 px | **Keep 16 px.** Reduce panels from 28 px to **20 px**. |
| **Button radius** | `rounded-xl` 12 px | pills (`50px` / `9999px`) | pills in all four | **Pill (`rounded-full`)** for buttons, chips and the language switch. Inputs stay 10–12 px. |
| **Shadow** | card `0 1px 2px …/.04, 0 4px 14px -6px …/.1` | `0 20px 40px -24px rgba(24,36,32,.28)`, hover `0 24px 48px -20px rgba(24,36,32,.32)` | flat (Non-profit), soft (Madad) | Adopt The Ismaili's card shadow and hover values exactly. Dark mode keeps outlines. |
| **Motion** | `transition duration-150`, `active:scale-[.98]`, card `-translate-y-0.5` 200 ms; reduced motion honoured globally | CTA `scale(1.03)` 0.2 s; card image `scale(1.03)` 0.35 s; outline-button fill slides 0.4 s; `transition: all .5s` on 92 elements; only 6 reduced-motion blocks | Hyperactive: not observable | Keep our CSS-only 150–200 ms `ease-out` transitions. Add card-cover `scale(1.03)` over 300 ms and a button colour fill. No sliding fills (direction-dependent), no `transition: all`. |
| **Focus** | 2 px ring `--ring`, offset 2 | **none visible** on buttons and links (fails WCAG 2.4.7) | not shown | **Keep ours.** Ring = brand green in light mode and mint `#6BCFA5` in dark mode. |
| **Dark mode** | full token set | not rendered | none | Keep, re-tuned to the new tokens (§2). |

## 2. Contrast checks (WCAG 2.x, computed)

AA requires 4.5:1 for normal text and 3:1 for large text and UI parts. Every pair below is a proposed text/background
pair from `01-proposal.md`.

**Light mode**

| Pair | Ratio | Result |
|---|---|---|
| ink `#182420` on page / surface `#FFFFFF` | 16.01 | AA |
| ink on mint band `#EBF2EE` | 14.08 | AA |
| muted `#4A5A54` on `#FFFFFF` | 7.29 | AA |
| muted on mint band | 6.41 | AA |
| muted on chip `#E6F2EC` | 6.34 | AA |
| accent / link `#0F6B2F` on `#FFFFFF` | 6.64 | AA |
| accent on mint band | 5.84 | AA |
| accent-strong `#0B5224` on chip `#E6F2EC` | 8.14 | AA |
| white on primary button `#0F6B2F` | 6.64 | AA |
| white on primary hover `#0B5224` | 9.35 | AA |
| white on give-700 `#B45512` (donate) | 4.94 | AA |
| white on give-800 `#8F4211` (donate hover) | 7.11 | AA |
| gold text `#8A6A1C` on white (only if gold text is ever needed) | 5.05 | AA |
| gold `#C9A13B` on white | 2.43 | **fail**: decoration only, never text |
| danger `#A8241A` on white / on `#FDECE9` | 7.16 / 6.26 | AA |
| warning `#85460B` on `#FEF3DB` | 6.62 | AA |
| info `#0F4C6E` on `#E4F1F8` | 8.00 | AA |
| input outline `#6E8278` on white / on mint | 4.10 / 3.60 | UI ≥ 3 ✔ |
| focus ring `#0F6B2F` on white | 6.64 | UI ✔ |

**Panel and footer (both themes)**

| Pair | Ratio | Result |
|---|---|---|
| white on panel `#0B3D2A` | 12.24 | AA |
| panel-ink `#E6F2EC` on panel | 10.66 | AA |
| gold `#D9B45A` on panel (eyebrow or underline) | 6.20 | AA |
| mint `#6BCFA5` on panel | 6.47 | AA |
| footer text `#C9D3CE` on `#17211C` | 10.78 | AA |
| footer links `#A3B1AA` on `#17211C` | 7.42 | AA |
| hero text on a 60 % black scrim (≈`#3D3D3D` at the darkest photo area) | 10.86 | AA |

**Dark mode**

| Pair | Ratio | Result |
|---|---|---|
| ink `#ECF2EE` on page `#0E1512` / surface `#16201B` | 16.31 / 14.72 | AA |
| muted `#A0B0A7` on page / surface | 8.16 / 7.37 | AA |
| accent `#6BCFA5` on page / surface | 9.78 / 8.83 | AA |
| accent-strong `#ACD9C5` on chip `#163628` | 8.47 | AA |
| white on primary button `#0F6B2F` / hover `#0B5224` | 6.64 / 9.35 | AA |
| white on `#138A3D` (a brighter hover) | 4.44 | **fail**: so the dark hover stays `#0B5224` |
| white on give-700 | 4.94 | AA |
| danger `#FCA5A5` on page | 9.75 | AA |
| warning `#FCD34D` on surface | 11.59 | AA |
| input outline `#71837A` on surface | 4.16 | UI ✔ |
| focus ring `#6BCFA5` on page | 9.78 | UI ✔ |
| dark footer text `#C9D3CE` on `#0A100D` | 12.53 | AA |

**Funding bar (UI part, 3:1 against its neighbours)**
- **Today:** the verified segment give-600 `#D96F1A` measures **2.66:1** against the track. This is a pre-existing gap.
- **Proposal:** verified = **give-700 `#B45512`** (3.91:1, light) and **give-400 `#F6A34A`** (4.58:1 against the dark
  track).
- **Pending:** a light give tint can't reach 3:1 against both the verified segment and the track. So pending keeps its
  tint and gets a **diagonal hatch** plus a 2 px surface gap between segments. The amounts stay in text with distinct
  labels («متحقق منه» / «بانتظار التحقق» / «تجريبي» / «صُرف»), which satisfies WCAG 1.4.11 because the text carries
  the information.

## 3. Reference → pattern → our component

| Ref | Observed pattern | Our component | Decision |
|---|---|---|---|
| Ismaili | One green plus mint tints of it; green-tinted neutrals | `globals.css` tokens | **Adopt** |
| Ismaili | Card: 1 px `#e3eae5`, 16 px radius, soft deep shadow, green category chip, image `scale(1.03)` on hover | `CampaignCard`, `Card` | **Adopt** |
| Ismaili | Full-bleed hero photo with dark gradient scrims; white title | `(public)/page.tsx` hero | **Adopt, adapted:** a landscape photo (no people), the scrim on the *inline-start* side via logical gradient direction, the ledger panel kept beside it |
| Ismaili | Mint band behind secondary sections; 2 px short underline under section titles | home sections, `campaigns/[slug]` | **Adopt** (underline in logo gold) |
| Ismaili | 18 px / 1.7 reading column ≈68ch | campaign summary and updates | **Adopt** (1.8 line-height for Arabic) |
| Ismaili | Charcoal multi-column footer | `(public)/layout.tsx` footer | **Adopt** (green-charcoal, AA link colours) |
| Ismaili | Full-screen mobile menu, language switch pinned at the bottom | `SiteHeader` (phones) | **Adopt if time allows** (CSS-only `<details>` drawer, no new JS library) |
| Ismaili | Header hides on scroll and floats transparent over photos | `SiteHeader` | **Skip**: it moves under the reader and loses contrast; keep our solid sticky header |
| Ismaili | Uppercase tracked 10–11 px eyebrows; `#828282` / `#818181` grey text; no focus ring; `transition: all .5s`; left-to-right sliding button fill | — | **Skip**: no case in Arabic, letter-spacing breaks joins, contrast fails AA, focus is invisible, slow transitions, the slide is direction-bound |
| Non-profit | Trust first: hero → mission → one spotlight campaign → category tiles → impact band → listing | home page order | **Adopt partly:** hero → impact band (our ledger) → **one spotlight campaign** (most urgent) → listing. Mission text is skipped for time. |
| Non-profit | Section header: eyebrow + big heading on the start side, 2-line intro on the end side | home sections | **Adopt** (mirrors cleanly with grid and logical alignment) |
| Non-profit | Label/value table on featured items | spotlight card | **Adopt** (collected / spent / remaining / beneficiaries, with our funding bar) |
| Non-profit | Carousel listing; ↗ arrows; light grey 13 px body text | — | **Skip**: keyboard and screen-reader cost, a direction-bound arrow, fails AA |
| Hyperactive | At most two filled pills per view: primary green plus donate in its own colour; everything else is a whole-card link or plain text | `Button`, home hero CTAs | **Adopt**: hero gets one primary («تصفح الحملات») and one give («تبرع لصندوق المجلس العام»); «تتبع طلب مساعدة» becomes a text link |
| Hyperactive | Whole card is one link with a corner arrow; underline on the current nav item | `CampaignCard` (already whole-card), `SiteHeader` nav | **Adopt**: underline on the active nav item; the arrow uses a chevron that flips with `rtl:-scale-x-100` |
| Hyperactive | Stat tiles that link to their evidence | `/transparency` stat cards | **Adopt if time allows** |
| Hyperactive | Condensed all-caps display font; sage `#71A888` text (2.7:1); colour-only states | — | **Skip** |
| Madad | Phone campaign page as stacked cards: chips → title → proof line (donors, place, verified code) → funding card (amount first, target as a sentence) → separate quick-donate card | `campaigns/[slug]/page.tsx` aside, `donate` page | **Adopt:** proof line with beneficiary code and «حملة موثّقة»; amount-first funding card. The quick-donate card already exists as the donate page; its amount chips get the selected-state style (border, mint tint, ✓). |
| Madad | Saffron reserved for donate | `give` rule | **Already ours**, keep it |
| Madad | Eastern Arabic numerals, 11–12 px labels, 24–40 px tap targets, bar without a % label | — | **Skip**: we keep Western digits, a 13 px floor, 44 px targets, and a visible percentage |
| MSF | Header: logo at start, 4 centred links, active link underlined, one donate pill at the end; language and sign-in as quiet items before it | `SiteHeader` | **Adopt** (we already have this order; add the underline and pill shape) |
| MSF | Alternating white / `#F9F9F9` bands of ≈90–100 px; chip, heading, intro, grid | home and transparency sections | **Adopt** (white / mint bands) |
| MSF | Footer legal row with a "Transparency report" link | footer | **Adopt** |
| MSF | `OUR_FOCUS` snake-case labels, lime text on white (1.8:1), 9–12 px text, Light-weight grey headings, mosque and crescent imagery | — | **Skip** |

## 4. Direction

- **Stay closest to The Ismaili.** Calm and institutional: a white page, one deep green with mint tints, green-tinted
  neutrals, generous section spacing, soft deep card shadows, pill buttons, a reading column for stories and a
  charcoal footer.
- **Keep what makes us Athar.** The logo's green `#0F6B2F` replaces our brand-600 (they are close). Logo gold appears
  only as decoration on dark panels and as section underlines. The `give` saffron stays reserved for donations.
- **What we are not doing.** No colour is called "official" unless it was measured. The Ismaili's gold token
  `#d99a26` was never rendered, so we use our logo gold, not theirs. We do not copy The Ismaili's logo, photos, fonts
  or wording.
- **What we keep from our own system.** Arabic fonts, the 13 px floor, the focus ring and reduced-motion handling all
  stay ours, because the references are weaker on each.
- **Images.** None from the five references is reusable: all rights reserved, The Ismaili's terms allow
  non-commercial use with no changes, and most show people or religious buildings. Use Wikimedia Commons
  CC0 / CC BY-SA photos of Salamiyah's landscape instead (see `01-proposal.md` §3).
