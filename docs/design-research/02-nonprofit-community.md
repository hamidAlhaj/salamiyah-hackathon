# 02 · Non-Profit & Community Website (Behance) — design research

**Reference:** https://www.behance.net/gallery/256833273/Non-Profit-Community-Website
(by Charles Demilade, published 8 Oct 2026; tags: nonprofit, charity, Framer website). The mock-up shows a fictional
nature charity called "OnEarth".
**Question:** how does the homepage introduce local campaigns and lead into a scannable listing?
**Date:** 2026-11-24 · analysis only, nothing in the app was changed.

## Method & limitations

- **Headless Playwright was blocked.** `page.goto` on behance.net with the installed Chrome (headless) returned
  **HTTP 400 with an empty body** (`net::ERR_HTTP_RESPONSE_CODE_FAILURE`) at both 1440 and 375 px. I treated this as
  bot detection and did **not** try to get around it (no user-agent spoofing).
- The page loaded normally in the desktop app's browser pane, which is an ordinary interactive browser. There I read the
  project text and listed the project-module `img` elements. Pane screenshots timed out, so the "Behance page" shots
  below are **renders of the project images themselves**: I loaded them from Behance's public CDN
  (`mir-s3-cdn-cf.behance.net`, which answered 200) into a blank local page at 1440 and 375 px viewports and took
  viewport screenshots at each scroll step (JPEG q70). The result looks the same as the gallery, minus Behance's chrome.
- Scrolling the live gallery to the bottom makes Behance auto-load the *next* project, which here was the Arabic "Madad"
  charity template, gallery 258479807. I ignored its images.
- The project has **2 modules**:
  1. a cover collage `project_modules/max_1200_webp/b6f687256833273.6ac79a64468b2.jpg` (940×788 hd; source jpg ~114 KB);
  2. **one full-length homepage** `project_modules/fs_webp/c53368256833273.6ac79a64461d3.png`
     (1920×11048 at fs; source PNG ~12.5 MB).
- **Desktop only.** No mobile layout was designed, so the 375 px shots only show the desktop mock-up scaled down. Any
  responsive advice below is my own inference.
- All values come from the image ("observed in image"). No CSS was measured, because Behance's own UI is irrelevant
  here. Colours were sampled from the image pixels on a canvas (the CDN sends CORS headers, so the canvas was not tainted).
  Sizes are given in px of the 1401 px-wide render, roughly what a 1440 px viewport would show.
- Font families are guessed from the letterforms, not confirmed.

## Screenshots (`docs/design-research/shots/02/`)

| File | Content |
|---|---|
| desktop-00.jpg | Cover collage: "NON PROFIT WEBSITE" in a spaced serif title over dark teal, with 5 page mock-ups |
| desktop-01.jpg | End of the cover (wood-texture floor) + homepage hero top: floating pill nav over an aerial forest photo |
| desktop-02.jpg | Hero headline/CTA, "Guiding our path" mission statement, 3 bento cards (stat / photo / olive card) |
| desktop-03.jpg | "About · Rooted in Conservation": tag pills, wide photo with an overlaid campaign card ("Donate now") |
| desktop-04.jpg | "Initiatives · Building Nature's Future": photo + 2×2 programme cards, start of the olive stats band |
| desktop-05.jpg | Stats band end; **"Featured projects · Highlighted Nature Projects"**: 3-column rows (meta / photo / key-value table) |
| desktop-06.jpg | Last featured row; partner logo strip; **"Campaigns · Protecting Nature Together"** header |
| desktop-07.jpg | **Campaign cards carousel** (3 up, end date + Learn more), prev/next arrows, olive CTA banner |
| desktop-08.jpg | Team portraits (staggered) |
| desktop-09.jpg / -10 | FAQ accordion, "Have any questions?" contact card, dark footer with newsletter |
| mobile-00…03.jpg | The same images at a 375 px viewport (desktop design scaled down; no mobile layout exists) |

## Palette (observed in image)

Quantised share over the whole homepage image (16-level buckets, 400 px downsample):
white ~44 %, light grey ~14 %, near-black ~7 %, olive ~6 %, then dark photo greens/browns (<2 % each).

| Role | Hex (sampled) | Approx. share | Notes |
|---|---|---|---|
| Page background | `#ffffff` | ~44 % | |
| Surface / card / section panel | `#f7f7f5` | ~14 % | warm off-white; cards sit on white, and the featured section is one big `#f7f7f5` panel |
| Brand olive (bands, filled buttons, icon chips) | `#676931` | ~6 % | white on it ≈ **5.8:1** (passes AA) |
| Heading olive (display headings, eyebrows, link CTAs) | `#636730` | (in olive) | same hue as the brand olive; on `#f7f7f5` ≈ 5.4:1 |
| Ink (card titles, values) | ~`#1c1c1c` (bucket `#202020`) | ~7 % | near-black, not pure black |
| Body / secondary text | ~`#6a6a6a` (anti-aliased) | — | ≈ 5.4:1 on white, but set in a **light weight** at ~13–14 px, so it reads fainter than the ratio suggests |
| Footer | `#181818` | — | |
| Hero overlay (bottom of hero photo) | `#181916` | — | dark gradient behind the white hero text |
| Cover backdrop (marketing only) | `#102020` / `#001010` | ~13 % of cover | dark teal; not part of the site |

Takeaway: **one earthy brand colour + warm off-white surfaces + near-black ink.** Colour comes from the photos, not the
UI. This maps directly onto our tokens: `accent` = the Salamiyah green in the olive's role, `surface` = the warm
off-white, and `give` stays reserved for donate actions and progress (the reference has none, see below).

## Typography (observed in image)

- **Display headings:** a rounded humanist sans (looks like Nunito/Varela), regular-to-medium weight, ~48–56 px, in
  olive, tight tracking, sentence/title case ("Highlighted Nature Projects"). The hero is white, ~64–72 px, on two lines.
- **UI/body:** a geometric grotesk (looks like Manrope/Inter). Body text is light weight, ~14–16 px, grey, line-height
  ~1.6. Card titles are medium, ~22 px, in ink.
- **Eyebrow labels:** `● FEATURED PROJECTS` style, a small dot plus uppercase olive text, ~14 px, medium weight, placed
  above every section heading.
- **Uppercase CTAs:** "GET INVOLVED", "LEARN MORE ↗", "READ MORE ↗", "DONATE NOW ↗", ~14 px medium.
- **Mission statement:** large (~30 px), centred, two-tone (first half ink, second half grey) with a small inline pill
  photo between the words.
- **Big numbers:** stats ~48 px regular ("1.2M+", "80+", "300K+") with a 2-line caption underneath.
- No serif on the site. The spaced serif appears only on the Behance cover.

## Layout & spacing (observed in image)

- Content container ~1200 px (122 → 1319 px in a 1440 frame), 12-column feel. The hero is full-bleed inside a ~20 px frame.
- Section rhythm: ~100–120 px vertical gap between sections; ~40–60 px from header to content.
- **Section header pattern:** eyebrow, then a big olive heading on the start side, with a short grey description
  (2 lines, ~360 px wide) on the end side, top-aligned, on the same row. Used on Initiatives, Campaigns and About.
- Radii: cards ~16–20 px, photos ~16 px, buttons fully rounded (pill), tag pills fully rounded and outlined.
- Gutters ~36–40 px between cards. Card padding ~24–28 px.
- Flat surfaces with no shadows; separation comes from the `#f7f7f5` fill and 1 px grey dividers.

## Component patterns: homepage → campaign intro → listing (step by step)

1. **Hero** (desktop-01/02): full-bleed aerial nature photo, a floating translucent pill nav (logo | Home · About ·
   Campaign | cart badge | outline "Let's Talk"), and a two-line headline at the bottom start. Under it, a one-sentence
   value line plus a white pill CTA "GET INVOLVED" with a round olive arrow chip. A dark bottom gradient keeps the white
   text readable.
2. **Mission + proof bento** (desktop-02): a centred statement, then 3 cards of equal height: (a) a stat card
   "1.2M+ trees planted", (b) a photo card "Vision" with text overlaid, (c) a solid olive card "Building a future with
   nature" with an avatar chip. This builds trust *before* asking for anything.
3. **About + first campaign teaser** (desktop-03): tag pills list the cause areas ("Coral Protection", "Habitat
   Restoration"…). That works as a visual "category" vocabulary but is **not interactive**. Below it, a wide photo with a
   **white card overlaid** at the bottom start: category label, campaign title, one-line summary, "DONATE NOW ↗". This is
   the first time a specific campaign is introduced.
4. **Programmes / categories** (desktop-04): photo + 2×2 cards, each with a round olive icon chip, title and 2-line
   description. These are the cause categories.
5. **Impact stats band** (desktop-04/05): full-width olive panel with a faint topographic line pattern, a short claim on
   the start side and 3 big numbers ("80+ active projects", "250+ species", "300K+ volunteers").
6. **Featured projects, a scannable list** (desktop-05/06): this is the strongest pattern for us. A large off-white
   panel holds **one row per project in 3 columns**:
   - **start column:** location (pin icon + "Palawan, Philippines"), project title, and "READ MORE ↗" pinned to the bottom;
   - **middle:** a landscape photo;
   - **end column:** a 2–3 line summary plus a **key/value table with dividers**: `DONATION RAISED $850K`,
     `DATE October 22, 2028`, `IMPACT 25 marine sites restored`.
   The labels are uppercase grey, the values medium ink and end-aligned. This reads like a ledger, so it scans very well.
   A "GET INVOLVED" pill sits on the end side of the header row.
7. **Partner strip** (desktop-06): eyebrow + one line of text, a vertical divider, then a logo row.
8. **Campaign listing, a carousel of cards** (desktop-06/07): the "Campaigns · Protecting Nature Together" header, then
   3 cards per view. Each card has an inset photo (~8 px inner margin, rounded) with a **frosted category pill on the
   photo** ("Protection", "Restoration"), a title, a 2-line summary, a divider, `End date:` with the date, and
   "LEARN MORE ↗". Below: round prev/next arrows on the start side and a "GET INVOLVED" pill on the end side.
   **No progress bar, no raised/goal numbers on the cards, no filters, no search, no "view all campaigns" link.**
9. **Closing CTA band** (desktop-07): olive panel with a topographic pattern, centred white headline "Together, We Can
   Make a Difference", a sub-line and a white pill CTA.
10. Team (staggered portraits), FAQ accordion with a "+" marker on the start side, a "Have any questions? → Reach out"
    card, and a dark footer with a newsletter field.

## Image candidates from the reference (reference only — not reusable)

The project's text states no licence; Behance work is © the author unless stated otherwise. The photos also look like
AI-generated or stock images. **Not downloaded. Reference only. Not reusable.**

| What | Where | Fits our rules? |
|---|---|---|
| Aerial forest with a winding road (hero) | homepage image, top · image URL `…/fs_webp/c53368256833273.6ac79a64461d3.png` | No people. The mood fits (calm, landscape, overlay-friendly) |
| Hands holding a seedling ("Vision" card) | same image | **No:** hands |
| Coral reef / turquoise shallow water (featured + campaign card) | same image | No people, but the subject doesn't fit Salamiyah |
| Topographic contour-line pattern on olive (stats & CTA bands) | same image | **Abstract and easy to recreate ourselves as an SVG** (no licence issue if we draw our own) |
| Dark wood-grain floor | cover image `…/max_1200_webp/b6f687256833273.6ac79a64468b2.jpg` | Texture, but marketing-only |
| Volunteers, elephants, team portraits | homepage | **No:** people/faces |

## Free-licence fallbacks (verified on Wikimedia Commons via the API on 2026-11-24; viewed as thumbnails; not downloaded)

| # | Page | Licence | Attribution text | Size | Notes |
|---|---|---|---|---|---|
| 1 | https://commons.wikimedia.org/wiki/File:Olive_groves_in_Syria.jpg | CC BY 3.0 DE | "Olive groves in Syria" by High Contrast, CC BY 3.0 DE, via Wikimedia Commons | 2300×1270 | Syrian olive terraces + hills. No people visible. A small house in the mid-ground. Good hero, landscape crop |
| 2 | https://commons.wikimedia.org/wiki/File:Salamiyya,view.jpg | CC BY-SA 3.0 | "Salamiyya, view" by Bertramz, CC BY-SA 3.0, via Wikimedia Commons | 1920×1055 | Salamiyah from outside the town across dry fields. Local and calm. **Check at full size for minarets/religious buildings before use**; share-alike applies to the image if modified |
| 3 | https://commons.wikimedia.org/wiki/File:Young_seedling_of_tomato_emerging_from_soil_-_India.jpg | CC BY 4.0 | "Young seedling of tomato emerging from soil" by Ksheera Piraati, CC BY 4.0, via Wikimedia Commons | 5184×3456 | Single seedling on warm soil with shallow focus. Good section/empty-state background |
| 4 | https://commons.wikimedia.org/wiki/File:Sunset-over-the-wheat-field-featured.jpg | CC BY 4.0 | "Sunset over the wheat field" by Dreamy Pixel, CC BY 4.0, via Wikimedia Commons | 6000×4912 | Warm wheat at sunset (Salamiyah is a wheat plain). Dark lower half suits overlaid text |
| 5 | https://commons.wikimedia.org/wiki/File:Polygonal_sandstone_and_limestone_wall.jpg | CC0 | none required (credit "Joselodos" as a courtesy) | 12000×8000 | Stone-wall texture for subtle section backgrounds. Alternative: https://commons.wikimedia.org/wiki/File:Limestone_wall_tileable.jpg (public domain, Coyau, 3447², tileable) |

Rejected: "Olive groves on terraced hills with a rainwater pond in Umm Haratayn" (CC BY-SA 4.0, very fitting landscape)
because **the photographer's shadow (a human silhouette) is in the frame**. Also rejected: the Salamiyah mausoleum and
Ismaili centre photos (religious buildings).

## Answer

The homepage introduces campaigns **in three escalating steps, building trust before showing a list**:

1. **Mission and proof first:** a full-bleed landscape hero with one CTA, then a mission statement and a bento of a big
   stat, a vision photo and a brand card.
2. **A single spotlight campaign:** one campaign card overlaid on a wide photo (category, title, one line, "Donate now"),
   followed by the cause categories as icon cards and an impact-numbers band.
3. **Two scannable formats:** (a) a **"featured" ledger list**, one row per project with location + title | photo |
   summary + a divided key/value table (raised, date, impact); then (b) a **3-up campaign card carousel** with a category
   pill on the photo, a title, a 2-line summary and the end date, closed by a big CTA band.

The scannability comes from repeating eyebrow → heading → short description headers, flat off-white panels, uppercase
labels with end-aligned values, and identical card anatomy. The page **never shows progress toward a goal**, and it has
**no filters and no "view all" link**. Those are gaps for a transparency platform like ours.

## Patterns worth adopting (3–6)

1. **The section header row:** eyebrow (dot + small caps-style label) → large heading on the start side, with a 2-line
   description on the end side. It mirrors cleanly in RTL (heading on the right) and gives every block on our home page
   (categories, campaigns, transparency) the same rhythm.
2. **The key/value "ledger" row for featured campaigns:** labels muted, values in ink, end-aligned, 1 px dividers. In our
   version: `المُجمَّع (موثَّق)`, `المصروف`, `المتبقي`, `المستفيدون: B-…` count. It matches our campaign-account ledger
   and the transparency promise. Add our `give` progress bar above the table, because the reference has none.
3. **Campaign card anatomy:** inset rounded cover, a frosted **category pill on the image** (our `CampaignCategory`
   name + icon), title, 2-line anonymised summary, divider, footer row (target/remaining + "تبرّع" in `give`).
   Equal-height cards in a grid, not a carousel (see below).
4. **A single spotlight campaign overlaid on a wide image** right after the hero, as the bridge from the mission to the
   listing. Use one of our illustration covers, never a beneficiary photo.
5. **An impact-numbers band** in the brand colour with a faint self-drawn contour/pattern SVG. Fill it with our real
   public totals (collected verified, spent, beneficiaries count), with demo money shown separately or left out.
6. **Category chips as the vocabulary**, but make them **real filter links** to the listing (`/campaigns?category=…`),
   unlike the reference's decorative pills.

## What to skip and why

- **The carousel for the main campaign list:** it hides items, needs JS, is awkward with keyboards and screen readers,
  and arrow direction has to be flipped in RTL. Use a static responsive grid (3 / 2 / 1 columns) plus a
  "كل الحملات" link.
- **Text overlaid on busy photos** (hero headline, "Vision" card, team name plates on translucent glass): contrast
  depends on the photo. If we keep a hero image, use a solid dark gradient scrim measured at ≥4.5:1, or put the text
  on a solid surface beside the image.
- **Light-weight grey body text at ~13–14 px:** passes by ratio but reads faint, and Arabic at a light weight below
  13–14 px is worse. Use IBM Plex Sans Arabic regular, ≥15 px for body, `muted` only for labels.
- **UPPERCASE labels and CTAs** ("DONATE NOW", "DONATION RAISED"): Arabic has no case. Express the hierarchy with
  weight, size and colour instead, and don't rely on letter-spacing (it breaks Arabic joining).
- **`↗` arrows and the round arrow chip:** they are directional. In RTL they must mirror (↖) or be replaced with a
  neutral chevron; prev/next arrows likewise.
- **People and faces everywhere** (volunteers, elephant keepers, team portraits): this breaks our beneficiary-privacy
  rule and our illustration-only covers. The team grid has no place on our home page.
- **Text baked into images:** the cover collage is a single raster with English text (not translatable, not
  accessible). Never ship the 12.5 MB full-page PNG approach; keep everything as live text and compressed images.
- **The two-tone mission sentence with an inline photo pill:** decorative, and it splits awkwardly when Arabic text
  reflows. Use plain two-tone text without the inline image at most.
- **Cart icon / "Let's Talk" in the nav:** e-commerce and agency patterns that don't fit a council donation platform.
