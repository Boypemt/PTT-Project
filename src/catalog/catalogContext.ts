/**
 * The context the catalog is published on. Kept apart from the provider
 * component so a consumer importing the hook doesn't pull in the provider.
 */
import { createContext } from 'react'
import type { CatalogError } from './errors'
import type { Catalog } from './types'

/** Narrow on `status`: `catalog` is non-null exactly when it is `'ready'`. */
export type CatalogValue =
  | { status: 'loading'; catalog: null; error: null }
  | { status: 'ready'; catalog: Catalog; error: null }
  | { status: 'error'; catalog: null; error: CatalogError }

export type CatalogContextValue = CatalogValue & {
  /** Re-fetch and re-validate the catalog, e.g. from an error screen. */
  reload: () => void
}

export const CATALOG_LOADING: CatalogValue = {
  status: 'loading',
  catalog: null,
  error: null,
}

export const catalogContext = createContext<CatalogContextValue | null>(null)
