/**
 * The provider tree and the router. Everything below here can assume i18n is
 * initialised and the catalog is being loaded.
 */
import { BrowserRouter } from 'react-router-dom'
import { CatalogProvider } from '@/catalog'
import { DevCatalogPage } from '@/features/dev-catalog/DevCatalogPage'
import '@/i18n'
import { AppRoutes } from './AppRoutes'

/** Stands in for a route until the dev catalog moves into the route table. */
function isDevCatalogPath(): boolean {
  return import.meta.env.DEV && window.location.pathname === '/dev/catalog'
}

export default function App() {
  if (isDevCatalogPath()) {
    return (
      <CatalogProvider>
        <DevCatalogPage />
      </CatalogProvider>
    )
  }

  return (
    <CatalogProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </CatalogProvider>
  )
}
