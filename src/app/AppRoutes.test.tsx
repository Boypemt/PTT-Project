import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import en from '@/i18n/en.json'
import { LANGUAGE_STORAGE_KEY } from '@/i18n/language'
import th from '@/i18n/th.json'
import {
  catalogFile,
  makeLeafDye,
  makePattern,
  makeProduct,
  requestUrl,
} from '@/test/catalogFixtures'
import { renderApp, validCatalogFiles } from '@/test/renderApp'

const robotsMeta = () => document.head.querySelector('meta[name="robots"]')

describe('routing', () => {
  it('renders the landing page at /', () => {
    renderApp()

    expect(
      screen.getByRole('heading', { level: 1, name: th.home.title }),
    ).toBeInTheDocument()
  })

  it('renders the product picker at /products', async () => {
    renderApp({ route: '/products' })

    expect(
      await screen.findByRole('heading', { level: 1, name: th.products.title }),
    ).toBeInTheDocument()
  })

  it('opens the product from /customize/:productId in the editor', async () => {
    renderApp({ route: '/customize/handkerchief' })

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: makeProduct().name.th,
      }),
    ).toBeInTheDocument()
  })

  it('shows the 404 page for an unknown route', () => {
    renderApp({ route: '/nope/not-a-page' })

    expect(
      screen.getByRole('heading', { level: 1, name: th.notFound.title }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: th.notFound.backHome }),
    ).toBeInTheDocument()
  })

  it('keeps the header and footer on every page', () => {
    renderApp({ route: '/nope' })

    expect(screen.getByRole('banner')).toHaveTextContent(th.brand.name)
    expect(screen.getByRole('contentinfo')).toHaveTextContent(th.footer.address)
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      th.footer.prototype,
    )
  })
})

describe('/dev/catalog', () => {
  it('renders in any build and asks robots not to index it', async () => {
    const { unmount } = renderApp({ route: '/dev/catalog' })

    expect(
      await screen.findByRole('heading', { level: 1, name: /Catalog preview/ }),
    ).toBeInTheDocument()
    expect(robotsMeta()).toHaveAttribute('content', 'noindex')

    unmount()
    expect(robotsMeta()).toBeNull()
  })

  it('is not linked from the nav', () => {
    renderApp()

    const navLinks = screen.getAllByRole('link')
    expect(navLinks.map((link) => link.getAttribute('href'))).not.toContain(
      '/dev/catalog',
    )
  })
})

describe('language toggle', () => {
  it('switches the page text and remembers the choice', async () => {
    const user = userEvent.setup()
    renderApp()

    expect(
      screen.getByRole('heading', { level: 1, name: th.home.title }),
    ).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('th')

    await user.click(screen.getByRole('button', { name: en.language.en }))

    expect(
      screen.getByRole('heading', { level: 1, name: en.home.title }),
    ).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
  })

  it('marks the active language as pressed', async () => {
    const user = userEvent.setup()
    renderApp()

    const thai = screen.getByRole('button', { name: th.language.th })
    const english = screen.getByRole('button', { name: en.language.en })

    expect(thai).toHaveAttribute('aria-pressed', 'true')
    expect(english).toHaveAttribute('aria-pressed', 'false')

    await user.click(english)

    expect(thai).toHaveAttribute('aria-pressed', 'false')
    expect(english).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('mobile menu', () => {
  it('opens and closes, and closes again on navigating', async () => {
    const user = userEvent.setup()
    renderApp()

    const hamburger = screen.getByRole('button', { name: th.nav.openMenu })
    expect(hamburger).toHaveAttribute('aria-expanded', 'false')

    await user.click(hamburger)
    expect(
      screen.getByRole('button', { name: th.nav.closeMenu }),
    ).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('link', { name: th.nav.products }))
    expect(
      screen.getByRole('button', { name: th.nav.openMenu }),
    ).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('catalog states', () => {
  it('shows the loading message before the catalog arrives', () => {
    renderApp({ route: '/products' })

    expect(screen.getByRole('status')).toHaveTextContent(th.catalog.loading)
  })

  it('prints the CatalogError message where the designer can read it', async () => {
    const files = {
      ...validCatalogFiles,
      'patterns.json': catalogFile([makePattern({ leafIds: ['teek'] })]),
    }

    renderApp({ route: '/products', files })

    expect(
      await screen.findByText(/patterns\.json.*unknown leaf dye "teek"/s),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: th.catalog.errorTitle }),
    ).toBeInTheDocument()
  })

  it('still serves the landing page when the catalog is broken', async () => {
    const files = {
      ...validCatalogFiles,
      'products.json': catalogFile([makeProduct({ baseColors: [] })]),
    }

    renderApp({ route: '/', files })

    expect(
      await screen.findByRole('heading', { level: 1, name: th.home.title }),
    ).toBeInTheDocument()
  })

  it('reloads the catalog when the error screen offers to retry', async () => {
    const user = userEvent.setup()
    // patterns.json is broken on the first read and fixed on the second, as if
    // the designer had corrected the file and hit the button.
    let patternReads = 0
    const fetchImpl: typeof fetch = (input) => {
      const url = requestUrl(input)
      let body: unknown = catalogFile([makeLeafDye()])

      if (url.endsWith('products.json')) {
        body = catalogFile([makeProduct()])
      } else if (url.endsWith('patterns.json')) {
        patternReads += 1
        body = catalogFile([
          patternReads === 1
            ? makePattern({ leafIds: ['teek'] })
            : makePattern(),
        ])
      }

      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
    }

    renderApp({ route: '/products', fetchImpl })

    await user.click(
      await screen.findByRole('button', { name: th.catalog.retry }),
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: th.products.title }),
    ).toBeInTheDocument()
  })
})
