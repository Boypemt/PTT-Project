/**
 * The route table. Kept apart from `App.tsx` so tests can mount it inside a
 * `MemoryRouter` at any path without touching the browser history.
 */
import { Route, Routes } from 'react-router-dom'
import { CustomizePage } from '@/features/customize/CustomizePage'
import { DevCatalogPage } from '@/features/dev-catalog/DevCatalogPage'
import { LandingPage } from '@/features/landing/LandingPage'
import { ProductPickerPage } from '@/features/product-picker/ProductPickerPage'
import { CatalogGate } from './CatalogGate'
import { Layout } from './Layout'
import { NotFoundPage } from './NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />

        {/* Pages that need catalog data wait behind the gate; the landing page
            and the 404 do not, so a bad catalog file still leaves a way out. */}
        <Route element={<CatalogGate />}>
          <Route path="products" element={<ProductPickerPage />} />
          <Route path="customize/:productId" element={<CustomizePage />} />

          {/* Ships in every build so the team and the designer can review
              assets on the Vercel preview. Unlinked, and noindex while open. */}
          <Route path="dev/catalog" element={<DevCatalogPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
