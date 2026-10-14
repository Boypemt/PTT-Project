/**
 * Mounts the whole app shell at a given route with a catalog served from
 * fixtures, so a test can ask the questions a visitor would: what is on
 * screen, and what happens when I click.
 */
import { render, type RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/AppRoutes'
import { CatalogProvider } from '@/catalog'
import {
  catalogFile,
  fetchFromFiles,
  makeLeafDye,
  makePattern,
  makeProduct,
} from './catalogFixtures'

export const validCatalogFiles: Record<string, unknown> = {
  'leaf-dyes.json': catalogFile([makeLeafDye()]),
  'patterns.json': catalogFile([makePattern()]),
  'products.json': catalogFile([makeProduct()]),
}

type RenderAppOptions = {
  route?: string
  /** Catalog bodies served by file name. Ignored when `fetchImpl` is given. */
  files?: Record<string, unknown>
  /** For tests that need the catalog to answer differently on a second load. */
  fetchImpl?: typeof fetch
}

export function renderApp({
  route = '/',
  files = validCatalogFiles,
  fetchImpl = fetchFromFiles(files),
}: RenderAppOptions = {}): RenderResult {
  return render(
    <CatalogProvider baseUrl="/catalog/" fetchImpl={fetchImpl}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </CatalogProvider>,
  )
}
