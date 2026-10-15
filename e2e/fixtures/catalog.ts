/**
 * The names the catalog gives things, read from the same JSON the app loads.
 *
 * The specs name entries by id — `eco-print-scatter`, `teak` — exactly as the
 * components do, and this file turns an id into the text on the control. So a
 * journey survives the designer renaming a pattern or colour-matching a dye,
 * which is a data edit, and fails when an id it depends on leaves the catalog,
 * which is a change to the demo.
 */
import leafDyes from '../../public/catalog/leaf-dyes.json' with { type: 'json' }
import patterns from '../../public/catalog/patterns.json' with { type: 'json' }
import products from '../../public/catalog/products.json' with { type: 'json' }
import type { Lang } from './ui'

type Localized = { th: string; en: string }
type Entry = { id: string; name: Localized }

/** The version the real files carry, for a fixture that has to look genuine. */
export const CATALOG_VERSION = patterns.catalogVersion

function find<T extends Entry>(
  items: readonly T[],
  file: string,
  id: string,
): T {
  const entry = items.find((item) => item.id === id)

  if (entry === undefined) {
    throw new Error(`${file} has no entry "${id}" — has the catalog changed?`)
  }

  return entry
}

export function patternName(id: string, lang: Lang): string {
  return find(patterns.items, 'patterns.json', id).name[lang]
}

export function productName(id: string, lang: Lang): string {
  return find(products.items, 'products.json', id).name[lang]
}

/**
 * A print area as this file reads it. The clip's fields are all optional
 * because products.json holds both shapes of clip and the JSON import types
 * them as a union; `printAreaCenter` is where that is narrowed again.
 */
type Area = Entry & {
  clip: {
    type: string
    x?: number
    y?: number
    width?: number
    height?: number
  }
}

/** One print area of a product, by the ids a spec names. */
function printArea(productId: string, areaId: string): Area {
  const product = find(products.items, 'products.json', productId)

  return find(
    product.printAreas as readonly Area[],
    `products.json "${productId}"`,
    areaId,
  )
}

export function printAreaName(
  productId: string,
  areaId: string,
  lang: Lang,
): string {
  return printArea(productId, areaId).name[lang]
}

/** The mockup's own coordinate space, which layer positions are written in. */
export function mockupSize(productId: string): {
  width: number
  height: number
} {
  const { mockup } = find(products.items, 'products.json', productId)

  return { width: mockup.width, height: mockup.height }
}

/**
 * The middle of a print area, in mockup coordinates — where a tapped motif
 * lands, and therefore where a journey has to reach to take hold of one.
 *
 * Rectangles only: the areas the motif journeys use are rectangles, and
 * measuring a path here would mean a second copy of `areaBounds` in the specs.
 */
export function printAreaCenter(
  productId: string,
  areaId: string,
): { x: number; y: number } {
  const { clip } = printArea(productId, areaId)
  const { x, y, width, height } = clip

  if (
    clip.type !== 'rect' ||
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined
  ) {
    throw new Error(
      `products.json "${productId}" area "${areaId}" is not a rectangle`,
    )
  }

  return { x: x + width / 2, y: y + height / 2 }
}

/** The cloth colours a product offers, in the order the picker shows them. */
export function baseColors(id: string): string[] {
  return find(products.items, 'products.json', id).baseColors
}

/**
 * What a pattern's button in the library is called. Mirrors
 * `PatternThumbnail`: a placeholder entry says so in its own name, so the
 * badge is part of what a journey clicks and an entry the designer replaces
 * loses the suffix by an edit to patterns.json.
 */
export function patternButtonName(
  id: string,
  lang: Lang,
  placeholderLabel: string,
): string {
  const pattern = find(patterns.items, 'patterns.json', id)
  const name = pattern.name[lang]

  return pattern.source.type === 'placeholder'
    ? `${name} (${placeholderLabel})`
    : name
}

/**
 * What one leaf-dye swatch is called: leaf and colour together, as
 * `LeafDyePicker` builds it — "deep pink" alone would not say which leaf gave
 * it, and the leaf is the point.
 */
export function dyeSwatchName(
  dyeId: string,
  colorId: string,
  lang: Lang,
): string {
  const dye = find(leafDyes.items, 'leaf-dyes.json', dyeId)
  const color = find(dye.colors, `leaf-dyes.json entry "${dyeId}"`, colorId)

  return `${dye.name[lang]} — ${color.name[lang]}`
}
