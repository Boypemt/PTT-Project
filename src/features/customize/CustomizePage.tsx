/**
 * The customizer at `/customize/:productId`: the page a visitor designs on.
 *
 * The route component resolves the id in the URL against the catalog — it
 * never names a product itself — and the editor below it works from whatever
 * product that is.
 */
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useCatalog, type Product } from '@/catalog'
import { EditorCanvas } from '@/editor/EditorCanvas'
import { ExportButton } from '@/features/export/ExportButton'
import { useLocalized } from '@/i18n/useLocalized'
import { isEnabled } from '@/lib/flags'
import { EditorWorkspace } from './EditorWorkspace'
import { ProductNotFound } from './ProductNotFound'

function ProductEditor({ product }: { product: Product }) {
  const { t } = useTranslation()
  const localized = useLocalized()

  const exporting = isEnabled('export')

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      {/* The "Done" button takes the far end of the row the back link already
          occupies — `ml-auto` eats the space between them — so the header is
          the same height with it as without, at both widths. That matters on a
          phone and nowhere else: the sheet at the bottom has no slack to lend,
          so a row added up here would come off the canvas or off the pattern
          names, and `e2e/pattern-strip.spec.ts` is what holds this to it. */}
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
        {exporting ? <ExportButton productId={product.id} /> : null}
      </header>

      <EditorWorkspace product={product}>
        <EditorCanvas product={product} />
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
