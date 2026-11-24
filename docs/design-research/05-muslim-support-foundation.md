# 05 · Muslim Support Foundation (Behance case study)

- **Reference:** https://www.behance.net/gallery/256120521/Muslim-Support-Foundation-NGO-Website-UIUX
  ("Muslim Support Foundation — NGO Website UI/UX", by Hamza Ghaffar, published 23 Sep 2026)
- **Question:** which navigation, typography and spacing patterns also work in Arabic RTL?
- **Date of research:** 2026-11-24

## Method & limitations

- Playwright (`e2e/node_modules/@playwright/test`) with the installed Chrome, light colour scheme, 1440×900 and 375×812.
  Scrolled the whole page in 400–450 px steps to lazy-load every module, then took viewport screenshots (JPEG q70).
- **Access:** headless Chrome got **HTTP 400**, and `curl` got 400 or 403 depending on the user agent. A normal
  (visible) Chrome window loaded the page. Its document response was still 403, but the page rendered fully. I made no
  login, form submission, CAPTCHA or bot-check bypass.
- **Cookie banner:** Adobe's "Make It Your Own" banner stays on screen. The privacy-preserving button ("Don't Enable")
  lives in a frame my script could not find. I ignored the banner rather than accept it, so the bottom ~200 px of every
  viewport shot is covered. To make up for this, I captured close-up crops (`zoom-*`) by loading the project image URLs
  directly at 1400 px.
- **Everything below is "observed in image".** Behance shows flattened JPG/WebP mock-ups, so **no live CSS was
  measured**. I estimated pixel values by scaling the 1440-wide web layout from its mock-up frame (frame ≈ 1175 px wide
  in the 1400 px crop → ×1.225). Treat them as ±10%. The only "declared" values are the ones the designer printed on
  the type and colour spec boards (DM Sans, 48/32/20 px, five hex swatches).
- The case study shows **desktop layouts only**. It has no mobile breakpoint, so no mobile menu or hamburger is shown.
  The 375 px shots show Behance's own mobile viewer shrinking the desktop images.
- Hung `browser.close()` calls on Windows needed watchdog timers. All Chrome processes were checked closed afterwards.

## Screenshots (`docs/design-research/shots/05/`)

| File | Content |
|---|---|
| `desktop-00` | Project cover: home-page hero on a monitor mock-up (dark photo hero, lime CTA) |
| `desktop-01`–`04` | Case-study intro: client quote, overview, "Designing Around Clarity", problem cards |
| `desktop-05`–`10` | Hero detail, user insights, stat widgets, Friction / Opacity / Confusion pain points |
| `desktop-11`–`12` | Logo banner, Typography & Colour spec (covered at the bottom, see `zoom-img2-*`) |
| `desktop-13`–`16` | Device mock-ups, "Web Visual Pages" divider |
| `desktop-16`–`22` | **Home landing page**: nav, hero, partner strip, about split, focus cards, process timeline, donate widget, stories, testimonials, FAQ, contact, **footer** |
| `desktop-23`–`34` | About Us detail page, Our Work / Education detail page (breadcrumb hero), more mock-ups |
| `desktop-35`–`39` | Project end card and Behance's own "more by author" area (ignore) |
| `mobile-00`–`18` | 375 px Behance viewer (desktop designs scaled down; cookie banner partly covers some shots) |
| `zoom-img2-3600` | Logo banner + "Typography & Color 05" section header (close-up) |
| `zoom-img2-5400` | **Type spec**: DM Sans, weights, Heading 48 / Subheading 32 / Body 20 |
| `zoom-img4-0` | **About page header + nav** close-up (1400 px) |
| `zoom-img4-2000` | Section rhythm close-up: tinted band, eyebrow chip, two-tone headings, card row |

## Palette (observed)

I sampled all six project images (2800/1400 px WebP) with canvas `getImageData` after downscaling to 300 px wide,
quantised to 4 bits per channel (±8). Each image was opened on its own origin, so no CORS taint. The shares below are
weighted by image area, so the case-study boards' grey backgrounds dominate.

| Hex (sampled) | Share | Role | Designer-declared swatch |
|---|---|---|---|
| `#F8F8F8` | 76.1 % | Page / board background, tinted section bands | `#F9F9F9` |
| `#080808` | 10.7 % | Dark hero overlay, footer, dark card | `#000000` |
| `#282828` | 1.6 % | Headings / near-black text, mock-up chrome | — |
| `#D8D8D8` | 1.2 % | Hairline dividers, input fill | — |
| `#B8B8B8` / `#989898` | 0.8 / 0.6 % | Light-weight "ghost" heading words, body grey | `#696969` (body grey) |
| `#78B818` | 0.6 % | Lime accent in shadow / photo-tinted | **`#7AD706`** (primary accent) |
| `#88E828` | 0.14 % | Lime accent, bright (buttons, highlights) | `#7AD706` |
| `#58A808` / `#489808` | 0.13 / 0.10 % | Darker green gradient end (impact card) | — |
| `#584838`–`#886858` | ~1 % total | Warm skin/earth tones from photography | — |
| `#FFFFFF` | (in the `#F8F8F8` bucket) | Cards, nav text on dark | `#FFFFFF` |

Contrast checks (my calculation): `#7AD706` on white = **1.8:1** (fails AA for text). `#000` on `#7AD706` = **11.6:1**
(passes; the designer uses black labels on lime buttons). Body copy appears around `#9A9A9A` on white, about 2.8:1,
which **fails AA**.

## Navigation (observed in image)

- **Header:** transparent bar laid over a dark photo hero, one row, about 88 px tall at 1440. Logo lockup at the start
  (icon + two-line wordmark). **Four links grouped in the centre** (Home · About Us · Our Work · Contact), white, about
  14 px, regular weight. The **active link is lime with a 1 px lime underline**. One **CTA pill at the end**:
  "Donate Today ↗", lime fill, black label, ~8 px radius, arrow icon after the label.
- **No utility bar** (no language, search or login row). No mega-menu. No sticky state is shown.
- **Inner pages** repeat the same header over a dark photo hero, with a small **eyebrow breadcrumb** above the H1
  ("OUR WORK / EDUCATION", ~10 px caps with a leaf glyph).
- **Section eyebrows:** small pill chips (lime-tint background, lime text, leaf glyph, snake_case label like
  `OUR_FOCUS`) above each section heading.
- **Footer** (black band): 4 columns. (1) Logo, two-line mission sentence, 3 social icons. (2) "Quick Links" (5).
  (3) "Programs" (5). (4) a rounded dark-grey "Stay Informed" card with an email field and a lime "Subscribe" button.
  Hairline divider, then a bottom row: © at the start, "Privacy Policy · Terms · **Transparency Report**" at the end.
- **Mobile menu:** not designed (no breakpoint in the case study).

## Typography (observed in image + designer's spec board)

- **Single family: DM Sans** (geometric grotesque). The board lists Semi-bold, Medium, Regular and Light.
- **Declared scale:** Heading 48 px · Subheading 32 px · Body 20 px. In the page mock-ups, section H2s render around
  30–34 px, the hero H1 around 44–48 px, body copy 14–16 px and eyebrows/chips 9–10 px (scaled from images).
- **Signature move: two-tone headings.** One part of the heading is dark at semi-bold. The other part is either
  **lime** ("Every Life Deserves Dignity") or **light-grey Light weight** ("Questions *Worth Asking*", "Everyone
  deserves *dignity*"). The case-study boards use the same trick: a light grey kicker ("Defining Identity") over a dark
  regular line ("Through visual clarity").
- Line length: body paragraphs in split sections run about 60–75 characters. Centred section intros reach about 110
  characters on one line, which is too long.
- Line-height looks generous for headings (about 1.2) and body (about 1.6–1.7).

## Spacing & grid (observed in image, scaled to 1440)

- **Container:** about 1320 px content width with **~56 px side gutters** inside a full-bleed page. Hero and footer
  are full-bleed. Content sections sit in the same container.
- **Section rhythm:** alternating **white / `#F9F9F9` bands**, each with **~90–100 px vertical padding**. The order
  goes eyebrow chip → 16 px → H2 → 16–24 px → grey intro → 48–56 px → content.
- **Grid:** a 12-column feel. Common splits are **5/7** (heading at the start, text or FAQ at the end), **4/8**
  (sticky-ish heading + accordion), centred intro + **4-up card row** (focus cards ~190 px wide, 12 px gap), and
  **3-up CTA cards** (~280 px, 16 px gap, 16 px radius, 24 px inner padding).
- **Radii:** buttons ~8 px, cards 12–16 px, image frames ~14 px, chips fully rounded.
- **Process timeline:** vertical lime line with ringed nodes and step numbers `01`–`04`, set to the end side of a 5/7 split.
- **Donate widget:** preset amount chips in a row (4 values, the selected one lime), "other amount" field, a
  One-time / Monthly segmented toggle, and a full-width lime submit button.

## RTL assessment

| Pattern | How it mirrors in RTL | Risk |
|---|---|---|
| Logo start · links centre · CTA end | Flex row with `justify-between`. In `dir="rtl"` the logo goes right and the CTA left automatically | Low. Use logical spacing (`ms-`, `me-`, `gap`), never `ml-`/`mr-` |
| Active link underline | Underline is symmetric | None. Draw it with `border-b`/`text-decoration` (works in both directions). If it animates, grow it from the inline-start |
| CTA arrow icon "↗" after the label | Must flip (`rtl:-scale-x-100`) so it points to the reading end, and sit after the Arabic label | Medium. A diagonal arrow mirrored reads "↖". Swap to a plain "←" chevron in Arabic |
| Eyebrow breadcrumb `OUR WORK / EDUCATION` | Order reverses; the separator "/" is neutral. Use `‹` or a chevron that flips | Low. Don't letter-space or upper-case Arabic |
| Snake_case eyebrow chips (`OUR_FOCUS`) | No Arabic equivalent; underscores look like broken text in Arabic | **High.** Use a plain Arabic word («تركيزنا») in a chip, no case transform, ≥13 px |
| Two-tone heading (dark + accent/ghost words) | Works with `<span>` in Arabic. Colour applies to whole words, so no joining breaks across colour changes | Medium. Never change colour *inside* an Arabic word (breaks shaping in some browsers). The ghost-grey part must still reach 4.5:1 |
| Light-weight (300) "ghost" headings | Noto Kufi Arabic has a light weight, but thin Kufi at 32–48 px in grey loses legibility | Medium. Use Regular weight + `muted` token instead of Light + pale grey |
| 5/7 and 4/8 splits (heading start, content end) | CSS grid mirrors automatically: the heading moves to the right | Low |
| 4-up / 3-up card rows | Mirror automatically; reading order goes right to left | Low |
| Vertical process timeline on the end side | Line + nodes move to the left in RTL if positioned with logical props (`inset-inline-start`) | Low with logical props; high if `left:` is hard-coded |
| Step numbers `01`–`04`, amounts `PKR 2,500`, stats `32%` | **Numerals don't flip.** Keep Western digits (project convention) in `dir="ltr"`/`<bdi>` spans so `%` and currency sit correctly | Medium. `%`, currency and `+` sign placement need `<bdi>` |
| Donate preset chips + One-time/Monthly toggle | Chip order mirrors (smallest amount on the right); the segmented toggle mirrors | Low |
| Progress bars (case-study board shows them) | **Fill from the inline-start** (right in Arabic), which is the expected Arabic convention | Low if built with `inset-inline-start`/flex; don't use `transform-origin:left` |
| Testimonial carousel arrows / video "Play" | Carousel prev/next arrows flip. **Media play ▶ never flips** | Medium. Keep play icons out of the global `rtl:flip` rule |
| Logo lockup | **Never mirror the logo**; only its position moves | Low |
| Footer 4 columns + legal row | Columns mirror; © moves right, legal links left | Low |
| Newsletter field + button | Input and button order mirror; email input text stays `dir="ltr"` | Low |
| Body copy at 14–16 px grey | Arabic at 14 px in IBM Plex Sans Arabic reads smaller than Latin; grey makes it worse | **High.** Our floor is 13 px with 16 px body and the `ink`/`muted` tokens |

### Arabic counterpart for the type pairing

DM Sans is a low-contrast geometric sans with a single family across all levels. Our pair matches its tone:

- **Display:** Noto Kufi Arabic is geometric, with open counters and a similar "engineered" feel. It is a good
  counterpart for the semi-bold dark heading part. Use 600–700 for headings and avoid the 300 weight for large grey
  text.
- **Body:** IBM Plex Sans Arabic is calm and humanist-geometric, and its Latin glyphs pair well with DM Sans-like
  sizing. Keep 16 px / 1.75 (already in `tailwind.config.ts`).
- **Scale mapping:** the declared scale is 48 / 32 / 20. Ours is `5xl 48` / `3xl 30` / `lg 18` (or `xl 20`), which is
  already compatible. Arabic needs about 1.3 line-height on headings (ours: 1.25–1.35) versus about 1.2 in the
  reference.
- The 9–10 px eyebrow chips and 11–12 px footer links in the reference are **below our 13 px Arabic floor**. Raise
  them to `text-xs` (13 px).

## Image candidates (from the reference)

Almost all project photography shows **people, children and faces** (hero, focus cards, donate widget, stories,
testimonials). Several images show **mosques, minarets and a crescent logo** (hero background, logo mark). These are
excluded by our rules. The only non-person scenery (sunset sky, trees) appears **behind people** in the same frames.

| Page URL | Image URL | Description | Dimensions | Licence | Verdict |
|---|---|---|---|---|---|
| behance.net/gallery/256120521/… | mir-s3-cdn-cf.behance.net/project_modules/2800_webp/a5c925256120521.6ab3784d0c2ef.jpg | Full About / Our Work page mock-ups (people, children) | 2800×15435 | Behance project, all rights reserved (no licence stated) | **Reference only — not reusable**; contains people |
| same | …/1400_webp/8b33fc256120521.6ab3784d0aa2d.jpg | Cover: hero with a mosque silhouette + people | 1400×9230 | as above | **Excluded**: religious building, people |
| same | …/2800_webp/498bfd256120521.6ab3784d0b06a.jpg | Brand banner (crescent logo), type/colour spec | 2800×8095 | as above | **Excluded**: religious symbol; reference only |

**No reusable image candidates.** Nothing was downloaded to `images/candidates/`.

## Free-licence fallbacks (verified pages, not downloaded)

| # | Page | Licence | Content check | Attribution text |
|---|---|---|---|---|
| 1 | https://commons.wikimedia.org/wiki/File:--%D9%82%D9%84%D8%B9%D8%A9_%D8%B4%D9%85%D9%8A%D9%85%D9%8A%D8%B3.jpg (قلعة شميميس, Shmemis Castle near Salamiyah, 4128×3096) | **CC0 1.0** | Castle on an extinct volcano with trees; local, non-religious. I did not view the image itself, so check for people | Optional: "Shmemis Castle — Nairouz9, CC0, via Wikimedia Commons" |
| 2 | https://unsplash.com/photos/seedlings-sprout-from-the-freshly-tilled-earth-v_rgqR0vvOE | Unsplash License (free, attribution appreciated) | Seedlings in tilled soil; page shows no people | "Photo by Hannes Knutsson on Unsplash" |
| 3 | https://unsplash.com/photos/green-leaf-plant-sprout-LrPKL7jOldI | Unsplash License | Single sprout in soil, close-up | "Photo by Sushobhan Badhai on Unsplash" |
| 4 | https://unsplash.com/photos/a-field-of-grass-with-trees-in-the-background-qw-3HTctYkQ | Unsplash License | Olive trees in a grass field (Crete); Levant-like landscape | "Photo by Kristīne Kozaka on Unsplash" |
| 5 | https://unsplash.com/photos/ripples-on-dark-water-surface-at-dusk-ET7HhIWd3SQ | Unsplash License | Dark water ripples at dusk; good dark-hero texture | "Photo by H&CO on Unsplash" |

Rejected while searching: the Unsplash "gentle ripples" photo by Annie Spratt is **Unsplash+ (paid)**. I also
rejected Commons `Salamiyya,view.jpg` (CC BY-SA 3.0, Bertramz). It is a city view from the north-west that likely
includes minarets, and its content is unverified, so check it before any use.

## Answer

Three things carry over cleanly to Arabic RTL, as long as they are built with logical CSS: the reference's
**navigation skeleton** (logo at the start, a short centred link list, one donate CTA at the end, an active state
drawn as an underline), its **section rhythm** (alternating white / off-white bands, ~96 px vertical padding, a small
eyebrow, then the heading, then the intro, then a 5/7 or 4-up grid), and its **4-column footer** with a legal row.
These all mirror automatically with `flex`/`grid` and `ms-`/`me-`.

The **typography** idea is a single geometric family with a few weights and a 48 / 32 / 20 scale. That maps well onto
Noto Kufi Arabic (display) + IBM Plex Sans Arabic (body). Three of its details do **not** carry over: Arabic needs
larger minimum sizes, sturdier weights and darker greys than the reference's 10 px chips, Light-weight grey headings
and ~2.8:1 body copy.

## Patterns worth adopting (3–6)

1. **Header = logo · 4 centred links · one donate pill**, active link marked by an underline (in our case `accent`,
   with the donate pill in `give`). Add our missing utility (language switch, sign-in) as icon buttons before the CTA
   instead of a separate utility bar.
2. **Section band rhythm:** alternate `bg-page` / `bg-surface-muted` bands, `py-20 md:py-24`, inside one container
   (`max-w-7xl px-4 md:px-14`), each section opening with an eyebrow chip, then the H2, then a muted intro.
3. **Two-tone headings, whole words only:** e.g. «شفافية **في كل ليرة**». The accent part uses `accent-strong` (AA on
   `page`) or `ink` vs `muted`, never pale grey or Light weight.
4. **Breadcrumb eyebrow in inner-page heroes** («حملاتنا / مساعدات طبية»), which helps orientation on campaign
   detail pages.
5. **Donate widget layout:** preset amount chips + "other amount" + one-time / monthly toggle + full-width CTA. This
   fits our pledge flow; monthly maps to orphan sponsorship. Use `give` for the CTA and wrap amounts in `<bdi>`.
6. **Footer with a "Transparency Report" link in the legal row.** It directly supports our transparency dashboard.

## What to skip and why

- **Snake_case / ALL-CAPS letter-spaced eyebrows** (`OUR_FOCUS`): Arabic has no case, and underscores and tracking
  break Arabic joining.
- **Lime text on white** (`#7AD706`, 1.8:1) and **pale grey body copy** (~2.8:1): both fail WCAG AA. Keep lime-style
  emphasis to fills with dark labels; our `brand`/`give` tokens already cover this.
- **9–12 px chips, footer links and captions:** below our 13 px Arabic floor.
- **Light (300) grey "ghost" heading words:** thin Kufi in grey loses legibility. Use Regular + `muted` instead.
- **Diagonal "↗" arrows on CTAs:** mirrored they read as "↖". Use a direction-aware chevron.
- **Photo heroes of people and children, mosque/minaret backgrounds, crescent logo mark:** these break our
  beneficiary-privacy rule (no photos of beneficiaries; covers are illustrations) and our "no religious symbolism"
  rule for imagery.
- **Full-bleed dark photo hero behind a transparent nav:** heavy imagery for low bandwidth, and contrast depends on the
  photo. If used, take a dark texture/landscape (fallbacks 1, 4, 5) with a solid `panel` overlay and compressed images.
- **Logo/partner marquee strip:** not relevant for a single council, and auto-scrolling conflicts with reduced motion.
