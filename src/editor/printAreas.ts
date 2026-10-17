/**
 * Where the next pattern lands: which of a product's print areas the editor is
 * pointing at.
 *
 * This file used to be `layerKinds.ts`, the gate leaf motifs came through: with
 * the `motifs` flag off it answered that only tiles could be placed, and an
 * area taking nothing but leaves — the handkerchief's corner, the wrap cloth's
 * centre, the plate's centre — was left out of the editor rather than offered
 * as an empty library. Motifs have graduated, so the editor can place every
 * kind the catalog names and there is nothing left to filter: what an area
 * accepts is `area.allowedKinds`, read where it is needed.
 *
 * What is left is the one question the panels share, and the reason it is not
 * a line in either of them: the library and the print-area chips have to agree
 * about which area a tap prints on, down to the fallback.
 */
import type { PrintArea, Product } from '@/catalog'

/**
 * The area the visitor selected, or the product's first one when the selection
 * names no area of this product — the store keeps one id for the whole session,
 * so moving from the shawl to the plate arrives here as exactly that.
 *
 * `undefined` means the product has no print area at all, which the schema
 * allows and the library has a line for.
 */
export function targetPrintArea(
  product: Product,
  selectedId: string | null,
): PrintArea | undefined {
  const { printAreas } = product

  return printAreas.find((area) => area.id === selectedId) ?? printAreas[0]
}
