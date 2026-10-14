/**
 * The route table. Kept apart from `App.tsx` so tests can mount it inside a
 * `MemoryRouter` at any path without touching the browser history.
 */
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Route, Routes } from 'react-router-dom'
import { DevCatalogPage } from '@/features/dev-catalog/DevCatalogPage'
import { LandingPage } from '@/features/landing/LandingPage'
import { ProductPickerPage } from '@/features/product-picker/ProductPickerPage'
import { CatalogGate } from './CatalogGate'
import { Layout } from './Layout'
import { NotFoundPage } from './NotFoundPage'

/**
 * The customizer is the only page that needs Konva, and Konva is most of what
 * this app weighs. Split out behind `lazy`, the landing page and the product
 * picker no longer download a canvas engine they never use; the chunk starts
 * arriving the moment someone opens /customize/:productId.
 *
 * The page keeps its named export like every other component here, so the
 * import is mapped to the `default` `lazy` wants rather than the convention
 * being bent for one file.
 */
const CustomizePage = lazy(() =>
  import('@/features/customize/CustomizePage').then((module) => ({
    default: module.CustomizePage,
  })),
)

/**
 * What stands in while the editor's chunk is on the wire. `status` so a screen
 * reader hears it, and the same quiet type as `CatalogGate`'s wait, because on
 * a slow connection the visitor may meet both.
 */
function EditorFallback() {
  const { t } = useTranslation()

  return (
    <p
      role="status"
      className="mx-auto max-w-3xl px-4 py-12 text-lg text-ink-500"
    >
      {t('customize.loading')}
    </p>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />

        {/* Pages that need catalog data wait behind the gate; the landing page
            and the 404 do not, so a bad catalog file still leaves a way out. */}
        <Route element={<CatalogGate />}>
          <Route path="products" element={<ProductPickerPage />} />
          <Route
            path="customize/:productId"
            element={
              <Suspense fallback={<EditorFallback />}>
                <CustomizePage />
              </Suspense>
            }
          />

          {/* Ships in every build so the team and the designer can review
              assets on the Vercel preview. Unlinked, and noindex while open. */}
          <Route path="dev/catalog" element={<DevCatalogPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
