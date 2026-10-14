/**
 * Loads the catalog once on mount and publishes loading/ready/error state.
 * Plain React — no state library, as the catalog is read-only data.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  CATALOG_LOADING,
  catalogContext,
  type CatalogValue,
} from './catalogContext'
import { CatalogError } from './errors'
import { loadCatalog } from './loaders'

type CatalogProviderProps = {
  children: ReactNode
  /** Where the catalog is served from; defaults to `<base>/catalog/`. */
  baseUrl?: string
  /** Injectable for tests. Must be stable across renders — a reload is triggered when it changes. */
  fetchImpl?: typeof fetch
}

function asCatalogError(error: unknown): CatalogError {
  return error instanceof CatalogError
    ? error
    : new CatalogError('catalog', [`could not be loaded: ${String(error)}`], {
        cause: error,
      })
}

export function CatalogProvider({
  children,
  baseUrl,
  fetchImpl,
}: CatalogProviderProps) {
  const [value, setValue] = useState<CatalogValue>(CATALOG_LOADING)
  const [reloadCount, setReloadCount] = useState(0)

  const reload = useCallback(() => {
    setValue(CATALOG_LOADING)
    setReloadCount((count) => count + 1)
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    loadCatalog({ baseUrl, fetchImpl, signal: controller.signal })
      .then((catalog) => {
        if (active) setValue({ status: 'ready', catalog, error: null })
      })
      .catch((error: unknown) => {
        if (active) {
          setValue({
            status: 'error',
            catalog: null,
            error: asCatalogError(error),
          })
        }
      })

    return () => {
      active = false
      controller.abort()
    }
    // reloadCount is the reload trigger; the loader itself reads the props above.
  }, [baseUrl, fetchImpl, reloadCount])

  const contextValue = useMemo(() => ({ ...value, reload }), [value, reload])

  return (
    <catalogContext.Provider value={contextValue}>
      {children}
    </catalogContext.Provider>
  )
}
