/**
 * The provider tree and the router. Everything below here can assume i18n is
 * initialised and the catalog is being loaded.
 */
import { BrowserRouter } from 'react-router-dom'
import { CatalogProvider } from '@/catalog'
import '@/i18n'
import { AppRoutes } from './AppRoutes'

export default function App() {
  return (
    <CatalogProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </CatalogProvider>
  )
}
