/**
 * Pure rules for presenting a list of products: which tags mean something,
 * which line a URL asks for, and what order the grid shows.
 *
 * The picker page reads nothing but these helpers and the catalog, so no
 * component ever names a product id (see the golden rule in CLAUDE.md).
 */
import type { Product, ProductLine } from '@/catalog'

/** Marks a product the community sells most of; set per entry in products.json. */
export const BESTSELLER_TAG = 'bestseller'

/** Every line in the model, in the order the filter chips show them. */
export const PRODUCT_LINES: readonly ProductLine[] = [
  'fabric',
  'leaf',
  'gift',
  'drinkware',
]

export function isBestseller(product: Product): boolean {
  return product.tags.includes(BESTSELLER_TAG)
}

/** `"fabric"` → `'fabric'`; anything else (a shared link gone stale, a typo) → `null`. */
export function parseProductLine(value: string | null): ProductLine | null {
  return PRODUCT_LINES.find((line) => line === value) ?? null
}

/** `null` means "all lines". */
export function filterProductsByLine(
  products: readonly Product[],
  line: ProductLine | null,
): Product[] {
  return line === null
    ? [...products]
    : products.filter((product) => product.line === line)
}

/**
 * What a visitor should meet first: things they can buy today, best sellers
 * at the front of those, and the unbuilt concepts last.
 *
 * Products that rank the same keep their catalog order — the JSON is the
 * community's own ordering, so it decides the rest.
 */
export function sortProductsForPicker(products: readonly Product[]): Product[] {
  const rank = (product: Product) =>
    (product.status === 'planned' ? 2 : 0) + (isBestseller(product) ? 0 : 1)

  return [...products].sort((a, b) => rank(a) - rank(b))
}
