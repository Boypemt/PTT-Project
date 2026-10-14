/**
 * The customizer at `/customize/:productId`: the page a visitor designs on.
 *
 * The route component resolves the id in the URL against the catalog — it
 * never names a product itself — and the editor below it works from whatever
 * product that is. What sits in the canvas area is a still `ProductMockup` for
 * now; the react-konva stage replaces it in the next PR (07b in
 * docs/ROADMAP.md), and matching this look is how that one is judged.
 */
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useCatalog, type Product } from '@/catalog'
import { ProductMockup } from '@/components/ProductMockup'
import { useDesignFor } from '@/editor/useDesignStore'
import { useLocalized } from '@/i18n/useLocalized'
import { EditorWorkspace } from './EditorWorkspace'
import { ProductNotFound } from './ProductNotFound'

function ProductEditor({ product }: { product: Product }) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const { baseColor } = useDesignFor(product)

  return (
    <section className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3">
        <Link
          to="/products"
          className="flex min-h-touch items-center gap-1 font-medium text-forest-700 hover:text-forest-600"
        >
          <span aria-hidden="true">←</span>
          {t('customize.back')}
        </Link>
        <div>
          <p className="text-sm text-ink-500">{t('customize.title')}</p>
          <h1 className="font-display text-xl font-bold text-teak-700">
            {localized(product.name)}
          </h1>
        </div>
      </header>

      <EditorWorkspace product={product}>
        <ProductMockup
          mockup={product.mockup}
          baseColor={baseColor}
          className="max-h-full w-full max-w-lg rounded-xl"
        />
      </EditorWorkspace>
    </section>
  )
}

export function CustomizePage() {
  const { productId = '' } = useParams<{ productId: string }>()
  const { status, catalog } = useCatalog()

  // Loading and failure are drawn by CatalogGate, which this route sits behind.
  if (status !== 'ready') return null

  const product = catalog.products.find((entry) => entry.id === productId)

  if (product === undefined) return <ProductNotFound />

  return <ProductEditor product={product} />
}
