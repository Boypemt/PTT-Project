# Changelog

What each release of the Pa Ton Phueng customizer contained, newest first.
Loosely [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
the tags described in [`docs/RELEASING.md`](docs/RELEASING.md).

## [Unreleased]

### Added

- **The designer's first seven patterns.** ลายหินอ่อน, ลายมัดย้อมคราม,
  ลายมะนาว, ลายดาว and ลายทางพาสเทล print as repeating cloth; ลายหัวใจ and
  ลายวงกลม are laid into the print area once, which is what they are — one
  drawing filling the cloth rather than a surface that repeats. They are listed
  before the drawn placeholders in the library, and only the placeholders carry
  the "ตัวอย่าง / placeholder" badge. Names and credits are provisional.
- **A pattern can say how big its repeat is**, in the mockup's own units
  (`repeatUnits`), so "one repeat across half the shawl" is a decision in the
  catalog rather than an accident of what the artwork was exported at.
- **`npm run catalog:import -- <dir>`** converts the designer's artwork into
  catalog assets — a WebP under 600 KB plus a thumbnail per pattern — and
  scores each tile's seams, warning where a tile will not meet itself when it
  repeats. The originals stay with the designer.
- **[`docs/ADDING_PATTERNS.md`](docs/ADDING_PATTERNS.md)**, Thai and English:
  everything needed to send a pattern and add it, without reading any code.

### Changed

- **The leaf dyes are hidden for a pattern that cannot be recoloured.** A
  photographed pattern carries its colours in the file, so the picker is gone
  rather than refusing every tap. The cloth itself still takes a leaf dye.
- Photographed patterns are drawn straight from their file instead of being
  redrawn at twice their size, which is what keeps a hand-drawn SVG sharp and
  does nothing at all for a bitmap.

## [0.2.0] — 2026-10-17

M2 finished: the customizer a visitor can design on. Tiles, leaf dyes and the
base cloth were already there; this is the half that makes it eco-print —
single leaves, laid where the community lays them.

### Added

- **Leaf motifs.** Single leaves can be laid on the cloth the way eco-printing
  does it: tap a leaf and it lands in the middle of the print area, drag it,
  and scale or turn it with handles that keep its shape and snap to every 45°.
  It stays inside the area it prints on while you drag rather than snapping
  back afterwards. This also opens the print areas that take nothing but
  motifs — the handkerchief's corner, the wrap cloth's centre, the plate's
  centre. A selected leaf has its own panel — size, rotation, strength, leaf
  dyes, copy, reset, delete — and on a desktop the arrow keys nudge it,
  Shift+arrows further, Delete removes it and Ctrl/Cmd+D copies it, while the
  cloth has the focus.
- **"โปรยใบไม้ / Scatter leaves".** One tap throws five to eight leaves across
  the print area at random places, angles and sizes — the look the community's
  cloth actually has, which laying one leaf at a time takes a dozen taps to
  reach. Only patterns that name the leaves they are made from are thrown, so
  the designer's own entries decide what a scatter uses.

### Changed

- **The `motifs` flag is gone**, which is what put the two above on the demo
  link. They went into `main` switched off and were tried on Preview first;
  removing the flag is the last commit of that feature, as
  [`docs/RELEASING.md`](docs/RELEASING.md) has it. The flag machinery stays for
  what is still to come, and so does the e2e suite's second, flagged build —
  generic now, and building nothing while no feature is behind a flag.

### Fixed

- **Thai typography.** Wide letter-spacing and `uppercase` now apply only when
  the page is in English. Tracking pushed Thai vowel and tone marks off the
  consonant they belong to, which showed on the landing eyebrow
  (วิสาหกิจชุมชนป่าต้นผึ้ง) and the placeholder badge.
- **The pattern names on a phone.** Putting leaves in everyone's hands added
  two rows to the sheet above the pattern strip, and the strip is what gave
  way: the names under the swatches fell below the fold, so choosing a pattern
  by anything but its picture meant scrolling the sheet and losing sight of
  the cloth. The kind toggle and "โปรยใบไม้" now share a row, and on a phone
  the swatch is a band rather than a square with the placeholder badge in its
  corner. Nothing moves from tablet width up.
- **Two tests that raced the code they were watching.** A handful of
  assertions read what a React effect writes — the `noindex` tag on
  `/dev/catalog`, the store's print area — on the paint before the effect had
  run, and lost that race about one full-suite run in six on a loaded machine.
  They wait now. Nothing a visitor meets changed; a red CI run that means
  nothing is how a suite stops being read.

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
