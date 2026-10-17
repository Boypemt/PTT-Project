# Credits

Every image in this repository was either drawn for this project as
hand-written SVG or delivered by the project's own designer.
**No third-party assets, stock photographs or brand-owned patterns are used.**
Each drawn file is released as CC0-1.0, and each catalog entry repeats its
licence in its `source` field so stand-ins can be filtered or replaced as data.

CLAUDE.md requires a row here for every third-party asset (name, source URL,
license). There are none. The community patterns below are the designer's own
work, delivered for this project; their credit line and licence wording are
still to be settled with the community, which is what `"Designer TBC"` and
`"Community-owned — terms TBC"` say in the catalog.

## Product mockups — `public/catalog/products/`

Flat illustrations, 1000x1000 viewBox, one white `-base.svg` silhouette plus
one grey `-overlay.svg` of folds and shading per product. **All are stand-ins
for real product photography.**

| Files | Product | Author | License |
| --- | --- | --- | --- |
| `shawl-cotton-base.svg`, `shawl-cotton-overlay.svg` | Cotton shawl | Drawn for this project | CC0-1.0 |
| `shawl-silk-base.svg`, `shawl-silk-overlay.svg` | Silk shawl (shawl shape, satin sheen overlay) | Drawn for this project | CC0-1.0 |
| `handkerchief-base.svg`, `handkerchief-overlay.svg` | Handkerchief | Drawn for this project | CC0-1.0 |
| `shirt-women-base.svg`, `shirt-women-overlay.svg` | Women's shirt | Drawn for this project | CC0-1.0 |
| `shirt-men-base.svg`, `shirt-men-overlay.svg` | Men's shirt | Drawn for this project | CC0-1.0 |
| `wrap-cloth-base.svg`, `wrap-cloth-overlay.svg` | Gift wrap cloth | Drawn for this project | CC0-1.0 |
| `leaf-plate-base.svg`, `leaf-plate-overlay.svg` | Printed leaf plate | Drawn for this project | CC0-1.0 |
| `fan-base.svg`, `fan-overlay.svg` | Fan | Drawn for this project | CC0-1.0 |
| `keychain-base.svg`, `keychain-overlay.svg` | Keychain tag | Drawn for this project | CC0-1.0 |
| `mug-base.svg`, `mug-overlay.svg` | Ceramic mug (planned product) | Drawn for this project | CC0-1.0 |
| `tumbler-base.svg`, `tumbler-overlay.svg` | Tumbler (planned product) | Drawn for this project | CC0-1.0 |

## Pattern tiles — `public/catalog/patterns/`

| File | Pattern | Author | License |
| --- | --- | --- | --- |
| `seigaiha.svg` | Seigaiha waves | Drawn for this project | CC0-1.0 |
| `asanoha.svg` | Asanoha hemp leaf | Drawn for this project | CC0-1.0 |
| `gingham.svg` | Gingham check | Drawn for this project | CC0-1.0 |
| `polka.svg` | Polka dots | Drawn for this project | CC0-1.0 |
| `ikat-stripe.svg` | Ikat stripes | Drawn for this project | CC0-1.0 |
| `vine-scroll.svg` | Vine scroll | Drawn for this project | CC0-1.0 |
| `eco-print-scatter.svg` | Eco-print leaf scatter | Drawn for this project | CC0-1.0 |

Seigaiha, asanoha, gingham, polka dots and ikat are **traditional motifs in
the public domain** — the geometry here was constructed from their description,
not traced from anyone's artwork. `vine-scroll.svg` is an original drawing of a
plain vine scroll; it makes no claim to be Thai lai and is not a copy of any
existing scroll.

## Community patterns — `public/catalog/patterns/community/`

The designer's first delivery. Each arrived as a 2480×3508 PNG and was
converted by `npm run catalog:import` into a WebP with a long edge of 1600 px
plus a 240 px thumbnail; the originals are the designer's masters and are not
kept in this repository.

The files are named `<id>.<hash>.webp` and `<id>.<hash>-thumb.webp`, where the
hash is taken from the artwork — a revision lands under a new name, so the rows
below are listed by id rather than by file name.

| Id | Pattern | Author | License |
| --- | --- | --- | --- |
| `marble-swirl` | ลายหินอ่อน / Marble swirl | Designer TBC | Community-owned — terms TBC |
| `indigo-tie-dye` | ลายมัดย้อมคราม / Indigo tie-dye | Designer TBC | Community-owned — terms TBC |
| `lemons` | ลายมะนาว / Lemons | Designer TBC | Community-owned — terms TBC |
| `stars` | ลายดาว / Stars | Designer TBC | Community-owned — terms TBC |
| `pastel-stripes` | ลายทางพาสเทล / Pastel stripes | Designer TBC | Community-owned — terms TBC |
| `hearts` | ลายหัวใจ / Hearts (placement) | Designer TBC | Community-owned — terms TBC |
| `bubbles` | ลายวงกลม / Bubbles (placement) | Designer TBC | Community-owned — terms TBC |

Replace the author and licence columns — and the `source` block of each entry
in `public/catalog/patterns.json` — once the community has agreed how these
should be credited.

## Leaf motifs — `public/catalog/patterns/`

| File | Motif | Author | License |
| --- | --- | --- | --- |
| `teak.svg` | Teak leaf (ใบสัก) | Drawn for this project | CC0-1.0 |
| `golden-teak.svg` | Golden teak leaf (ใบสักทอง) | Drawn for this project | CC0-1.0 |
| `mango.svg` | Mango leaf (ใบมะม่วงเบา) | Drawn for this project | CC0-1.0 |
| `marigold-flower.svg` | Marigold flower (ดอกดาวเรือง) | Drawn for this project | CC0-1.0 |
| `pheka.svg` | Oroxylum leaflet (ใบเพกา) | Drawn for this project | CC0-1.0 |
| `takhop.svg` | Jamaica cherry leaf (ใบตะขบ) | Drawn for this project | CC0-1.0 |
| `tong-tung.svg` | Tong tung leaf (ใบตองตึง) | Drawn for this project | CC0-1.0 |

The leaf shapes are generic botanical silhouettes of the species the community
dyes with, drawn by hand. They are placeholders for prints taken from the
community's own leaves.

## Other

| File | What | Author | License |
| --- | --- | --- | --- |
| `public/favicon.svg` | Leaf favicon | Drawn for this project | CC0-1.0 |

## Colours

The leaf-dye hex values in `public/catalog/leaf-dyes.json` and the theme tokens
in `src/index.css` are approximations of the colours named in the community's
reports (see `docs/PROJECT_BRIEF.md`). They are marked as placeholders until
they can be colour-matched against real fabric samples.
