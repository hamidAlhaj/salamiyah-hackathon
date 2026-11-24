# 01 · The Ismaili (https://the.ismaili/) — palette & identity reference

Research date: 2026-11-24. Analysis only; nothing here is a build decision yet.

## 1. Method & limitations

- **Tooling:** Playwright (`e2e/node_modules/@playwright/test`) driving the installed Chrome, headless, light colour scheme.
  Viewports 1440×900 (desktop) and 375×812 (mobile, `isMobile` + touch). Cookie banner: clicked **"Reject all"**.
  No login, no form submission.
- **Pages:** home `https://the.ismaili/nl/en` (the root redirects to a country/language edition; Netherlands/English was
  served), listing `…/nl/en/news/features`, detail `…/nl/en/news/built-to-welcome-the-ismaili-center-houston-s-first-year`.
- **Measurements:** every visible element walked with `getComputedStyle` (≈690 elements on home, ≈375 on the listing page,
  ≈440 on the detail page) and colours/fonts/radii/shadows/transitions tallied. CSS variables come from the 9 first-party
  stylesheets (`/assets/css/*.css`, `/static/css/main.d5814673.css` + block chunks), fetched as text and regexed for `--vars`,
  plus `getComputedStyle(:root)` for the runtime values. Hover/focus states were read before and after `hover()` / `focus()`.
  **All values below are measured CSS** unless explicitly marked otherwise.
- **Limitations:**
  - The first pass ran before the client-side app had rendered (blank hero, only 9 text nodes counted). It was discarded and
    re-run with `networkidle` + 3 s wait. Playwright's `page.screenshot` then hung on this page (fonts/animation wait),
    so screenshots were taken with CDP `Page.captureScreenshot` (viewport + 3 scroll positions + bottom) instead of full-page shots.
  - The header is `position: fixed` and **slides out of view on scroll-down**. A "scrolled header" screenshot came out blank,
    so it was not kept.
  - Keyboard-only focus was approximated (programmatic `focus()` + key press so that `:focus-visible` matched). A real Tab
    walk landed on an off-screen element, so that screenshot was not kept either.
  - The site ships three CSS systems at once: Tailwind v4 tokens, Bootstrap 5 (`--bs-*`) and PrimeReact (`--p-*`, colour scales).
    Many variables are framework defaults and never appear on screen. The tables below keep only the site's own tokens and
    the colours that were actually measured on rendered elements.
  - The hero carousel rotates, so the hero image in the screenshots depends on capture time.
  - Wikimedia rate-limited (HTTP 429) one visual check, and Unsplash blocks headless browsers ("Something went wrong").
    Those licences were checked with WebFetch and the Commons API instead (noted per row).

## 2. CSS variables (site-specific, measured CSS)

Runtime `:root` values (getComputedStyle):

| Variable | Value | Notes |
|---|---|---|
| `--primary-color` | `#046f44` | runtime value (CSS file also has a `#14b8a6` teal default that is overridden) |
| `--primary-rgb` | `4 111 68` | = #046f44 |
| `--theme-primary` | `#046f44` | |
| `--color-primary_color_default` | `#007041` | Tailwind `bg-primary_color` → buttons compute `rgb(0,112,65)` = **#007041** |
| `--link_color` | `#007041` | |
| `--color-primary-green` | `#046f44` | |
| `--primary_color` | `#07b86b` in one stylesheet; empty at runtime on `:root` | bright green used for gradients/dark variants |
| `--color-black` | `#1d1d1d` | body text colour |
| `--color-black2` | `#282828` | |
| `--color-accent_color1_default` | `#353535` | headline/card-title colour |
| `--color-accent_color3_default` | `#b0b0b0` | |
| `--color-grey2` | `#4f4f4f` | |
| `--color-very-dark-gray` / `--color-very-light-gray` | `#303030` / `#e2e2e2` | |
| `--theme-bg` / `--theme-bg-surface` / `--theme-bg-elevated` | `#fff` / `#fafafa` / `#f0f0f0` (dark: `#141414` / `#1e1e1e` / `#2a2a2a`) | |
| `--theme-text` / `-secondary` / `-muted` / `-faint` | `#333` / `#666` / `#999` / `#aaa` | |
| `--theme-border` / `--theme-border-subtle` | `#e0e0e0` / `#f0f0f0` | |
| `--theme-highlight-bg` | `#046f441f` (12 % green) | |
| `--highlight-bg` / `--highlight-text-color` | `#e6f4ef` / `#046f44` | |
| `--text-color` / `--text-color-secondary` | `#495057` / `#6c757d` | PrimeReact |
| `--border-radius` | `6px` | |
| `--focus-ring` | `0 0 0 0.2rem #99f6e4` | PrimeReact default (teal), not seen on the tested controls |
| `--default-transition-duration` / `-timing-function` | `.15s` / `cubic-bezier(.4,0,.2,1)` | Tailwind |
| `--content-padding` | `1.25rem` | |
| `--header-height` (inline on `<html>`) | `92px` | |
| **Newer "nc" card system** | | used by listing cards |
| `--nc-ink` / `--nc-body` / `--nc-muted` | `#182420` / `#41504a` / `#7a8781` | green-tinted neutrals |
| `--nc-ground` / `--nc-mist` / `--nc-line` | `#f7faf8` / `#e9f4ee` (= primary 9 % on white) / `#e3eae5` | |
| `--nc-gold` / `--nc-error` | `#d99a26` / `#b42318` | |
| `--nc-radius` / `--nc-radius-sm` | `16px` / `12px` | |
| `--nc-shadow` / `--nc-shadow-hover` | `0 20px 40px -24px #18242047` / `0 24px 48px -20px #18242052` | |
| `--nc-container` | `1200px` | |
| `--nc-display` | `"Montserrat", sans-serif` | |
| `--nc-lh-body` / `--nc-lh-title` | `1.6` / `1.3` | |
| `--nc-track` / `--nc-track-wide` | `0.08em` / `0.12em` | eyebrow letter-spacing |
| `--nc-title-md` / `--nc-title-sm` | `1.2rem` / `1.05rem` | |
| **Long-form/programme layout** | | |
| `--prog-measure` | `68ch` | reading width |
| `--prog-gutter` | `clamp(1.25rem,5vw,2rem)` | |
| `--prog-space-block` / `--prog-space-section` | `clamp(1.25rem,4vw,2rem)` / `clamp(2rem,6vw,4rem)` | |
| Tailwind scale | `--spacing .25rem`; `--radius-xs/md/lg/xl/2xl` = `.125/.375/.5/.75/1rem`; `--text-xs…4xl` = `.75/.875/1/1.125/1.25/1.5/1.875/2.25rem` | stock Tailwind v4 |

The most frequent hex values in the first-party CSS text are `#fff` (593), `#046f44` (529), `#495057` (159), `#000` (120),
`#6c757d` (114), `#dee2e6` (111), `#007041` (103), `#14b8a6` (83, PrimeReact teal, not seen rendered) and `#e5e7eb` (46).

## 3. Colour palette (measured on rendered elements)

Counts are the number of visible elements using the colour on the page named (H = home 1440, L = listing 1440, D = detail 1440).

| Hex | Role | Usage count | Where |
|---|---|---|---|
| `#007041` | **Brand green**: primary buttons, eyebrow/category text, h1 "Explore", section underline | H: 21 text + 11 bg · L: 26 text | `hero-cta` "Learn More" bg, "See More" bg, card category labels, filled pill hover |
| `#046f44` | Brand green (token value), lead paragraph on detail page, Tailwind `primary` | D: 11 text, L: 1 | detail lead paragraph (`#007041` measured there), view-toggle active |
| `#ebf2ee` | **Mint band**: secondary nav strip on inner pages, tinted surfaces | H 3, L 1, D 1 bg | inner-page nav band (see `list-1440-01-top.png`) |
| `≈#ebf4f0` (`color(srgb .92 .955 .94)`) | Mint section background (Features block) and card category chips | H 19 bg | "Features" section bg, `NEWS & ANNOUNCEMENTS` chips |
| `≈#e6f1ec` (`color(srgb .90 .944 .926)`) / `#e6f4ef` | Category pill bg on listing cards | L 12 + 2 | `FEATURES` pill |
| `#6bcfa5` | Light-green eyebrow on dark hero | H 4 | "LEARNING & INSPIRATION" over hero |
| `#ffffff` | Page and card surface | H 33, L 18, D 20 bg | body, cards (`article`) |
| `#353535` | Headings, card titles | H 57 (h3 28) | card h3, h1 on detail |
| `#182420` | Card titles (nc system, green-black) | L 12 | listing `h3` |
| `#1d1d1d` | Body text default | body | `body` colour |
| `#000000` | Article body text | D 31 | detail `p` (18px Open Sans) |
| `#4a5a54` / `#5f6f69` | Card excerpt / meta (green-grey) | L 12 / 12 | listing excerpts, dates |
| `#6b7280` | Meta text ("a week ago"), listing intro | H 19 | card meta |
| `#818181` | Footer links | 27 per page (li 20) | footer columns |
| `#828282` | Outline pill button text | H 2 | "See More Imamat News" |
| `#272727` | **Footer background** | 2 divs per page | footer |
| `#3a4b39` | Dark olive: footer heading underline, borders | 4 bg + 2px borders | footer h6 underline bars |
| `#e3eae5` | Card border (nc line) | L 36 | listing `article` 1px border |
| `#dee2e6` | Outline pill border | H 6 | "See More" pills |
| `#e0e0e0` / `#e5e7eb` | Dividers, chip borders | L 9 / D 13 | |
| `#ef4444` | Notification dot | 1 | TV icon badge |
| Hero overlay | `linear-gradient(0deg, transparent 50%, rgba(0,0,0,.6) 100%), linear-gradient(0deg, #1f1f1f 0, rgba(0,0,0,.3) 10%, transparent 20%), linear-gradient(90deg, #1f1f1f 0 …)` | H 4 | dark scrims on the hero photo, bottom and left |
| Skeleton | `linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)` | L 12 | image loading shimmer |

Palette summary: a **single deep green (`#007041`/`#046f44`)** on white, with **mint tints of the same green** as section
backgrounds and chips, **green-tinted near-black/grey neutrals** (`#182420`, `#41504a`, `#4a5a54`) in the newer components,
and a **charcoal footer (`#272727`)**. No second accent colour appears on screen (the gold `#d99a26` token was not seen rendered).

## 4. Typography (measured CSS)

- **Families:** `Montserrat` (Google Fonts, variable 300–800) for UI, headings, nav and buttons. `"Open Sans"` (300–800)
  for article body, card meta and excerpts. Also loaded: **`Noto Naskh Arabic` (400–700)** and **`Noto Nastaliq Urdu`**
  (both "unloaded" on the English page, so they are used only for RTL editions), FontAwesome 4.7 and primeicons.
  The logotype "the·ismaili" is an image/SVG serif, not a web font.
- **Root size:** 16px; body `16px / 24px Montserrat #1d1d1d`.

| Element | Desktop 1440 | Mobile 375 |
|---|---|---|
| Hero title (`h2.hero-title`) | 48px / 57.6px, 600, white, `clamp(1.5rem,3.5vw,3rem)`, line-clamp 5 | 24px / 28.8px |
| Section title "Explore The Ismaili" (h1) | 32px / 32px, 400, `#007041` | 24px |
| Listing page title "Features" | 32px / 38.4px, 700, `#1f2937`, letter-spacing −0.32px | — |
| Detail h1 | 28.8px / 39.6px, 600, `#353535` | 24px / 32px |
| Detail lead paragraph | 20px / 28px Montserrat 400, `#007041` | 16px / 28px |
| Article body `p` | **18px / 30.6px (1.7) Open Sans 400, `#000`**, ~643px column | 17px / 28.9px |
| Card title (home) | 15.2px / 20.52px, 600, −0.152px | 15.2px |
| Card title (listing, nc) | 19.2px / 24.96px (1.3), 600, `#182420` | — |
| Card excerpt | 14.4px / 23.04px (1.6) Open Sans, `#4a5a54` | — |
| Eyebrow / category | 11.2–11.52px, 600, uppercase, letter-spacing 0.896–1.38px (`--nc-track` .08em/.12em) | 10px 600 |
| Meta | 12.8px / 17.92px Open Sans | 12px |
| Nav links | 16px, 400, white over the hero, dark on inner pages | in a drawer, ≈18px |
| Footer column heads (h6) | 14px / 16.8px, 400, uppercase, white | 12px |
| Footer links | ≈12.4px 500 Montserrat `#818181` | |

Weights in use: 400, 500 and 600 (700 only on the listing h2). Letter-spacing is `normal` except the uppercase eyebrows
(+0.08–0.12em) and a slight negative tracking on titles.

## 5. Spacing, layout, radius, shadow (measured CSS)

- **Container:** `max-width: 1240px` (8 elements on home), content width 1216px at 1440 (12px side padding each way).
  `--nc-container` = 1200px. Article column ≈643px (Open Sans 18px ≈ 68ch, matching `--prog-measure: 68ch`); detail hero image 883–991px wide.
- **Grid:** listing cards use a 3-column CSS grid, `389px ×3`, **gap 24px**. Home rows use flex gaps of 16, 24 and 32px. The footer uses a `64px 32px` gap.
- **Spacing rhythm:** 4px base (Tailwind `--spacing .25rem`); fluid section spacing `clamp(2rem,6vw,4rem)`.
- **Radius:** cards **16px** (nc listing) or 10px (home cards) and 8px (home card media); detail images 4px and related cards 10px;
  pills `9999px`/`999px`/`50px`; inputs 6px; CTA "Learn More" 50px. Mobile menu and drawers are square.
- **Shadows:**
  - home cards: `0 1px 2px rgba(0,0,0,.04), 0 6px 16px rgba(0,0,0,.06)`;
  - listing cards: `0 20px 40px -24px rgba(24,36,32,.28)` (= `--nc-shadow`), hover `0 24px 48px -20px #18242052`;
  - related cards: `0 1px 2px rgba(0,0,0,.04), 0 2px 8px rgba(0,0,0,.03)`;
  - hero arrows: `0 0 9px 1px rgb(140,140,140)`.
  All are soft and low-contrast; nothing is heavy.
- **Borders:** 1px `#e3eae5` on listing cards, 1px `#dee2e6` on outline pills, 2px `#3a4b39` underline bars under footer headings,
  and a 2px green short underline (≈60px) under section titles ("What's New").

## 6. Buttons & links: states and transitions (measured CSS)

| Component | Default | Hover | Focus (`:focus-visible` true) | Transition |
|---|---|---|---|---|
| Hero CTA "Learn More" (`a.hero-cta.bg-primary_color`) | bg `#007041`, text white 14.4px/600 Montserrat, padding 12px 32px, radius 50px, height ≈46px | **`transform: scale(1.03)`**, colour unchanged | outline **none**, offset 2px, no box-shadow → **no visible focus ring** | `opacity .2s, transform .2s` |
| Outline pill "See More Imamat News" (`.button.rounded-full`) | bg white, text `#828282` 14px/500, 1px `#dee2e6` border, padding 5.25px 21px, fully rounded | bg → `#007041`, text → white; a `::before` layer **slides in from the left** (`left:-100% → 0`, `.4s ease`) | outline none | `background .3s` (+ `::before left .4s ease`) |
| Filled "See More" (Features block) | bg `#007041`, white, pill | not separately measured | — | — |
| Card / text links | inherit text colour (`#212529`/`#1d1d1d`), no underline | colour → `#000` (`h3` has `hover:underline`) | outline none, offset 1px | `all .5s ease-in-out` (most common transition: 92 elements on home) |
| "THE ISMAILI TV" pill | transparent, 1px `#ccc`, text `#555` 13px/500 (white over hero), radius 9999px | no measured change | — | `border-color, background-color, color .15s` |
| Listing card (`article`) | 1px `#e3eae5`, radius 16px, nc shadow | shadow → `--nc-shadow-hover`, image `scale(1.03)` (CSS rule `:hover img{transform:scale(1.03)}`) | CSS rule `:has(a:focus-visible){outline:2px solid #007041}` exists (not screenshotted) | `transform, box-shadow .2s ease`; image `transform .35s ease` |

Other motion (measured): hero title `clipReveal .8s cubic-bezier(.25,.46,.45,.94) .2s`; carousel slides `transform, opacity 1s ease-in-out`;
`opacity .3s cubic-bezier(.4,0,.2,1)`. The CSS has **6 `prefers-reduced-motion: reduce` blocks** (audio, lightbox, play button, hero title `animation:none`).
Dark mode: 1 `prefers-color-scheme: dark` block, and `--theme-*` dark values exist, but the site rendered light only.

## 7. Header, nav, footer, mobile menu

- **Home header** (`home-1440-01-top.png`): `position: fixed; top:0`, height 92px (`--header-height`), **transparent over the hero**
  (`rgba(255,255,255,0)`, no shadow, class `transparent-header`). White serif logotype on the left, 5 centred nav items
  (About · What's New · Programmes · Our Spaces · Service, 16px/400 white), and TV, search and country-flag icons on the right.
  On scroll-down the header slides away (`translate-y-*` classes, transition `background-color, box-shadow, backdrop-filter, transform .3s ease`).
- **Inner-page header** (`list-1440-01-top.png`, `detail-1440-01-top.png`): three tiers. (1) A small utility row
  (Contact Us · Newsletters · country · language, ≈12px). (2) White bar with the **colour logo** (green/red/ochre star mark) and the
  TV pill + search. (3) A full-width **mint nav band `#ebf2ee`** with the 5 centred items in dark grey. Then a breadcrumb
  (Home > What's New > Features) with a 1px bottom divider.
- **Footer** (`home-1440-05-bottom.png`): charcoal `#272727`, a full-width white rounded search field at the top, 4 link columns
  (ABOUT, EXPLORE THE ISMAILI, QUICK LINKS, RELATED WEBSITES) with uppercase white 14px heads and short underline bars,
  grey `#818181` links, a large white logo bottom-left, then country selector (green 1px outlined), app-store badges,
  social icons, a "back to top" chevron on a hairline divider, and a legal row (Privacy · Terms · © Islamic Publications Limited).
- **Mobile 375** (`home-375-01-top.png`): small logo plus 3 icon buttons (TV, Search, "Toggle navigation" hamburger, 36–38px hit areas).
  The hero is full-height with the title at 24px. **Menu** (`home-375-menu-open.png`): full-screen white sheet
  (`fixed top-0 left-0 w-full min-h-screen bg-white z-[200]`, no measured transition), colour logo + ✕ close, 5 top-level
  items at ≈18px with right chevrons (drill-down), 60px row rhythm, and a **sticky bottom bar with the country/language switch**.
  Tapping it opens a separate panel (`home-375-country-language-panel.png`): underlined select fields and an outlined "Confirm" pill.

## 8. Imagery

- **Photography-first**, full-bleed in the hero (`object-fit: cover`, displayed 1440×900 from 1350×900 sources, **3:2**),
  with **dark gradient scrims** (bottom and left) so white text sits on top. A thin progress bar (green fill on grey) and numbered
  pagination run the hero carousel.
- Card media is **3:2** (1350×900 sources, `cover`, radius 8px at the top of the card). Many photos carry a small white
  "the·ismaili" watermark at the bottom-right.
- Content is mostly **people and community events** (crowds, hands, leaders), plus **architecture** (the Ismaili Center Houston:
  pale stone, slender columns, gardens). Some cards use flat **vector illustrations** (people, warm palette) or
  **geometric collage** (hexagon-masked photos on blue). The "Features" block puts a mint background next to a large photo carousel.
- Images are served through `content-images.the.ismaili/?url=…&w=1350&h=900&fit=cover&a=attention&q=90&output=webp`, an
  on-the-fly resizer with WebP output and attention-based cropping. That fits the low-bandwidth goal.

## 9. Image candidates from the.ismaili (reference only)

Licence: the site's Terms & Conditions say copyright in the site's photographs and images belongs to IPL or third parties.
Reproduction is allowed only for **non-commercial informational/educational purposes, with acknowledgement and no modifications**,
and third-party material needs that party's written consent. The names, symbols and logos may not be used. A hero background is
by nature cropped, overlaid and modified, and implies association, so **none of these can be reused. Nothing was downloaded.**
Most photos on the pages visited show people, so very few even meet our content rules.

| Page URL | Image URL | Description | Dimensions | Licence / usage |
|---|---|---|---|---|
| …/nl/en/news/built-to-welcome-the-ismaili-center-houston-s-first-year | `https://content-images.the.ismaili/?url=https%3A%2F%2Fapi.the.ismaili%2FLibrary%2Ffile.php%3Fpath%3DDocuments%2Fismaili_content_image%26display%3DYES%26file%3DNzY5MjAuanBn%26name%3D2.jpg&w=1350&h=900&fit=cover…` | Ismaili Center Houston: architecture, gardens, sky. **Fails our rules**: crowds of identifiable people in the foreground, and a religious-community building | 1350×900 | Reference only — not reusable (IPL copyright) |
| …/nl/en (home "What's New" card) | hexagon-collage image (no stable URL captured) | Fountain/water channel, stone, flowers in a geometric collage | ~392×261 displayed | Reference only — not reusable; also a branded composition |
| …/nl/en (home hero) | `…file%3DNzY4NTkuanBn%26name%3D1.jpg&w=1350&h=900…` | Hands reaching to the sky. **Fails our rules** (hands/body parts) | 1350×900 | Reference only — not reusable |

Takeaway for our design: borrow the *treatment* (3:2 crop, dark bottom/left scrim, calm architecture and garden subjects),
not the files.

## 10. Free-licence fallbacks (verified pages, not downloaded)

| # | Page URL | Subject | Size | Licence | Attribution text | Check |
|---|---|---|---|---|---|---|
| 1 | https://commons.wikimedia.org/wiki/File:Ash_Shmemis_castle.jpg | Basalt ruins of Shmemis castle (3 km from Salamiyah) in warm evening light, clear sky, **no people** | 2048×1536 | CC BY-SA 3.0 (also GFDL) | "Ash Shmemis castle" by Heretiq, CC BY-SA 3.0, via Wikimedia Commons | Page + image viewed |
| 2 | https://commons.wikimedia.org/wiki/File:View_from_Shmemis_Castle.jpg | Wide hazy plain and hills seen from Shmemis, **no people**; calm, low-contrast, good under a text scrim | 3648×2056 | CC BY-SA 3.0 | "View from Shmemis Castle" by Jdowny, CC BY-SA 3.0, via Wikimedia Commons | Page + image viewed |
| 3 | https://commons.wikimedia.org/wiki/File:Salamiyah_-_Syria.jpg | Black-and-white plain towards Salamiyah from Shmemis (Wiki Loves Earth 2024); one small truck, **no people**; portrait 2:3 | 4000×6000 | CC BY-SA 4.0 | "Salamiyah - Syria" by ACEsAF, CC BY-SA 4.0, via Wikimedia Commons | Page + image viewed |
| 4 | https://commons.wikimedia.org/wiki/File:Olive_groves_in_Syria.jpg | Olive groves, Homs Governorate, morning light | 2300×1270 | CC BY 3.0 de | "Olive groves in Syria" by High Contrast, CC BY 3.0 DE, via Wikimedia Commons | Licence via Commons API; **visual not checked (429 rate limit). Check for people before use** |
| 5 | https://unsplash.com/photos/seedlings-sprout-from-the-freshly-tilled-earth-v_rgqR0vvOE | Seedlings sprouting from tilled soil (growth/"أثر" metaphor) | not stated | Unsplash License (free) | Photo by Hannes Knutsson on Unsplash | Licence via WebFetch; Unsplash blocks headless Chrome, so **visual not checked** |

Rejected: Unsplash "rolling hills covered in olive groves" (`mF09s2Fzgcg`) and "olive branch" (`sKRpq4WOCvE`) are **Unsplash+** (paid), not the free licence.
CC BY-SA images require attribution, and any modified version (crop, overlay) must be shared under the same licence. Put the credit
line in the footer or on an "image credits" page.

## Answer

The Ismaili's identity is **one deep, calm green (`#007041` / `#046f44`) on generous white**. Tints of that same green
(`#ebf2ee`, `#e9f4ee`, `#e6f4ef`) are the only secondary surfaces. Neutrals are slightly green-tinted (`#182420`, `#41504a`),
and the footer is charcoal (`#272727`). Type is a geometric sans, **Montserrat**, for everything structural, with
**Open Sans** at a comfortable 18px/1.7 for reading. The site already loads **Noto Naskh Arabic** for RTL editions. Layouts sit in a
1240px container with 3-column card grids (24px gap), soft green-tinted shadows, 16px card and pill radii, and small uppercase
tracked eyebrows in green. Photography is full-bleed 3:2 under dark gradient scrims. Motion is subtle (0.2–0.5s ease, scale 1.03).

## Patterns worth adopting

1. **Monochrome-green palette with mint tints.** Use one brand green for actions and accents, and a 6–9 % green-on-white mint
   (`color-mix(in srgb, green 9%, #fff)`) for section bands and chips. This maps directly onto our `accent` token and a new
   `accent-soft` surface.
2. **Green-tinted neutrals** (`--nc-ink #182420`, `--nc-body #41504a`, `--nc-line #e3eae5`) instead of pure greys. Text and borders
   then feel part of the brand.
3. **Card recipe**: white card, 1px `#e3eae5` border, 16px radius, very soft shadow `0 20px 40px -24px rgba(24,36,32,.28)`,
   on hover a deeper shadow plus image `scale(1.03)` over 0.2–0.35s, an uppercase eyebrow chip in green on mint, a 2-line title, a
   2-line excerpt and quiet meta. This works well for campaign cards.
4. **Hero with scrim**: full-bleed image, `linear-gradient` darkening bottom and start side, white 600-weight title,
   pill CTA in brand green. Good for the transparency dashboard and campaign covers (with our illustrations instead of photos).
5. **Reading layout**: 18px body at line-height 1.7, ~68ch measure, fluid section spacing `clamp(2rem,6vw,4rem)`, and a green lead paragraph.
6. **Mobile drawer**: full-screen white sheet, large rows with chevrons, language/country switch pinned at the bottom.
   This suits our Arabic/English toggle.

## What to skip and why

- **Montserrat / Open Sans for Arabic.** Neither has Arabic glyphs. Keep IBM Plex Sans Arabic (body) and Noto Kufi Arabic (display)
  as in our rules. Borrow only the weight and size relationships (600 titles, 18px/1.7 body). Their Arabic editions use Noto Naskh, which
  is a calligraphic style that reads less well in dense UI at small sizes.
- **Missing focus indicators.** Tested CTAs and links compute `outline: none` with no box-shadow even when `:focus-visible` is true.
  We must keep a visible focus ring (WCAG 2.4.7).
- **Low-contrast greys**: outline-pill text `#828282` on white (≈3.9:1) and footer links `#818181` on `#272727` (≈3.8:1) at 12–14px
  fail AA. Use our `muted` token at ≥4.5:1.
- **Sub-13px text**: eyebrows at 10–11.5px and meta at 12px. Our rule is Arabic ≥ 13px, and uppercase tracking does not exist in Arabic,
  so render eyebrows as 13px semibold without letter-spacing in RTL.
- **Physical-direction motion and layout**: the outline-pill fill slides in from the **left** (`left:-100%→0`), the hero scrim is a
  `90deg` (left-side) gradient, hero titles are `text-align:left`, and the carousel arrows are left/right. In RTL these must be mirrored
  with logical properties (`inset-inline-start`, `to left` ↔ `to right` per `dir`) or dropped.
- **`transition: all .5s ease-in-out` on 92 elements** is slow and costly. Use specific properties at 150–250ms and honour
  `prefers-reduced-motion` everywhere, not just on 6 components.
- **Header that hides on scroll + transparent-over-photo nav**: white nav text over a busy photo depends on the scrim. Our
  pages are mostly data. Prefer a solid, always-visible header.
- **Heavy client stack** (Bootstrap + PrimeReact + Tailwind + Swiper + FontAwesome + Video.js, ≈1 MB of CSS): against our
  low-bandwidth rule. Take the look, not the libraries.
- **People photography and watermarks**: our privacy rules forbid beneficiary photos. Use illustrations and landscape/texture images (section 10).

## Screenshots (`shots/01/`)

- Home: `home-1440-01-top.png` (transparent header + hero), `home-1440-02-scroll.png` (news cards, outline pill, "What's New"),
  `home-1440-03-scroll.png` (mint "Features" block, filled pill), `home-1440-04-scroll.png`, `home-1440-05-bottom.png` (footer);
  `home-375-01-top.png` … `home-375-05-bottom.png`, `home-375-menu-open.png`, `home-375-country-language-panel.png`.
- Listing: `list-1440-01-top.png` (3-tier header, mint nav band, filters, nc cards) … `list-1440-05-bottom.png`; `list-375-01-top.png` … `-05-bottom.png`.
- Detail: `detail-1440-01-top.png` (breadcrumb, eyebrow, title, Listen pill) … `detail-1440-05-bottom.png`; `detail-375-01-top.png` … `-05-bottom.png`.
