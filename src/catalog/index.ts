/**
 * The catalog's public surface. Components import from `@/catalog`, never from
 * a JSON file or a specific catalog entry (see the golden rule in CLAUDE.md).
 */
export * from './types'
export * from './schemas'
export { CATALOG_FILES } from './files'
export { CatalogError } from './errors'
export { validateCatalogRefs } from './crossRefs'
export {
  loadCatalog,
  loadLeafDyes,
  loadPatterns,
  loadProducts,
  parseCatalogFile,
  type CatalogLoadOptions,
} from './loaders'
export { CatalogProvider } from './CatalogProvider'
export { useCatalog } from './useCatalog'
export type { CatalogContextValue, CatalogValue } from './catalogContext'
