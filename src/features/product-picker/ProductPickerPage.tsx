/**
 * Where a visitor picks what to customize: every product in the catalog, in
 * the order the picker wants them, filterable by line.
 *
 * The page holds no knowledge of a specific product — the catalog supplies the
 * entries and `src/lib/products` the rules for ordering and filtering them.
 */
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useCatalog, type ProductLine } from '@/catalog'
import {
  filterProductsByLine,
  parseProductLine,
  sortProductsForPicker,
} from '@/lib/products'
import { LineFilter } from './LineFilter'
import { ProductCard } from './ProductCard'

const LINE_PARAM = 'line'

export function ProductPickerPage() {
  const { t } = useTranslation()
  const { status, catalog } = useCatalog()
  const [searchParams, setSearchParams] = useSearchParams()

  // Loading and failure are drawn by CatalogGate, which this route sits behind.
  if (status !== 'ready') return null

  // An unknown or stale `?line=` reads as "all" rather than as an empty grid.
  const activeLine = parseProductLine(searchParams.get(LINE_PARAM))

  const products = sortProductsForPicker(
    filterProductsByLine(catalog.products, activeLine),
  )

  const selectLine = (line: ProductLine | null) => {
    const next = new URLSearchParams(searchParams)

    if (line === null) next.delete(LINE_PARAM)
    else next.set(LINE_PARAM, line)

    setSearchParams(next)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-teak-700">
        {t('products.title')}
      </h1>
      <p className="mt-2 max-w-2xl text-lg text-ink-500">
        {t('products.intro')}
      </p>

      <div className="mt-6">
        <LineFilter active={activeLine} onChange={selectLine} />
      </div>

      <p className="mt-4 text-sm text-ink-500" role="status">
        {t('products.count', { count: products.length })}
      </p>

      {products.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border-soft bg-surface px-4 py-10 text-center text-ink-500">
          {t('products.empty')}
        </p>
      ) : (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ul>
      )}
    </section>
  )
}
