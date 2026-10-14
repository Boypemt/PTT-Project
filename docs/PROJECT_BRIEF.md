# Project brief — Pa Ton Phueng Product Customizer (prototype)

## Client
**วิสาหกิจชุมชนป่าต้นผึ้ง** (Pa Ton Phueng Community Enterprise), Moo 7, Mae Pong, Doi Saket, Chiang Mai.
42 households. Works with Enactus. Two product lines:
1. **Eco-print fabric (ผ้าพิมพ์ลาย)** — real leaves are laid on mordanted cotton/silk, rolled and steamed for 2 h.
   No chemicals; every piece is handmade and unique.
2. **Leaf plates from ใบตองตึง** (dipterocarp leaves) — collecting fallen leaves removes wildfire fuel from the
   983-rai community forest. Story: *"leaves that reduce forest fires become income."*

Today they sell only walk-in and at booths. They want **online sales**, **unique designs nobody else has**,
and to reach hotels, foreign tourists, OTOP and export.

## What this prototype must prove
Visitors can **choose a product, put community patterns on it, customize them, and see the result live**,
then save/share the design or send it as an order request. Patterns from the designer arrive later and must
drop in as data only.

## Products (prototype catalog — prices in THB from the reports)
| id | Product (TH / EN) | Price | Line | Status |
|---|---|---|---|---|
| shawl-cotton | ผ้าคลุมไหล่ / Cotton shawl | 259 | fabric | available (best seller) |
| shawl-silk | ผ้าคลุมไหล่ไหม / Silk shawl | 1,490 | fabric | available |
| handkerchief | ผ้าเช็ดหน้า / Handkerchief | 69 | fabric | available (best seller) |
| shirt-women | เสื้อผู้หญิง / Women's shirt | 599 | fabric | available |
| shirt-men | เสื้อผู้ชาย / Men's shirt | 699 | fabric | available |
| wrap-cloth | ผ้าห่อของขวัญ / Gift wrap cloth | 220 | fabric | available |
| leaf-plate | จานพิมพ์ลาย / Printed leaf plate (pattern on plant-wax paper top layer) | 18 | leaf | available |
| fan | พัด / Fan (leaf, fabric or mixed) | 250 | gift | available |
| keychain | พวงกุญแจ / Keychain (leaf 59, fabric 89) | 59–89 | gift | available |
| mug | แก้วเซรามิค / Ceramic mug | TBD | drinkware | planned (community wish) |
| tumbler | แก้วเก็บความเย็น / Tumbler | TBD | drinkware | planned (community wish) |

## Leaf dyes (the community's real colour vocabulary)
Hex values are **placeholder approximations** — to be colour-matched against real fabric samples later.
| id | Leaf (TH / EN) | Colours |
|---|---|---|
| mango | ใบมะม่วงเบา / Mango leaf | green `#6B8E3D` |
| golden-teak | ใบสักทอง / Golden teak leaf | pinkish-green `#B98A8A`, green-purple `#6A5A72` |
| marigold | ดาวเรือง / Marigold | golden shower yellow `#E8B923`, gold `#C9962B`, yellow-brown `#A67C2E` |
| teak | ใบสัก / Teak leaf | deep purple `#4B2A4F`, deep pink `#A23B62` (strongest colour) |
| pheka | ใบเพกา / Oroxylum leaf | dark brown `#4A3222`, golden yellow `#C9A13B` |
| takhop | ใบตะขบ / Jamaica cherry leaf | yellow-brown `#9C7A3C` |

## Domain model (implement in `src/catalog/types.ts`, validate with zod)
```ts
type Localized = { th: string; en: string };
type AssetSource = { type: 'placeholder' | 'community'; credit: string; license: string; url?: string };

type LeafDye = {
  id: string; name: Localized;
  colors: { id: string; name: Localized; hex: string }[];
  source?: AssetSource;            // placeholder until the hexes are colour-matched to fabric samples
};

type Pattern = {
  id: string;
  name: Localized;
  kind: 'tile' | 'motif';          // tile = repeating surface pattern, motif = single placeable element (e.g. one leaf)
  src: string;                      // SVG or PNG under /catalog/patterns/
  thumbnail?: string;
  recolorable: boolean;             // SVG with fill="currentColor"/CSS vars can be tinted with leaf-dye colours
  defaultColors: string[];          // hex
  leafIds?: string[];               // which leaves it is made from (community patterns)
  tags: string[];
  source: AssetSource;
};

type PrintArea = {
  id: string; name: Localized;
  clip: { type: 'rect'; x: number; y: number; width: number; height: number }
      | { type: 'path'; d: string };            // in mockup coordinate space
  allowedKinds: ('tile' | 'motif')[];
};

type Product = {
  id: string; name: Localized; line: 'fabric' | 'leaf' | 'gift' | 'drinkware';
  price: { min: number; max?: number; currency: 'THB' } | null;
  status: 'available' | 'planned';
  mockup: { base: string; overlay?: string; width: number; height: number }; // overlay = shading/folds drawn on top (multiply)
  printAreas: PrintArea[];
  baseColors: string[];   // fabric/base colour choices
  story?: Localized;
  source?: AssetSource;   // placeholder until real product photography replaces the drawn mockup
};

type Layer =
  | { id: string; type: 'tile'; patternId: string; printAreaId: string; scale: number; rotation: number; offsetX: number; offsetY: number; colors: string[]; opacity: number }
  | { id: string; type: 'motif'; patternId: string; printAreaId: string; x: number; y: number; scale: number; rotation: number; colors: string[]; opacity: number };

type Design = { version: 1; productId: string; baseColor: string; layers: Layer[]; note?: string };
```

## Placeholder patterns (until the designer delivers)
Generated in code as SVG (no licensing risk) plus a few optional public-domain classics:
- Geometric tiles: seigaiha (waves), asanoha (hemp leaf), houndstooth, polka, ikat-style stripes, Thai-style lai kranok-inspired simple scroll (original drawing, not copied).
- "Eco-print style" leaf motifs drawn as SVG silhouettes: teak, mango, marigold, pheka, takhop, tong-tung leaf.
- Optional public-domain images (William Morris *Strawberry Thief*, *Willow Bough*) — only with entry in `docs/CREDITS.md`.

## Out of scope for the prototype
Real payments, user accounts, backend/database, inventory. "Order" = generate a summary + PNG and share via
LINE / Facebook Messenger / email link.
