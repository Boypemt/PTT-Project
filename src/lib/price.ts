/**
 * Turns a catalog `Price` into the string a visitor reads.
 *
 * Thai and English both show Arabic digits with comma grouping, so the number
 * formatting is the same in either language; only the "no price yet" wording
 * changes, and the caller passes that in already translated (`t('products.
 * priceComingSoon')`) so this module stays pure and i18n-free.
 */
import type { Price } from '@/catalog'

/** Thai baht sign. The catalog's only currency, kept in one place. */
export const BAHT_SIGN = '฿'

/** En dash, as a price range is read "59 to 89", not "59 minus 89". */
const RANGE_DASH = '–'

const amountFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

/** `1490` → `"1,490"`. */
export function formatAmount(amount: number): string {
  return amountFormat.format(amount)
}

/**
 * `{ min: 259 }` → `"฿259"`, `{ min: 59, max: 89 }` → `"฿59–89"`,
 * `null` → the given "price coming soon" wording.
 */
export function formatPrice(
  price: Price | null,
  comingSoonLabel: string,
): string {
  if (price === null) return comingSoonLabel

  const min = `${BAHT_SIGN}${formatAmount(price.min)}`

  // A `max` equal to `min` is not a range — the keychain's 59–89 is, a single
  // price written with both fields is not.
  if (price.max === undefined || price.max === price.min) return min

  return `${min}${RANGE_DASH}${formatAmount(price.max)}`
}
