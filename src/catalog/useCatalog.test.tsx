import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  catalogFile,
  fetchFromFiles,
  makeLeafDye,
  makePattern,
  makeProduct,
} from '@/test/catalogFixtures'
import { CatalogProvider } from './CatalogProvider'
import { useCatalog } from './useCatalog'

const validFiles = {
  'leaf-dyes.json': catalogFile([makeLeafDye()]),
  'patterns.json': catalogFile([makePattern()]),
  'products.json': catalogFile([makeProduct()]),
}

/** Prints whatever state the provider is in, so tests can read it off screen. */
function CatalogReadout() {
  const { status, catalog, error } = useCatalog()

  return (
    <output>
      {status === 'ready' && `products: ${catalog.products.length}`}
      {status === 'loading' && 'loading'}
      {status === 'error' && `error: ${error.message}`}
    </output>
  )
}

describe('CatalogProvider and useCatalog', () => {
  it('starts loading, then publishes the validated catalog', async () => {
    render(
      <CatalogProvider
        baseUrl="/catalog/"
        fetchImpl={fetchFromFiles(validFiles)}
      >
        <CatalogReadout />
      </CatalogProvider>,
    )

    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(await screen.findByText('products: 1')).toBeInTheDocument()
  })

  it('publishes a CatalogError naming the file when the data is invalid', async () => {
    const files = {
      ...validFiles,
      'patterns.json': catalogFile([makePattern({ leafIds: ['teek'] })]),
    }

    render(
      <CatalogProvider baseUrl="/catalog/" fetchImpl={fetchFromFiles(files)}>
        <CatalogReadout />
      </CatalogProvider>,
    )

    expect(
      await screen.findByText(/patterns\.json.*unknown leaf dye "teek"/s),
    ).toBeInTheDocument()
  })

  it('throws when used outside the provider', () => {
    expect(() => render(<CatalogReadout />)).toThrowError(
      /useCatalog must be used inside a <CatalogProvider>/,
    )
  })
})
