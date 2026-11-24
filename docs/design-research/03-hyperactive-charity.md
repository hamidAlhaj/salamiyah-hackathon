# 03 · Hyperactive Charity Fund (Behance): buttons, hover states and transitions

Reference: <https://www.behance.net/gallery/245884799/HYPERACTIVE-CHARITY-FUND-COMMERCIAL-WEBSITE>
(Hyperactive Studio, "Free Spirits Foundation" wildlife-charity landing page concept, published 16 Mar 2026, marked
"© All Rights Reserved" on the page.)

**Question:** which button hierarchy, hover states and transitions make the next action clear?

---

## 1. Method and limitations

- **Tooling:** Playwright (`e2e/node_modules/@playwright/test`) driving the installed Chrome. Viewports were 1440×900 and
  375×812, light scheme. No login, no form submitted, cookie banner not accepted (ignored; Behance auto-showed a
  "We've saved your settings" toast and later a consent bar that sits over the bottom of some shots).
- **Headless was refused:** headless Chrome got **HTTP 400** from Behance. Headed Chrome loaded the page normally (an
  initial 403 then an automatic 200 with no challenge to solve). All captures come from the headed run.
- **Videos blocked:** the project has **4 Vimeo embeds** (`player.vimeo.com/video/1173933906`, `1173934503`,
  `1173939684`, `1173934145`). They are almost certainly the hover/scroll motion demos. Inside the automated browser
  Vimeo showed *"We couldn't verify the security of your connection. Access to this content has been restricted."*
  I did not try to get around this, so **no motion was observed**. Everything about transitions below is an
  inference from static frames and is marked as such.
- **Behance shows images, not live CSS.** Nothing in this report is "measured CSS" of the design. The only measured
  values are colour samples taken from my own screenshots (canvas `getImageData` on data-URL copies). Sampling the CDN
  images directly timed out, so I sampled the screenshots instead. JPEG q70 shifts hues by about ±4/255.
- The first scroll pass at 375px stalled after 7 shots (the Vimeo iframes hung the page). The desktop pass finished, and a
  second per-module pass captured all 17 modules.
- Legend used below: **[image]** = observed in the design images; **[measured]** = sampled pixel value;
  **[inferred]** = my reading, not shown.

## 2. Screenshots (`docs/design-research/shots/03/`)

| File(s) | Content |
|---|---|
| `desktop-00` … `desktop-21.jpg` | 1440px viewport scroll steps (90% overlap step). 14–17 are blank lazy areas from the first fast pass. 18–21 are the Behance footer. |
| `mobile-00` … `mobile-12.jpg` (even numbers) | 375px viewport scroll steps (Behance mobile layout; the design images are scaled down) |
| `module-01.jpg` | Intro: project text, meta row (Project / Category / Year) |
| `module-02.jpg` | Laptop mockup on green velvet: full desktop home page |
| `module-04.jpg` | Parrot photo + social post card (pink) |
| `module-05.jpg` | Tablet on wood desk: "Impact in Numbers" bento |
| `module-07.jpg` | Close-up animal photo (gecko) |
| `module-08.jpg` | Jobs-to-be-done bubbles + home page |
| `module-09.jpg` | "Latest reports" list card + giraffe photo |
| `module-10.jpg` | Desktop and mobile full-page layouts (best overview of buttons and cards) |
| `module-12.jpg` | Typography: Hodurah display, Apercu Pro, size scale |
| `module-13.jpg` | Phone on dark rock texture: mission section with three action cards |
| `module-14.jpg` | Colour palette with names and hex codes |
| `module-15.jpg` | Laptop on plaster wall: impact grid |
| `module-16.jpg` | "Thank you" closing slide |
| `module-00/03/06/11-video-blocked.jpg` | One frame per Vimeo module showing the block or empty player (evidence) |

## 3. Palette (observed)

The designer's own palette slide (`module-14`) **[image]**, cross-checked with sampled pixels **[measured]**:

| Name in design | Hex shown on slide | Sampled from screenshots | Approx. share (all modules) | Role in the design |
|---|---|---|---|---|
| Deep Forest | `#075D44` | `#075C44`/`#075C45` | ~6% (24% of module-04, 27% of module-12) | Brand. Primary filled tiles, "Contact us" pill, menu button, headings |
| Wild Orchid | `#FFC5EE` | `#FEC6ED` | ~10% | Secondary accent. "Donate now" pill, highlight cards |
| Wild Orchid ink (text on pink) | not given | `#640848` / `#5C0844` | <1% | Dark plum text on pink |
| Fresh Meadow | `#D0F17A` | `#D0F17E` | ~2% | Lime stat tile, small icon fills |
| Forest Sage | `#71A888` | ≈`#689868`–`#71A888` | ~1% | Softer green tiles, "Numbers" highlight in headings |
| Soft Mist | `#E6E8EC` | `#E7E8EA` | ~3% | Neutral cards (third action card, list rows) |
| Onyx | not legible (the slide repeats `#71A888`, a likely typo) | `#161616` | ~3% (UI) | Text, device frames |
| Page white | n/a | `#F8F8F8`–`#FFFFFF` | ~32% | Page and card surfaces |
| JTBD mint bubble | n/a | `#E1F8D8` | <1% | Quote bubbles |

The remaining share (~12% `#080808`, dark greens `#0D2D22`–`#183828`) comes from photography and dark mockup backdrops,
not from the UI.

**Takeaway:** one dark saturated brand colour (forest green) carries the primary action. One light, high-chroma accent
(orchid pink) carries the *emotional* donate action and cards. Lime and sage are only for data tiles. That matches our
`accent` (Salamiyah green) + `give` split.

## 4. Button hierarchy (observed in images)

| Level | Look **[image]** | When used **[image]** |
|---|---|---|
| **Primary (brand)** | Deep-Forest fill, white text, small fully-rounded pill (~28–32px tall at design scale), no icon | Header "Contact us" (top-right of the nav), the one persistent action |
| **Primary (give)** | Wild-Orchid pink fill, Deep-Forest/plum text, pill, no icon | "Donate now" under the hero copy, and in the mobile hero card as a **full-width** pill |
| **Card-as-button (large)** | Whole rounded card (radius ~16–20px) filled with brand / pink / mist, title in condensed display caps, 1–2 line description, **↗ arrow icon in the top corner** | Mission section: "Wildlife rescue" (green), "Rehabilitation" (pink), "Conservation" (mist). Each card is a route to a section. The colour order matches the priority order. |
| **Tile link (in data tiles)** | Text-only small label + ↗, placed at the tile's top-right corner, inheriting the tile colour | "See more ↗", "Join us ↗", "Make donation ↗" inside impact tiles, "Total donations received ↗", "Rescued animals ↗", "Latest reports ↗" |
| **Icon button** | Square rounded (radius ~8px) Deep-Forest tile with a white ☰ glyph | Mobile menu toggle |
| **Nav link (tertiary)** | Plain dark text; the current page is **underlined** ("Home") | Header nav: Home / Donation / Rescue missions / About us / Contacts |
| **Ghost/outline** | **Not used anywhere.** No outline buttons in any frame. | n/a |

Key hierarchy rules visible in the design:

1. **At most two filled pills per view** (green "Contact us" + pink "Donate now"), never side by side. Everything
   else is a card or a text+arrow link.
2. **The arrow (↗) marks "this whole surface is clickable"**. It appears on every card or tile that navigates, and never on
   plain content cards.
3. **Colour encodes rank**: green = do this first, pink = give / feel, mist = also available.

## 5. States and transitions

- **Hover / active / focus states: not shown in any still image.** The four blocked Vimeo videos most likely hold
  them **[inferred]**. No pressed or disabled variants appear on the palette or typography slides either.
- **Static cues that do the work of a state [image]:** the underline on the current nav item, and the ↗ affordance on
  clickable cards.
- **Likely motion [inferred, not observed]:** tile-and-arrow layouts like this usually animate the ↗ (diagonal nudge)
  and lift or tint the card on hover, and fade or slide bento tiles in on scroll. Treat this as unverified. Do not
  copy it as "what the reference does".
- **Behance's own chrome (not the design), for contrast only:** Behance's "Appreciate" and "Start Free Trial" are
  blue filled pills and "Sign In" is a pale tinted pill. This is the same filled vs tinted two-level pattern.

## 6. Typography and spacing (observed)

- **Display:** *Hodurah*, a condensed, geometric, all-caps display face with quirky alternates. Used for the wordmark,
  section eyebrows ("OUR MISSION", "RESCUE PROCESS"), card titles and big numerals ("32", "120+", "$2.3M"). The scale
  slide lists H1 80px, H3 48px, H4 32px, H5 24px.
- **Text:** *Apercu Pro* Bold/Regular. H2 80px, H6 24px, main text 18px, small 16px. Section headings mix the two
  inks: "Impact in **Numbers**" with the second word in sage or green.
- **Layout:** a bento grid of rounded tiles (radius ~16–24px at desktop) with tight ~8px gutters. The hero is a
  white card with an organic animal-silhouette photo mask. Sections sit in large white rounded panels with generous
  inner padding (~64px). On mobile, tiles stack full-width and the action cards keep their colour order.
- **Numbered process** ("1 Rescue mission … 4 Safe future"): big numerals in alternating green, pink, sage and plum, with
  photos staggered left and right.

## 7. Image candidates in the reference (reference only, not reusable)

The page states "© All Rights Reserved". No licence for reuse was found, so **nothing was downloaded** to
`images/candidates/`. Most images show animals and people (excluded by our rules). These backgrounds fit our
*type* of imagery:

| Module | Image URL (1400px variant; 2800/max_3840 variants exist) | Description | Licence |
|---|---|---|---|
| 02 | `https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/1c2872245884799.69b7ca20de054.png` | Deep-green velvet fabric folds (laptop mockup sits on top) | © All Rights Reserved. Reference only, not reusable |
| 05 | `https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/fcd04c245884799.69b7ca20d4923.png` | Warm wood-grain desk top, moss-green backdrop | © All Rights Reserved. Reference only, not reusable |
| 13 | `https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/ecfcc9245884799.69b7ca20d5df6.png` | Dark slate/coal rock texture | © All Rights Reserved. Reference only, not reusable |
| 15 | `https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/836e35245884799.69b7ca20d4250.png` | Warm limestone/plaster wall with soft light, dried pampas grass | © All Rights Reserved. Reference only, not reusable |

The page URL for all of them is the reference link above. Each is a device mockup composite and is 1400px wide in the
variant listed.

## 8. Free-licence fallbacks (pages verified to exist; not downloaded)

| # | Page | Description | Licence | Attribution text |
|---|---|---|---|---|
| 1 | <https://unsplash.com/photos/seedlings-sprout-from-the-freshly-tilled-earth-v_rgqR0vvOE> | Rows of seedlings in freshly tilled soil ("growth / أثر") | Unsplash License (free, attribution appreciated) | Photo by Hannes Knutsson on Unsplash |
| 2 | <https://unsplash.com/photos/a-close-up-of-a-bush-with-green-leaves-rDIo23uIQrY> | Dense green privet leaves, an even texture good for a dark-overlay section background | Unsplash License | Photo by Wyxina Tresse on Unsplash |
| 3 | <https://unsplash.com/photos/close-up-of-golden-wheat-stalks-in-a-field-9mCm4XytIPg> | Golden wheat stalks at golden hour (Egypt), regional agricultural feel | Unsplash License | Photo by Omar Abozeid on Unsplash |
| 4 | <https://unsplash.com/photos/ripples-reflect-sunlight-on-the-waters-surface-MBFdtqJr3kE> | Sunlit ripples on dark water, abstract and calm | Unsplash License | Photo by Isi Parente on Unsplash |
| 5 | <https://commons.wikimedia.org/wiki/File:Al-Ghab_plain_and_Syrian_coastal_mountains,_Apamea,_Syria.jpg> | Al-Ghab plain and coastal mountains seen from Apamea, Syria (4000×3000) | CC BY 4.0 | "Al-Ghab plain and Syrian coastal mountains, Apamea, Syria" by Vyacheslav Argenberg, CC BY 4.0, via Wikimedia Commons |

The licence pages confirm no Unsplash+ restriction. Before use, check each image visually for people and hands. The
page text did not mention any, but I did not view the full-resolution files.

---

## Answer

What makes the next action clear in this design is **rank shown by fill and colour, plus one consistent "this
navigates" signal**. It is not hover effects. Specifically:

- **Two filled pills at most**: a brand-green pill for the institutional action ("Contact us") and a warm accent pill for
  the giving action ("Donate now", full-width on mobile). Nothing else is a filled button.
- **Everything secondary is a coloured card or tile with a corner ↗ arrow**. The whole surface is the hit target, and
  card colour order (green → pink → grey) encodes priority.
- **Tertiary is plain text**, with the current page underlined. There are no outline or ghost buttons.

Hover, active and focus states and motion are **not visible** in the published stills. The four Vimeo demos that
probably show them could not be played (Vimeo blocked the automated browser). Our states should therefore come from
our own system, not from this reference.

## Patterns worth adopting (3–6)

1. **Two-pill rule per screen:** `accent` (Salamiyah green) filled pill for the main institutional or flow action;
   `give` filled pill only for «تبرّع الآن» / Donate. Never put both pills in the same button group, so the donate
   action has no competitor.
2. **Card-as-link with a corner direction glyph** for campaign categories, transparency-dashboard tiles ("المصروفات",
   "المستفيدون") and "see all" tiles. The whole card is one `<a>` with a visible focus ring, and the glyph is the only
   decoration.
3. **Colour-ranked action cards:** on the home page, use three category or route cards ordered by priority
   (accent-filled → give-tinted → surface/neutral). Text labels must carry the meaning; colour only adds to it.
4. **Bento stat tiles with an embedded tile link** ("Make donation ↗" inside the funds-raised tile). This fits the
   transparency dashboard: each number links to its evidence (expenditures, receipts).
5. **Full-width primary pill on mobile** for Donate, which is our donor app and `(public)` campaign page at 375px.
6. **Current-page underline in nav** instead of colour-only active states.

## What to skip and why

- **The ↗ arrow as-is.** It is directional. In RTL a "go forward" diagonal must point **up-left (↖)**. Use a
  logical icon that mirrors under `dir="rtl"` (e.g. CSS `scale-x: -1` on `[dir=rtl]`) or a non-directional
  chevron that also mirrors. Never hard-code ↗ in Arabic UI.
- **Colour-only priority and states.** Green vs pink vs grey cards differ only by fill. Keep text labels, and add a
  non-colour hover/focus cue (underline, border or elevation change, plus our `focus-visible` ring) so that
  colour-blind users and keyboard users can see the state.
- **Pink `#FFC5EE` with white text, or small sage text on white.** Sage `#71A888` on white is about 2.7:1, which fails
  AA for body text. "Numbers" highlights and the light-green small captions in tiles also look below 4.5:1. If we
  borrow a light accent, use dark ink on it (their plum `#640848` on pink is fine, about 9:1).
- **Any motion we "imagine" from this reference** (arrow nudge, tile lift, scroll-in fades). It is not verified. If we
  add motion it should be ≤150–200ms ease-out on transform/opacity only, and switched off under
  `prefers-reduced-motion: reduce`.
- **Hodurah-style condensed all-caps display.** It has no Arabic counterpart, and Arabic has no case. It would also
  break our IBM Plex Sans Arabic / Noto Kufi Arabic rules. Keep the *idea* of an eyebrow plus a two-ink heading, not
  the font.
- **Photo-mask hero with people or animals and organic silhouettes.** It conflicts with our "covers are illustrations,
  no beneficiary photos" rule and is heavy for low bandwidth.
- **Hot pink as a second brand colour.** It is off-brand for the council. Our `give` token already plays this role.
