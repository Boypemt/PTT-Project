/**
 * Which patterns the library shows, given what the visitor typed and the
 * kinds the selected print area can take.
 *
 * Kept apart from the panel because it is the part worth testing: a search
 * that quietly drops a pattern, or offers one the print area will not accept,
 * is a bug nobody sees until they wonder where a pattern went.
 *
 * Names are localized by the caller, so typing Thai finds the Thai name and
 * typing English finds the English one, without this file knowing about
 * i18next. Tags are searched too — they are the only place "waves" or
 * "eco-print" is written down — and they are English ids either way.
 *
 * What comes back is ordered rather than left in catalog order: the
 * community's own patterns first, the placeholders standing in for them after.
 * Those placeholders exist to be replaced, and on a phone the library is a
 * strip four thumbnails wide — whichever patterns are listed first are the
 * ones most visitors will ever see, and those should be the real ones.
 */
import type { Pattern, PatternKind, Product } from '@/catalog'

export type PatternFilter = {
  /** What the visitor typed. Blank matches everything. */
  query: string
  /** Kinds to show. A pattern of any other kind is left out. */
  kinds: readonly PatternKind[]
  /** What is being designed, for patterns that name where they may print. */
  product?: Product
}

/**
 * Whether `pattern` may be printed on `product`.
 *
 * A pattern with no `restrictTo` prints on everything, which is every entry in
 * the catalog today. One that has it qualifies on either count — a line or an
 * id — so "the fabric line, and the plate" is one entry rather than a list of
 * every fabric product.
 *
 * This decides what the library offers, not what the canvas draws: a design
 * made before a restriction was added keeps its layers, because taking the
 * pattern out from under it would lose work without explaining itself.
 */
export function allowsProduct(
  pattern: Pattern,
  product: Product | undefined,
): boolean {
  const limit = pattern.restrictTo
  if (limit === undefined) return true

  // Nothing to judge it against: offer it rather than hide it.
  if (product === undefined) return true

  return (
    (limit.lines?.includes(product.line) ?? false) ||
    (limit.productIds?.includes(product.id) ?? false)
  )
}

/** Community patterns first; everything else keeps the catalog's order. */
function communityFirst(a: Pattern, b: Pattern): number {
  const rank = (pattern: Pattern) =>
    pattern.source.type === 'community' ? 0 : 1

  return rank(a) - rank(b)
}

/** How a pattern's name reads in the language now on screen. */
export type LocalizeName = (pattern: Pattern) => string

function matchesQuery(pattern: Pattern, name: string, needle: string): boolean {
  if (needle === '') return true

  return (
    name.toLowerCase().includes(needle) ||
    pattern.tags.some((tag) => tag.toLowerCase().includes(needle))
  )
}

/** The patterns to show: the community's first, then the placeholders. */
export function filterPatterns(
  patterns: readonly Pattern[],
  { query, kinds, product }: PatternFilter,
  name: LocalizeName,
): Pattern[] {
  const needle = query.trim().toLowerCase()

  return patterns
    .filter(
      (pattern) =>
        kinds.includes(pattern.kind) &&
        allowsProduct(pattern, product) &&
        matchesQuery(pattern, name(pattern), needle),
    )
    .sort(communityFirst)
}
