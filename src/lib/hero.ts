/**
 * What the landing hero puts on show, chosen from catalog data.
 *
 * The hero wants one product and one leaf print behind it, and the golden rule
 * in CLAUDE.md says no component may name either. So the choice is a rule over
 * the catalog instead: the product the picker would lead with, and the tile the
 * community's own eco-print is drawn as. Reordering products.json or tagging a
 * different tile changes the front page with no code touched.
 */
import type { Pattern, Product } from '@/catalog'
import { sortProductsForPicker } from './products'

/** Marks the tiles that stand for the community's own leaf printing. */
export const ECO_PRINT_TAG = 'eco-print'

/**
 * The product on the hero: what the picker shows first — an available best
 * seller, by catalog order — or whatever else the catalog has.
 */
export function pickHeroProduct(
  products: readonly Product[],
): Product | undefined {
  return sortProductsForPicker(products)[0]
}

/**
 * The tile printed behind the hero product: an eco-print one, so the backdrop
 * is the community's own technique rather than a decoration.
 */
export function pickHeroPattern(
  patterns: readonly Pattern[],
): Pattern | undefined {
  const tiles = patterns.filter((pattern) => pattern.kind === 'tile')

  return tiles.find((tile) => tile.tags.includes(ECO_PRINT_TAG)) ?? tiles[0]
}
