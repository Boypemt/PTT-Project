/**
 * What a downloaded design is called on disk.
 *
 * `paton-phueng-shawl-cotton-20261029.png` — the enterprise, the product, the
 * day. A visitor who designs three shawls in an afternoon gets three files the
 * browser numbers for them, and someone who sends one on to the community can
 * see what it is without opening it.
 *
 * The date is the one on the visitor's own clock, not UTC. `toISOString()`
 * would be the obvious way to write it and would be wrong here: Bangkok is
 * UTC+7, so a design exported at any time before seven in the morning would be
 * stamped with the day before — and the community is who reads these names.
 *
 * Pure, so the day a file is named is a value the tests pass in rather than
 * whatever the clock said when they ran.
 */

/** The enterprise, so a file in someone's Downloads says where it came from. */
const PREFIX = 'paton-phueng'

/** Used when a design carries no product id — a store that has not opened one. */
const UNNAMED = 'design'

/** `2026-10-29` → `20261029`, in the visitor's own timezone. */
export function dateStamp(at: Date): string {
  const time = at.getTime()

  // An invalid Date would otherwise write "NaNNaNNaN" into a filename and tell
  // nobody why. This is a caller passing something broken, so it says so.
  if (Number.isNaN(time)) {
    throw new RangeError('dateStamp needs a valid Date')
  }

  const year = String(at.getFullYear()).padStart(4, '0')
  const month = String(at.getMonth() + 1).padStart(2, '0')
  const day = String(at.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

/**
 * The id as a filename can carry it: lowercase, letters and digits, single
 * hyphens between them.
 *
 * Catalog ids are already kebab-case and this changes none of them — it is
 * here for the id that is not, the day one arrives from a hand-edited share
 * link or a product the designer adds with a space in its id. A filename is
 * not the place to find out.
 */
function slug(id: string): string {
  const cleaned = id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return cleaned === '' ? UNNAMED : cleaned
}

/** `('shawl-cotton', new Date(2026, 9, 29))` → `paton-phueng-shawl-cotton-20261029.png`. */
export function exportFileName(productId: string, at: Date): string {
  return `${PREFIX}-${slug(productId)}-${dateStamp(at)}.png`
}
