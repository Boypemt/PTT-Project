/**
 * Which kinds of pattern the editor can place, and what that means for a
 * product's print areas.
 *
 * This is the one gate motifs come through. `motifs` off, it answers `['tile']`
 * and the app is exactly what it was: the library's kind chip for leaves is
 * disabled and says so, and a print area that takes nothing else is not
 * offered at all. `motifs` on, leaves are placeable everywhere this is read —
 * the chips, the print-area selector, the library's own filter — without any
 * of those files knowing a flag exists.
 *
 * The gate matters because the catalog describes areas the editor could not
 * serve before motifs: the handkerchief's corner, the wrap cloth's centre, the
 * plate's centre all take motifs only. Offering them would open an empty
 * library with nothing to say for itself, which reads as a bug rather than as
 * a step that has not been built.
 *
 * A list rather than a constant because the flag is read per call (see
 * `src/lib/flags.ts`): it is a split of a short string, and this is never
 * called in a loop.
 */
import type { PatternKind, PrintArea, Product } from '@/catalog'
import { isEnabled } from '@/lib/flags'

export function supportedLayerKinds(): readonly PatternKind[] {
  return isEnabled('motifs') ? ['tile', 'motif'] : ['tile']
}

export function isSupportedKind(kind: PatternKind): boolean {
  return supportedLayerKinds().includes(kind)
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
