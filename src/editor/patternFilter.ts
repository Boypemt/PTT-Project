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
 */
import type { Pattern, PatternKind } from '@/catalog'

export type PatternFilter = {
  /** What the visitor typed. Blank matches everything. */
  query: string
  /** Kinds to show. A pattern of any other kind is left out. */
  kinds: readonly PatternKind[]
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

/** The patterns to show, in catalog order. */
export function filterPatterns(
  patterns: readonly Pattern[],
  { query, kinds }: PatternFilter,
  name: LocalizeName,
): Pattern[] {
  const needle = query.trim().toLowerCase()

  return patterns.filter(
    (pattern) =>
      kinds.includes(pattern.kind) &&
      matchesQuery(pattern, name(pattern), needle),
  )
}
