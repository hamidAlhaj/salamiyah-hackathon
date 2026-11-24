# Athar (أثر) brand files

- `v2/` — **the final logo set** (team decision): the word «أثر» in green `#0F6B2F` inside a gold `#C9A13B` ring with
  leaves and an open hand. Logos (`athar-logo*`, 1057×533) and square icons (`athar-icon*`, 512×512), SVG + PNG:
  `athar-logo` (transparent), `athar-logo-white-bg`, `athar-logo-dark` (white word on `#0B3D2A`, for dark mode),
  `athar-logo-mono`, `athar-icon` (transparent), `athar-icon-green` (app icon on deep green), `athar-icon-white`.
- `derived/` — files generated from the v2 SVGs (Chrome render, no extra tools), colours unchanged:
  - `athar-icon-dark.svg/.png` — `athar-icon-green` without its tile: gold `#D9B45A` + white word on transparent.
    Used on dark surfaces (web header in dark mode, login and receipt panels, mobile header, maskable PWA icon).
  - `athar-icon-green-square.png` — the green app icon with square corners (iOS rounds icons itself).
  - `athar-adaptive-foreground.png` — the white-word logo at 62 % inside the Android adaptive-icon safe zone
    (background `#0B3D2A` in `mobile/app.json`).
  - `apple-icon-180.png` — `frontend/src/app/apple-icon.png`.
- `old/` — the earlier ripple logo, obsolete, kept for the record.

Copies used by the apps: `frontend/public/brand/`, `frontend/src/app/icon.svg` (= `athar-icon-green.svg`),
`mobile/assets/brand/`.
