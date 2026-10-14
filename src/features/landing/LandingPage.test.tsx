/**
 * The landing page from a visitor's side: the community's sentence, the way to
 * the customizer, and the parts drawn from catalog data.
 *
 * The page sits outside `CatalogGate`, so each catalog-fed part is checked both
 * before the data arrives and after.
 */
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import th from '@/i18n/th.json'
import { makeProduct } from '@/test/catalogFixtures'
import { renderApp } from '@/test/renderApp'

const product = makeProduct()
const previewCaption = th.home.preview.replace('{{product}}', product.name.th)

describe('the landing hero', () => {
  it('leads with the community sentence and the way into the customizer', () => {
    renderApp()

    expect(
      screen.getByRole('heading', { level: 1, name: th.home.title }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: th.home.cta })).toHaveAttribute(
      'href',
      '/products',
    )
  })

  it('shows a product from the catalog once it has loaded', async () => {
    renderApp()

    expect(screen.queryByText(previewCaption)).not.toBeInTheDocument()
    expect(await screen.findByText(previewCaption)).toBeInTheDocument()
  })

  it('says the patterns are placeholders', () => {
    renderApp()

    expect(screen.getByText(th.home.placeholder)).toBeInTheDocument()
  })
})
