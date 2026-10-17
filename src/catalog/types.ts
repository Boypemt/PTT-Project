/**
 * The domain model from docs/PROJECT_BRIEF.md ("Domain model").
 *
 * This file is the written form of the model; `schemas.ts` is its runtime
 * guard, and a compile-time check there fails if the two ever drift apart.
 * Shapes the brief writes inline (a price, a clip, a leaf-dye colour) get a
 * name here so other modules can refer to them, but the structure is the same.
 */

export type Localized = { th: string; en: string }

/** Where an asset came from. Placeholder entries can be filtered or replaced later. */
export type AssetSource = {
  type: 'placeholder' | 'community'
  credit: string
  license: string
  url?: string
}

export type LeafDyeColor = { id: string; name: Localized; hex: string }

/** One leaf and the colours it dyes: the community's colour vocabulary. */
export type LeafDye = {
  id: string
  name: Localized
  colors: LeafDyeColor[]
  /** Where the hex values came from; placeholder until colour-matched to fabric. */
  source?: AssetSource
}

/** `tile` repeats across a surface; `motif` is a single placeable element. */
export type PatternKind = 'tile' | 'motif'

/**
 * What a tile does with the print area: `repeat` tiles across it, `area` lays
 * the picture into it once — a drawing that is the whole print rather than a
 * surface pattern. Not a third `PatternKind`, because it changes how the same
 * tile layer is drawn and nothing about what a design records.
 */
export type PatternFit = 'repeat' | 'area'

/**
 * How a pattern takes a leaf-dye colour.
 *
 * `svg` writes the colours into the file's own fills — a drawing made to be
 * tinted. `mask` is for the designer's line art: the import turns its ink into
 * an alpha channel, and the colour is painted through that mask at render
 * time, so the cloth's own colour shows through the ground. A pattern with
 * neither is a picture whose colours are in it already.
 */
export type PatternRecolor = 'svg' | 'mask'

/**
 * Where a pattern may be printed. Absent means everywhere; present, a product
 * qualifies when its line or its id is named.
 */
export type PatternRestriction = {
  lines?: ProductLine[]
  productIds?: string[]
}

export type Pattern = {
  id: string
  name: Localized
  kind: PatternKind
  /** SVG or PNG under /catalog/patterns/. */
  src: string
  thumbnail?: string
  /** Whether leaf-dye colours mean anything here — what shows the dye picker. */
  recolorable: boolean
  /**
   * How it is tinted, where it is. Omitted on a recolorable SVG, which is the
   * original case and reads as `svg`; required as `mask` on a recolorable
   * bitmap, because nothing about a `.webp` says which of the two it is.
   */
  recolor?: PatternRecolor
  /**
   * Mockup units one repeat of the tile covers across its *width*; its height
   * follows from the asset's aspect ratio, so nothing is stretched. This is
   * what `scale` 1 means for the pattern, as `MOTIF_UNIT` is for a motif.
   * Omitted, `scale` 1 is the asset's own pixel size — which is right for a
   * drawn SVG and meaningless for a photograph the designer exported at
   * whatever size their canvas was.
   */
  repeatUnits?: number
  /** How a tile covers the area. Omitted is `repeat`. */
  fit?: PatternFit
  /** Which products it may be printed on. Omitted is all of them. */
  restrictTo?: PatternRestriction
  /** Hex colours. */
  defaultColors: string[]
  /** Which leaf dyes the pattern is made from (community patterns). */
  leafIds?: string[]
  tags: string[]
  source: AssetSource
}

/** In mockup coordinate space. */
export type PrintAreaClip =
  | { type: 'rect'; x: number; y: number; width: number; height: number }
  | { type: 'path'; d: string }

export type PrintArea = {
  id: string
  name: Localized
  clip: PrintAreaClip
  allowedKinds: PatternKind[]
}

export type ProductLine = 'fabric' | 'leaf' | 'gift' | 'drinkware'

export type ProductStatus = 'available' | 'planned'

export type Price = { min: number; max?: number; currency: 'THB' }

/** `overlay` = shading/folds drawn on top of the pattern (multiply). */
export type ProductMockup = {
  base: string
  overlay?: string
  width: number
  height: number
}

export type Product = {
  id: string
  name: Localized
  line: ProductLine
  /** `null` while the price is still TBD (planned products). */
  price: Price | null
  status: ProductStatus
  mockup: ProductMockup
  printAreas: PrintArea[]
  /** Fabric/base colour choices, as hex. */
  baseColors: string[]
  /** Free-form marks the UI can read, e.g. `bestseller`. Defaults to empty. */
  tags: string[]
  story?: Localized
  /** Where the mockup came from; placeholder until real product photos land. */
  source?: AssetSource
}

export type TileLayer = {
  id: string
  type: 'tile'
  patternId: string
  printAreaId: string
  scale: number
  rotation: number
  offsetX: number
  offsetY: number
  colors: string[]
  opacity: number
}

export type MotifLayer = {
  id: string
  type: 'motif'
  patternId: string
  printAreaId: string
  x: number
  y: number
  scale: number
  rotation: number
  colors: string[]
  opacity: number
}

export type Layer = TileLayer | MotifLayer

/** What a visitor made: the serializable unit behind autosave and share links. */
export type Design = {
  version: 1
  productId: string
  baseColor: string
  layers: Layer[]
  note?: string
}

/** Everything the three catalog files hold, once validated. */
export type Catalog = {
  leafDyes: LeafDye[]
  patterns: Pattern[]
  products: Product[]
}
