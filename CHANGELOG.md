# Changelog

What each release of the Pa Ton Phueng customizer contained, newest first.
Loosely [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
the tags described in [`docs/RELEASING.md`](docs/RELEASING.md).

## [Unreleased]

### Added

- **Leaf motifs, behind the `motifs` flag.** Single leaves can be laid on the
  cloth the way eco-printing does it: tap a leaf and it lands in the middle of
  the print area, drag it, and scale or turn it with handles that keep its
  shape and snap to every 45°. It stays inside the area it prints on while you
  drag rather than snapping back afterwards. This also opens the print areas
  that take nothing but motifs — the handkerchief's corner, the wrap cloth's
  centre, the plate's centre. A selected leaf has its own panel — size,
  rotation, strength, leaf dyes, copy, reset, delete — and on a desktop the
  arrow keys nudge it, Shift+arrows further, Delete removes it and Ctrl/Cmd+D
  copies it, while the cloth has the focus. Off in production:
  `VITE_FLAGS=motifs` is set on Vercel's Preview environment only, and the e2e
  suite runs both states.
- **"โปรยใบไม้ / Scatter leaves"**, behind the same flag. One tap throws five
  to eight leaves across the print area at random places, angles and sizes —
  the look the community's cloth actually has, which laying one leaf at a time
  takes a dozen taps to reach. Only patterns that name the leaves they are
  made from are thrown, so the designer's own entries decide what a scatter
  uses.

### Fixed

- **Thai typography.** Wide letter-spacing and `uppercase` now apply only when
  the page is in English. Tracking pushed Thai vowel and tone marks off the
  consonant they belong to, which showed on the landing eyebrow
  (วิสาหกิจชุมชนป่าต้นผึ้ง) and the placeholder badge.

## [0.1.0-demo] — not yet tagged

The prototype as it is first shown: a visitor can choose a product, print
community patterns on it in the leaf dyes the community makes, and see the
result live. Patterns and mockups are placeholders until the designer delivers
the real ones, and every one of them is replaced by editing
`public/catalog/*.json` — no code change.

### Added

- **Catalogue as data.** `products.json`, `patterns.json` and `leaf-dyes.json`
  under `public/catalog/`, validated with zod at load time and checked against
  each other. A bad file names itself, the entry and the field on screen, so
  the designer can fix it from a preview link. `/dev/catalog` shows every
  entry and asset for review.
- **Placeholder assets.** Seven tiles (seigaiha, asanoha, gingham, polka, ikat
  stripes, vine scroll, eco-print leaf scatter) and seven leaf motifs drawn as
  SVG in this repo, CC0 and listed in [`docs/CREDITS.md`](docs/CREDITS.md),
  plus a drawn mockup per product. Each carries `"source": "placeholder"` so it
  can be filtered or swapped.
- **Landing page** with the community's own story: 42 households, the 983-rai
  community forest, the 5% of revenue _planned_ for the forest fund, the
  colours the leaves give, and the three steps of designing.
- **Product picker** — eleven products with prices, best-seller and concept
  badges and a filter by line.
- **Customizer** at `/customize/:productId`: a Konva canvas with the product
  mockup, print areas clipped from the catalogue, tile layers with scale,
  rotation, offset and strength, a layer list that reorders and deletes,
  recolouring by leaf dye, and the base cloth colour. It is one screen on a
  phone, with the two panels in a sheet under the canvas.
- **Thai and English** throughout, Thai by default and as the fallback, with
  the choice remembered.
- **Quality gate.** 298 unit tests (Vitest) and a Playwright suite run at
  desktop and Pixel 7 widths — the demo flow, the broken-catalogue state, an
  axe pass at WCAG 2.1 AA and a screenshot of the editor — ESLint, Prettier,
  commitlint, Husky, GitHub Actions CI and Vercel previews on every PR.
- **Feature flags** (`VITE_FLAGS`), so unfinished work can sit in `main`
  switched off rather than on a branch.

### Not in it yet

Placeable leaf motifs (roadmap 09), undo/redo and the share link (11), PNG
export and the order request (12), the designer handoff guide (15) and the 3D
preview (16). The leaf-dye hexes are approximations until the community
colour-matches them against real cloth.
