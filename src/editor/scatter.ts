/**
 * "โปรยใบไม้ / Scatter leaves": a handful of leaves thrown across the print
 * area in one tap.
 *
 * This is the look the community's cloth actually has. Eco-printing is leaves
 * laid by hand — several of them, at whatever angle they fell, in whatever
 * sizes the tree gave — and building that one leaf at a time is a dozen taps
 * before the visitor sees anything like the real thing. One button is the
 * difference between a demo that looks like the product and one that looks
 * like clip art.
 *
 * Only patterns that name the leaves they are made from (`leafIds`) are
 * thrown: the catalog's tiles are not leaves, and a motif without a leaf
 * behind it — the tong-tung plate leaf, which is a shape rather than a
 * dye — is not what "scatter leaves" means. That is a question about the data,
 * so it is answered from the data rather than from a list of ids here.
 *
 * Seeded, so the same tap can be asked for twice: that is what makes it
 * testable, and what lets a share link in task 11 carry a scattered design.
 * The caller passes the seed — the button uses the clock, so each tap differs.
 *
 * Sizes come from `motifSizeBounds`, the same range a single tap lays a leaf
 * in, so a scatter is the sizes you would get by tapping several times rather
 * than a second idea of how big a leaf should be.
 */
import type { MotifLayer, Pattern, PrintArea } from '@/catalog'
import { createRandom } from '@/lib/random'
import { areaBounds } from './areaBounds'
import { motifSizeBounds, scaleForSize } from './motifPlacement'

/** How many leaves one tap throws, both ends included. */
export const SCATTER_COUNT = { min: 5, max: 8 } as const

/**
 * The seed for one tap of the button: the clock, so each tap throws a
 * different handful.
 *
 * Here rather than in the panel because it is the one impure thing about a
 * scatter, and a component is the wrong place to keep it — React may render a
 * component more than once, and the seed must come from the tap.
 */
export function scatterSeed(): number {
  return Date.now()
}

/** The patterns a scatter may use: motifs that name the leaves they come from. */
export function leafPatterns(patterns: readonly Pattern[]): Pattern[] {
  return patterns.filter(
    (pattern) => pattern.kind === 'motif' && (pattern.leafIds?.length ?? 0) > 0,
  )
}

/**
 * The layers one tap of "scatter leaves" adds to `area`.
 *
 * Centres are spread over the whole area, edges included, so some leaves hang
 * over the hem and are trimmed by the clip — which is what a cloth of laid
 * leaves looks like, and the same rule a dragged leaf follows.
 *
 * An empty list where the catalog has no leaf patterns at all, so the caller
 * can hide the button rather than offer one that does nothing.
 */
export function scatterMotifs(
  patterns: readonly Pattern[],
  area: PrintArea,
  seed: number,
): Omit<MotifLayer, 'id'>[] {
  const leaves = leafPatterns(patterns)

  if (leaves.length === 0) return []

  const random = createRandom(seed)
  const bounds = areaBounds(area.clip)
  const sizes = motifSizeBounds(bounds)
  const count = random.int(SCATTER_COUNT.min, SCATTER_COUNT.max)

  return Array.from({ length: count }, () => {
    const pattern = random.pick(leaves)

    return {
      type: 'motif' as const,
      patternId: pattern.id,
      printAreaId: area.id,
      x: random.between(bounds.x, bounds.x + bounds.width),
      y: random.between(bounds.y, bounds.y + bounds.height),
      scale: scaleForSize(random.between(sizes.min, sizes.max)),
      rotation: random.between(0, 360),
      // Copied, so a layer cannot write back into the loaded catalog.
      colors: [...pattern.defaultColors],
      opacity: 1,
    }
  })
}
