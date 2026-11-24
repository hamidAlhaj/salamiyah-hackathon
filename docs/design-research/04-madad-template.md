# 04 · Madad (مَدَد): free charity and donation Figma template

Reference: <https://www.behance.net/gallery/258479807/Madad-Free-Charity-Donation-Figma-Template>
Owner: Osama Dawood (Cairo). Design credit on the images: "Designed by GRW Lab · grwlab.net". Published on Behance on 14 November 2026.
Download link on the page: `https://uilix.co/go/madad/figma?from=detail`, which redirects to the Figma Community file
<https://www.figma.com/community/file/1703354299050930437/madad-charity-donation-template>.

Question: **how do campaign details, progress and donation choices read together on a phone?**

---

## 1. Method and limitations

| Step | Result |
| --- | --- |
| Playwright (installed Chrome, headless) → Behance page at 1440 and 375 px | **Failed.** `net::ERR_HTTP_RESPONSE_CODE_FAILURE`. `curl` gets **HTTP 403** on the gallery and on `behance.net/`. WebFetch also gets 403. Behance refuses automated clients. I did not try to evade bot detection. |
| Built-in browser pane (the desktop app's real browser) | **Worked.** I read the page text and DOM (title, description, tags, the copyright footer, the download link). I listed the 10 project images and their largest variants (`max_3840_webp`, 3840×2160). Scrolling to the bottom triggers Behance's infinite scroll into another project, so I scrolled only within this project. |
| Image CDN (`mir-s3-cdn-cf.behance.net`) from Playwright | **Worked (200).** I opened each image at 3840×2160 and saved it as a 1440-wide JPEG (q70). I cropped the phone and component regions at full resolution. Palette came from canvas `getImageData` (same origin, so the canvas was not tainted), with a 24-step quantization. Exact UI colours came from 3×3 pixel samples. |
| Figma Community page (browser pane) | Licence and photo statement read with `find` (WebFetch got 403). I did not log in and did not duplicate or download the file. |

Limitations:
- **No page-level screenshots at 1440 and 375 px.** Playwright is blocked, and the browser pane cannot save screenshots to disk. The saved shots are the project images themselves. The Behance page is only a vertical stack of these 10 slides plus the owner sidebar, so nothing design-relevant is missing.
- **Everything below is "observed in image".** Behance shows rendered mockups, so there is no CSS. Sizes in px are estimates from the 390-wide phone frames: the slide says "rebuilt for 390". Hex values are **measured pixels** from the images, not CSS. Where the template states a token itself (slide 6), I label it "stated in template".
- Only one phone **campaign-detail** screen is shown, and only down to the stats block. The story and payment-method sections on the phone are not visible in any slide. The donation card is shown as a separate component (slide 7) and in the desktop detail (slide 9).

## 2. Screenshots (`docs/design-research/shots/04/`)

| File | Content |
| --- | --- |
| `img-01.jpg` | Cover: «٣٢٦ شاشة.» Saffron background. 3 directions, 52 component sets, 191 variables, 12 prototype flows |
| `img-02.jpg` | "Direction 1": transparency page «كل ريال بالأرقام.» (desktop) + **phone campaign detail** |
| `img-03.jpg` | Mood photo (AI-generated man at a well, with a teal gradient overlay) |
| `img-04.jpg` | Three phone directions: "Track your gift", "Light a home" (dark), "General" |
| `img-05.jpg` | «عربي أولًا.» LTR vs RTL sponsorship page side by side |
| `img-06.jpg` | Design system: type pair and 5 colour tokens with hex (stated in template) |
| `img-07.jpg` | «٥٢ مكوّنًا.» components: staff card, CTA pill, gift tile, **quick-donate card**, **campaign card** |
| `img-08.jpg` | «على كل شاشة.» Five phone home and landing screens |
| `img-09.jpg` | «بلا نصوص وهمية.» Grid of 8 desktop pages (incl. campaign detail) |
| `img-10.jpg` | Closing slide: palm grove with logo (AI photo with a person) |
| `crop-phone-campaign-detail.jpg` | Full-res crop of the phone campaign detail (the key screen) |
| `crop-quick-donate-card.jpg` | Full-res crop of «تبرّع سريع» (once/monthly + amount chips + custom amount) |
| `crop-campaign-card.jpg` | Full-res crop of the campaign card (badges, title, progress, donors and days) |
| `crop-desktop-campaign-detail.jpg` | Desktop campaign detail: summary card + quick donate stacked beside the photo |
| `crop-transparency-kpis.jpg` | Transparency KPI row (total donations / programmes / admin / reserve) |
| `crop-phones-row.jpg` | Five phones from slide 8 at full resolution |

These are copyrighted presentation images. Behance says "© All Rights Reserved". Use them for internal reference only and do not ship them.

## 3. Palette (observed)

The template states five tokens (slide 6, "stated in template"). My pixel sampling confirms them.

| Token (template name) | Hex (stated) | Hex (measured in image) | Approx. share across the 10 slides | Role |
| --- | --- | --- | --- | --- |
| حبر *Ink* | `#0A2A2A` | `#082A2A` | ~18 % | Dark sections, top trust bar, phone frames, dark "night" direction |
| تيل *Teal* | `#0E5E5B` | `#0E5E5C` (progress fill) | ~12 % | Brand, accent words in headlines, progress fill, selected chip border |
| رمل *Sand* | `#F6F0E4` | `#F0F0F0`/`#F0F0D8` bins | ~33 % | Page background (warm off-white) |
| زعفران *Saffron* | `#F2A33A` | `#F0A830` bin | ~11 % (93 % of slide 1) | **Donate** pill/CTA only, accent words on dark |
| أبيض *White* | `#FFFFFF` | `#FFFFFF` | ~5 % | Cards on sand |

Secondary UI colours (measured pixels, full-res slide 7):

| Use | Hex |
| --- | --- |
| Progress track, cover placeholder, segmented-control track | `#ECE4D2` (a darker sand) |
| Selected amount chip fill | `#EBF4F3` (teal at about 8 %) with a teal 2px border and a ✓ |
| "Urgent / عاجل" badge background | `#FDEEEB` with red text and a bell icon |
| Category chip on a cover ("مياه") | `#8E897D` grey pill with white text |
| Category chip on the page ("مياه") | very light teal-blue pill with teal text |
| Body/meta text | warm grey (about `#6B665C`, observed only) |

The scheme is teal and saffron on warm sand. Our "Salamiyah green" brand sits close to this teal. The donate-only saffron matches our rule that `give` is used only for donate and progress.

## 4. Phone campaign detail: anatomy (top to bottom, observed in image, 390-wide frame)

Source: `crop-phone-campaign-detail.jpg` ("Direction 1 / General").

1. **Trust bar** (ink background, about 28px high): shield icon + «جمعية خيرية مسجّلة · ترخيص رقم ١٢٣٤». Every page carries this licence line.
2. **Header** (sand background): logo mark + wordmark «مَدَد» at the start edge (right). On the end edge (left): a saffron **pill «♡ تبرّع»** (about 40px high) and a hamburger. A hairline sits below.
3. **Breadcrumb**: «الرئيسية › الحملات › سُقيا الماء لقرى النيجر» (small, grey; the current item is bold ink).
4. **Badges row**: category chip «مياه» (light teal) + urgency chip «🔔 عاجل» (pale red). Both are small pills, about 24px high.
5. **Title**: «سُقيا الماء لقرى النيجر». Display Arabic, about 34–36px, bold, ink, two lines, tight leading (~1.15).
6. **Meta list with icons** (teal outline icons, ~15px grey text):
   - 👥 «١٬٢٤٨ متبرعًا» · ⏱ «١٢ يومًا متبقية» (same line)
   - 📍 «منطقة تاهوا، النيجر»
   - 🛡 «حملة موثّقة · MD-C-0412» (a public campaign code, the same idea as our `B-XXXX`)
7. **Funding card** (white, about 16px radius, soft border and shadow, inset 16px):
   - Raised amount, **large** («٣٧٬٥٠٠ ⃁», ~30px bold, with the new Saudi Riyal sign)
   - «جُمعت من هدف ٥٠٬٠٠٠ ⃁» (target as a sentence, small grey)
   - **Progress bar**: about 8px, fully rounded, teal fill on a `#ECE4D2` track. **It fills from the right (RTL start)**: 75 % filled from the right edge, with the remaining track on the left.
   - Stat stack: «١٢ / يومًا متبقية», «١٬٢٤٨ / متبرعًا», and (from the card and desktop versions) «٧٥٪ / من الهدف». Big number, small label below.
8. *(Not visible on the phone; inferred from desktop slide 9 and component slide 7.)* **Quick-donate card** directly under the funding card (see §5). Then the cover photo and story. On desktop the photo sits beside the two cards. On phone the **title and money come before the image**.

What I did **not** see on the phone: a sticky bottom CTA bar, or a payment-method picker. The persistent donate affordance is the **saffron «تبرّع» pill in the header**, which stays on every screen. Slide 8's phones show a full-width saffron CTA button near the bottom of hero sections.

Campaign **card** (list item, `crop-campaign-card.jpg`): cover area (16:9, sand placeholder with an icon, or a photo) with category and urgency chips overlaid in the corners → title (~20px bold) → one-line summary → raised amount (start) and «٧٥٪» (end, teal) on one row → progress bar → «من هدف ٥٠٬٠٠٠» → footer row «👥 ١٬٢٤٨ متبرعًا» · «⏱ ١٢ يومًا متبقية».

## 5. Donation choices pattern («تبرّع سريع» card, observed in image)

1. Heading «تبرّع سريع» + reassurance line «كل ريال يصل كاملًا لمستحقيه.»
2. **Segmented control**: «مرة واحدة» | «شهريًا» (sand track `#ECE4D2`, white selected thumb, full pill, about 44px).
3. **Amount chips, 3×2 grid**: ٥٠ · ١٠٠ · ٢٥٠ / ٥٠٠ · ١٬٠٠٠ · ٢٬٥٠٠. Each is an outline tile, about 48px high, 12px radius. The selected tile gets a teal border, a `#EBF4F3` fill and a ✓. Order runs RTL: the smallest amount is at the right.
4. **«مبلغ آخر»**: free amount input with the currency sign as a suffix (left in RTL) and the placeholder «أدخل المبلغ».
5. **Dedicate toggle** «أهدِ هذا التبرّع» (gift or in-memory) in a sand sub-card with a switch.
6. (Desktop) a saffron primary CTA follows. Payment method is **not chosen on this card**. It belongs to a later checkout step (a "donation flow" is listed among the 23 pages, but no payment screen is shown on Behance).

So the phone reading order is **what (title and badges) → proof (donors, days left, place, verified code) → money (raised, target, bar, %) → give (frequency → amount → custom → extras → CTA)**. Each step is its own card on a sand page.

## 6. Typography and spacing (observed in image)

- **Type pair (stated in template):** *Alexandria* for display (the geometric Arabic in the big headlines and English sub-heads) + **IBM Plex Sans Arabic** for UI and body (19 text styles). IBM Plex Sans Arabic is already our body font.
- **Numerals:** Eastern Arabic digits (٣٧٬٥٠٠, ١٢, ٪٧٥) in the Arabic UI, Western digits in English. The template advertises "Arabic numerals + the new Riyal sign". Latin codes (MD-C-0412) stay Latin.
- **Hierarchy on the phone:** title ~34px › raised amount ~30px › card titles ~20px › body 15–16px › meta and labels 12–13px. Some labels (breadcrumb, «يومًا متبقية» under stats, the trust bar) look like **~11–12px**. That is below our 13px Arabic minimum.
- **Spacing:** 16px page gutter on a 390 frame. 12–16px between meta rows. Cards have 16–20px padding and 16px radius. About 24px between cards. Pills are fully rounded. Shadows are very soft. Borders are hairlines in a darker sand.
- **Layout:** single column, everything start-aligned (right). Headlines often end with a full stop and colour the second line (teal on sand, saffron on ink). That is the template's signature voice.

## 7. Licence findings

| Source | Statement |
| --- | --- |
| Behance project footer | "© All Rights Reserved". "No use is allowed without explicit permission from owner" applies to the **Behance presentation images**. |
| Figma Community file (the actual download) | "Licensed under **CC BY 4.0**" (link to creativecommons.org/licenses/by/4.0). Description: "Madad is a fictional organisation. **Photos are AI-generated.**" Design credit: GRW Lab. |

Interpretation:
- The **Figma file** (layouts, components, tokens) may be reused with attribution under CC BY 4.0. Copying the *pattern* ideas below needs no licence at all.
- The **Behance images** are all rights reserved. Do not reuse them.
- The **photos** inside the template are AI-generated. CC BY 4.0 on the file plausibly covers them, but whether AI images carry copyright at all is unclear, and the only way to get them is to open or duplicate the Figma file (sign-in). **I downloaded nothing.**

## 8. Image candidates from the template (all "reference only — not reusable")

None passes our content rules and licence check together. Every candidate is visible only via the all-rights-reserved Behance slides, and most contain people.

| Image (slide) | Description | Size | Rules check | Verdict |
| --- | --- | --- | --- | --- |
| Well at sunset (slides 3, 9) | AI man with turban drawing water, camels, sunset | 3840×2160 slide | ✗ person, cultural dress | Reference only |
| Palm grove (slide 10) | Date palms, irrigation channel, a man picking dates | 3840×2160 slide | ✗ person | Reference only. The *subject* (palms and water channel at golden hour) is a good model for our hero mood |
| Zakat still life (slide 4) | Brass scales, lantern, calculator, notebook | crop of a slide | ~ no people, but the lantern and scales read as religious or legal | Reference only |
| School bag still life (slides 4, 5) | Teal bag with a heart logo, notebook, pencils. A child's hand is visible | crop of a slide | ✗ hand, carries Madad branding | Reference only |
| "Light a home" windows (slides 8, 9) | Grid of lit window shapes on ink (UI illustration) | n/a | ✓ abstract | A pattern idea, not a file. We can redraw it ourselves |

Behance image URLs (largest variant): `https://mir-s3-cdn-cf.behance.net/project_modules/max_3840_webp/<id>`, with these ids in order:
`c51b3b258479807.6af80bc17f204.png`, `e2836d258479807.6af804423e11c.png`, `9b6c95258479807.6af804423d784.png`,
`89b13e258479807.6af804423cd2b.png`, `97f64b258479807.6af804423bb05.png`, `ab0d35258479807.6af804423c3f1.png`,
`27faba258479807.6af804423c867.png`, `ef046e258479807.6af804423bf62.png`, `704534258479807.6af80bc17f980.png`,
`51439c258479807.6af804423dbf0.png`.

## 9. Free-licence fallbacks (pages verified to exist; nothing downloaded)

| # | Page | Licence | Description | Attribution text |
| --- | --- | --- | --- | --- |
| 1 | <https://commons.wikimedia.org/wiki/File:---%D9%82%D9%84%D8%B9%D8%A9_%D8%B4%D9%85%D9%8A%D9%85%D9%8A%D8%B3.jpg> | **CC0 1.0** | Shmemis Castle (قلعة شميميس) ruins near Salamiyah. 3096×4128, portrait. Architecture and landscape, local | Optional: "قلعة شميميس — Nairouz9, Wikimedia Commons, CC0" |
| 2 | <https://commons.wikimedia.org/wiki/File:Salamiyya,view.jpg> | CC BY-SA 3.0 | Salamiyya seen from the north-west, 2009. 1920×1055 | "Salamiyya, view — Bertramz, Wikimedia Commons, CC BY-SA 3.0" (share-alike applies to edits of the image) |
| 3 | <https://commons.wikimedia.org/wiki/File:Al-Ghab_plain_and_Syrian_coastal_mountains,_Apamea,_Syria.jpg> | CC BY 4.0 | Al-Ghab fertile plain and mountains from Apamea (Hama region). 4000×3000 | "© Vyacheslav Argenberg, CC BY 4.0, via Wikimedia Commons" (+ "modified" if cropped or tinted) |
| 4 | <https://unsplash.com/photos/seedlings-sprout-from-the-freshly-tilled-earth-v_rgqR0vvOE> | Unsplash License (not Unsplash+) | Seedlings sprouting in tilled soil | "Photo by Hannes Knutsson on Unsplash" (courtesy, not required) |
| 5 | <https://unsplash.com/photos/a-plant-sprouting-from-a-crack-in-the-ground-7jj1crO7XU0> | Unsplash License | A plant sprouting from cracked dry ground (growth, drought) | "Photo by Clark Wilson on Unsplash" |

Caveats: licence and size come from each page's metadata. The browser pane did not render the thumbnails, so check each photo for people, faces and symbols before downloading. Avoid the Salamiyah category's mausoleum, mosque and Ismaili-centre files: they carry religious symbols. `SalamiehHarra.jpg` (CC BY-SA 3.0) is too small for a hero at 604×340.

---

## Answer

On a phone, Madad stacks **separate calm cards on a warm sand page**, in one reading order:

1. **Identity and urgency**: breadcrumb, category and urgency chips, a big two-line title.
2. **Proof before money**: donors, days left, place and a *verified public code*, each with an icon on its own line.
3. **A funding card**: a huge raised amount, then "raised of target X" as a sentence, then a thin, rounded teal bar that **fills from the right**, then big-number stats (%, donors, days).
4. **A separate donate card**: once or monthly, a 3×2 grid of amount chips with a ✓ on the selected one, a custom amount field, an optional dedication, then the saffron CTA.

The payment method comes later, in checkout. A saffron «تبرّع» pill in the header stays on every screen. The phone has no sticky bottom bar.

## Patterns worth adopting

1. **Proof line under the title**: «حملة موثّقة · MD-C-0412» with a shield icon, together with donors, days and area. It maps directly onto our public campaign code and anonymised `B-XXXX` beneficiaries, and supports the transparency brief.
2. **A funding card that leads with the amount and writes the target as a sentence**: «٣٧٬٥٠٠ ل.س» then «جُمعت من هدف ٥٠٬٠٠٠». Add a thin RTL-start bar and three big-number stats. We would extend the bar with our extra segments (pending or "received, pending verification", and demo money shown separately).
3. **Donate as its own card, in order frequency → chips → custom → CTA**: a 3×2 chip grid, the selected state shown by border + tint + ✓ (not colour alone), and the currency as a suffix in the input. The «مرة واحدة / شهريًا» toggle maps onto ORPHAN_SPONSORSHIP monthly sponsorship.
4. **One reserved donate colour**: saffron appears only on donate pills and CTAs. This is exactly our `give` token rule. Teal carries brand and progress.
5. **A trust bar on every page**: a thin ink strip with a shield and «المجلس المحلي في سلمية · …». It is cheap and quietly builds trust.
6. **Transparency KPI row** (slide 2): four white cards («إجمالي التبرعات / صُرف على البرامج / المصاريف الإدارية / رصيد…») with a year selector. A good template for our public dashboard header.

## What to skip and why

- **AI-generated people photography** (the well, palm picker, children, aid workers in branded vests): it breaks our rule against people and faces, it is staged, and it is licence-murky. Use illustrations or the CC0/CC-BY landscapes instead.
- **Sub-13px labels** (trust bar, breadcrumb, stat captions ~11–12px), and grey-on-sand meta text that looks below AA at that size. Keep ≥13px Arabic and our `muted` token that has been checked for contrast.
- **The ~40px header «تبرّع» pill as the only persistent CTA**, and the 24px chips used as touch targets: too small for our users. Make tap targets ≥44px, and on long phone pages consider a sticky bottom «تبرّع» bar that hides near the inline donate card.
- **Progress shown by colour alone**: Madad shows % only on the card, not on the detail bar. Always print the % and amounts in text, and give the bar `role="progressbar"` with `aria-valuenow`. Copy Madad's correct RTL fill direction (from the right). Do not use a CSS `width` bar anchored left in RTL.
- **Mixed numerals**: Madad uses Eastern Arabic digits next to Latin codes (MD-C-0412). That is fine, but pick one digit system per locale and apply it consistently in amounts, %, dates and receipt numbers (`R-YYYY-NNNNNN`) so copy and paste and screen readers behave. Do not mix ٣٧,٥٠٠ and 37,500 on one screen.
- **The Riyal sign and Gulf-specific features** (waqf windows, zakat calculator, "track your shipment" tracking numbers): they are out of scope or Future Scope for us. Our currency is SYP.
- **Three parallel visual "directions"**: we need one calm system. The dark "night" direction is a nice dark-mode reference, nothing more.
