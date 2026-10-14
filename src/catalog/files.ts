/**
 * The catalog file names, in their own module so the loaders and the
 * cross-reference checks can both name files without importing each other.
 */
export const CATALOG_FILES = {
  leafDyes: 'leaf-dyes.json',
  patterns: 'patterns.json',
  products: 'products.json',
} as const
