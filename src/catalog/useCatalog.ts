/** The hook components use to read the validated catalog. */
import { useContext } from 'react'
import { catalogContext, type CatalogContextValue } from './catalogContext'

export function useCatalog(): CatalogContextValue {
  const value = useContext(catalogContext)

  if (value === null) {
    throw new Error('useCatalog must be used inside a <CatalogProvider>')
  }

  return value
}
