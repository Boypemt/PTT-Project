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
import { catalogFile, makeLeafDye, makeProduct } from '@/test/catalogFixtures'
import { renderApp, validCatalogFiles } from '@/test/renderApp'

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

describe('how it works', () => {
  it('names the three steps in order', () => {
    renderApp()

    const steps = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)

    expect(steps).toEqual([
      th.home.how.steps.product.title,
      th.home.how.steps.pattern.title,
      th.home.how.steps.colors.title,
    ])
  })
})

describe('the community facts', () => {
  it('gives the three numbers that describe the enterprise', () => {
    renderApp()

    expect(screen.getByText(th.home.facts.households.value)).toBeInTheDocument()
    expect(screen.getByText(th.home.facts.forest.value)).toBeInTheDocument()
    expect(screen.getByText(th.home.facts.fund.value)).toBeInTheDocument()
    expect(screen.getByText(th.home.facts.fund.label)).toBeInTheDocument()
  })
})

describe('the leaf colour strip', () => {
  const dyes = [
    // The placeholder pattern is printed from teak, so the catalog's
    // cross-references want that leaf to exist.
    makeLeafDye(),
    makeLeafDye({
      id: 'marigold',
      name: { th: 'ดาวเรือง', en: 'Marigold' },
      colors: [
        { id: 'gold', name: { th: 'เหลืองทอง', en: 'Gold' }, hex: '#C9962B' },
        {
          id: 'yellow-brown',
          name: { th: 'เหลืองอมน้ำตาล', en: 'Yellow-brown' },
          hex: '#A67C2E',
        },
      ],
    }),
  ]

  it('shows every leaf dye in the catalog, named and in its own colours', async () => {
    renderApp({
      files: { ...validCatalogFiles, 'leaf-dyes.json': catalogFile(dyes) },
    })

    expect(await screen.findByText('ดาวเรือง')).toBeInTheDocument()
    // Each colour is a band of the leaf's bar, named for a screen reader by
    // the text inside it.
    expect(screen.getByText('เหลืองทอง').parentElement).toHaveStyle({
      backgroundColor: '#C9962B',
    })
    expect(screen.getByText('เหลืองอมน้ำตาล').parentElement).toHaveStyle({
      backgroundColor: '#A67C2E',
    })
  })

  it('leaves the strip out while there is no catalog', () => {
    renderApp()

    expect(screen.queryByText(th.home.leaves.title)).not.toBeInTheDocument()
  })
})
