/**
 * Mounts the whole app shell at a given route with a catalog served from
 * fixtures, so a test can ask the questions a visitor would: what is on
 * screen, and what happens when I click.
 */
import { render, type RenderResult } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
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

let route = ''

/**
 * Where the router is now, as `"/products?line=fabric"`. Reported through a
 * variable rather than into the DOM, so it cannot be picked up by the queries
 * a test runs against the page.
 */
export const currentRoute = (): string => route

function RouteProbe() {
  const location = useLocation()

  useEffect(() => {
    route = `${location.pathname}${location.search}`
  }, [location])

  return null
}

type RenderAppOptions = {
  route?: string
  /** Catalog bodies served by file name. Ignored when `fetchImpl` is given. */
  files?: Record<string, unknown>
  /** For tests that need the catalog to answer differently on a second load. */
  fetchImpl?: typeof fetch
}

export function renderApp({
  route: initialRoute = '/',
  files = validCatalogFiles,
  fetchImpl = fetchFromFiles(files),
}: RenderAppOptions = {}): RenderResult {
  route = initialRoute

  return render(
    <CatalogProvider baseUrl="/catalog/" fetchImpl={fetchImpl}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <RouteProbe />
        <AppRoutes />
      </MemoryRouter>
    </CatalogProvider>,
  )
}
