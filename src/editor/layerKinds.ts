/**
 * Which kinds of pattern the editor can place today, and what that means for a
 * product's print areas.
 *
 * `tile` is the whole list for now. Placeable leaf motifs arrive with their
 * transform handles in task 09, and adding `'motif'` below is the one edit
 * that turns them on everywhere this is read: the library's kind chips, and
 * the print areas that accept nothing else.
 *
 * The gate matters because the catalog already describes areas the editor
 * cannot serve yet — the handkerchief's corner, the wrap cloth's centre, the
 * plate's centre all take motifs only. Offering them would open an empty
 * library with nothing to say for itself, which reads as a bug rather than as
 * a step that has not been built.
 */
import type { PatternKind, PrintArea, Product } from '@/catalog'

export const SUPPORTED_LAYER_KINDS: readonly PatternKind[] = ['tile']

export function isSupportedKind(kind: PatternKind): boolean {
  return SUPPORTED_LAYER_KINDS.includes(kind)
}

/** The kinds an area accepts that the editor can also place. */
export function usableKinds(area: PrintArea): PatternKind[] {
  return area.allowedKinds.filter(isSupportedKind)
}

/** The product's print areas that have something to offer yet. */
export function usablePrintAreas(product: Product): PrintArea[] {
  return product.printAreas.filter((area) => usableKinds(area).length > 0)
}

/**
 * Where a pattern picked right now would land: the area the visitor selected,
 * or the first usable one when the selection is an area nothing can be placed
 * on — or when nothing is selected at all.
 *
 * `undefined` means this product has no area the editor can print on, which is
 * a real state for a product whose areas are all motif-only.
 */
export function targetPrintArea(
  product: Product,
  selectedId: string | null,
): PrintArea | undefined {
  const usable = usablePrintAreas(product)

  return usable.find((area) => area.id === selectedId) ?? usable[0]
}
