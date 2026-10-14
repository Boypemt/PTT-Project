import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Product } from '@/catalog'
import en from '@/i18n/en.json'
import th from '@/i18n/th.json'
import { catalogFile, localized, makeProduct } from '@/test/catalogFixtures'
import { currentRoute, renderApp, validCatalogFiles } from '@/test/renderApp'

/**
 * A catalog spread across the lines, deliberately in an order the picker has
 * to rework: the best seller sits in the middle and a concept comes first.
 */
const products: Product[] = [
  makeProduct({
    id: 'mug',
    name: localized('Ceramic mug'),
    line: 'drinkware',
    price: null,
    status: 'planned',
  }),
  makeProduct({
    id: 'shawl-silk',
    name: localized('Silk shawl'),
    line: 'fabric',
    price: { min: 1490, currency: 'THB' },
  }),
  makeProduct({
    id: 'shawl-cotton',
    name: localized('Cotton shawl'),
    line: 'fabric',
    price: { min: 259, currency: 'THB' },
    tags: ['bestseller'],
  }),
  makeProduct({
    id: 'keychain',
    name: localized('Keychain'),
    line: 'gift',
    price: { min: 59, max: 89, currency: 'THB' },
  }),
]

const files = {
  ...validCatalogFiles,
  'products.json': catalogFile(products),
}

const renderPicker = (route = '/products') => renderApp({ route, files })

const count = (n: number) =>
  (n === 1 ? th.products.count_one : th.products.count_other).replace(
    '{{count}}',
    String(n),
  )

const cardNames = () =>
  screen
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent)

const chip = (label: string) => screen.getByRole('button', { name: label })

/** Waits for the catalog to arrive, by waiting for the cards. */
const grid = () => screen.findAllByRole('heading', { level: 2 })

describe('the product grid', () => {
  it('shows every product, best sellers first and concepts last', async () => {
    renderPicker()
    await grid()

    expect(cardNames()).toEqual([
      'TH Cotton shawl',
      'TH Silk shawl',
      'TH Keychain',
      'TH Ceramic mug',
    ])
  })

  it('counts what it shows', async () => {
    renderPicker()
    await grid()

    expect(screen.getByText(count(4))).toBeInTheDocument()
  })

  it('writes each price in the catalog format', async () => {
    renderPicker()
    await grid()

    expect(screen.getByText('฿259')).toBeInTheDocument()
    expect(screen.getByText('฿1,490')).toBeInTheDocument()
    expect(screen.getByText('฿59–89')).toBeInTheDocument()
    expect(screen.getByText(th.products.priceComingSoon)).toBeInTheDocument()
  })

  it('links each card to its own customizer', async () => {
    renderPicker()
    await grid()

    const link = screen.getByRole('link', {
      name: th.products.customizeProduct.replace(
        '{{product}}',
        'TH Cotton shawl',
      ),
    })

    expect(link).toHaveAttribute('href', '/customize/shawl-cotton')
    expect(
      screen.getByRole('link', {
        name: th.products.customizeProduct.replace(
          '{{product}}',
          'TH Ceramic mug',
        ),
      }),
    ).toHaveAttribute('href', '/customize/mug')
  })
})

describe('product badges', () => {
  it('marks a tagged product as a best seller', async () => {
    renderPicker()
    await grid()

    expect(screen.getAllByText(th.products.bestseller)).toHaveLength(1)
  })

  it('marks a planned product as a concept and still lets it be customized', async () => {
    renderPicker()
    await grid()

    expect(screen.getByText(th.products.concept)).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: th.products.customizeProduct.replace(
          '{{product}}',
          'TH Ceramic mug',
        ),
      }),
    ).toBeInTheDocument()
  })

  it('leaves an untagged, available product unbadged', async () => {
    renderPicker()
    await grid()

    const keychain = screen
      .getByRole('heading', { level: 2, name: 'TH Keychain' })
      .closest('li')

    expect(keychain).not.toHaveTextContent(th.products.bestseller)
    expect(keychain).not.toHaveTextContent(th.products.concept)
  })
})

describe('the line filter', () => {
  it('filters the grid and puts the line in the URL', async () => {
    const user = userEvent.setup()
    renderPicker()
    await grid()

    await user.click(chip(th.products.lines.fabric))

    expect(cardNames()).toEqual(['TH Cotton shawl', 'TH Silk shawl'])
    expect(currentRoute()).toBe('/products?line=fabric')
    expect(screen.getByText(count(2))).toBeInTheDocument()
    expect(chip(th.products.lines.fabric)).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('starts from the line in the URL', async () => {
    renderPicker('/products?line=gift')
    await grid()

    expect(cardNames()).toEqual(['TH Keychain'])
    expect(chip(th.products.lines.gift)).toHaveAttribute('aria-pressed', 'true')
  })

  it('falls back to all products for an unknown line', async () => {
    renderPicker('/products?line=socks')
    await grid()

    expect(cardNames()).toHaveLength(4)
    expect(chip(th.products.lines.all)).toHaveAttribute('aria-pressed', 'true')
  })

  it('drops the parameter again when All is chosen', async () => {
    const user = userEvent.setup()
    renderPicker('/products?line=fabric')
    await grid()

    await user.click(chip(th.products.lines.all))

    expect(currentRoute()).toBe('/products')
    expect(cardNames()).toHaveLength(4)
  })

  it('shows an empty state for a line with no products', async () => {
    const user = userEvent.setup()
    renderPicker()
    await grid()

    await user.click(chip(th.products.lines.leaf))

    expect(screen.getByText(th.products.empty)).toBeInTheDocument()
    expect(screen.getByText(count(0))).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })
})

describe('the picker in the app shell', () => {
  it('marks the Products nav item as the current page', async () => {
    renderPicker()
    await grid()

    expect(screen.getByRole('link', { name: th.nav.products })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('switches product names with the language toggle', async () => {
    const user = userEvent.setup()
    renderPicker()
    await grid()

    expect(screen.getByText('TH Cotton shawl')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: en.language.en }))

    expect(screen.getByText('Cotton shawl')).toBeInTheDocument()
    expect(screen.queryByText('TH Cotton shawl')).not.toBeInTheDocument()
    expect(screen.getByText(en.products.intro)).toBeInTheDocument()
    expect(screen.getByText(en.products.bestseller)).toBeInTheDocument()
  })
})
