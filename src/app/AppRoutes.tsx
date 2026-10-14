/**
 * The route table. Kept apart from `App.tsx` so tests can mount it inside a
 * `MemoryRouter` at any path without touching the browser history.
 */
import { Route, Routes } from 'react-router-dom'
import { CustomizePage } from '@/features/customize/CustomizePage'
import { LandingPage } from '@/features/landing/LandingPage'
import { ProductPickerPage } from '@/features/product-picker/ProductPickerPage'
import { NotFoundPage } from './NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path="products" element={<ProductPickerPage />} />
      <Route path="customize/:productId" element={<CustomizePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
