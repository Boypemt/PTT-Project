/**
 * Internal preview of every catalog asset, so the mockups, tiles and motifs
 * can be eyeballed in one place: are the mockups the right shape, do the
 * print areas sit inside them, do the tiles repeat without a seam?
 *
 * Reached at /dev/catalog in every build, so the team and the designer can
 * review assets on the Vercel preview. It is not linked from the nav and it
 * asks robots not to index it while it is open.
 *
 * The page's own chrome is deliberately untranslated — it is a drawing board
 * for whoever is building the catalog, not part of the visitor's site. Catalog
 * data does go through `useLocalized`, so it reads as a visitor would see it.
 */
import { useState } from 'react'
import { useCatalog, type Pattern, type Product } from '@/catalog'
import { useNoIndex } from '@/app/useNoIndex'
import { ProductMockup } from '@/components/ProductMockup'
import { useLocalized } from '@/i18n/useLocalized'

const PRINT_AREA_INK = '#a23b62'

function formatPrice(product: Product): string {
  const { price } = product
  if (price === null) return 'price TBD'

  const range =
    price.max === undefined ? `${price.min}` : `${price.min}–${price.max}`
  return `${range} ${price.currency}`
}

function ColorSwatches({
  colors,
  selected,
  onSelect,
}: {
  colors: readonly string[]
  selected?: string
  onSelect?: (color: string) => void
}) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {colors.map((color) => (
        <li key={color}>
          {onSelect ? (
            <button
              type="button"
              aria-label={`Preview base colour ${color}`}
              aria-pressed={color === selected}
              onClick={() => onSelect(color)}
              style={{ backgroundColor: color }}
              className={`size-7 rounded-full border transition-transform ${
                color === selected
                  ? 'border-ink-700 scale-110'
                  : 'border-border-soft'
              }`}
            />
          ) : (
            <span
              title={color}
              style={{ backgroundColor: color }}
              className="block size-7 rounded-full border border-border-soft"
            />
          )}
        </li>
      ))}
    </ul>
  )
}

function ProductCard({
  product,
  showPrintAreas,
}: {
  product: Product
  showPrintAreas: boolean
}) {
  const localized = useLocalized()
  const [baseColor, setBaseColor] = useState(product.baseColors[0] ?? '#ffffff')
  const { mockup, printAreas } = product

  return (
    <li className="rounded-xl border border-border-soft bg-surface p-3">
      <ProductMockup
        mockup={mockup}
        baseColor={baseColor}
        className="rounded-lg"
      >
        {showPrintAreas ? (
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${mockup.width} ${mockup.height}`}
            className="absolute inset-0 size-full"
          >
            {printAreas.map((area) =>
              area.clip.type === 'rect' ? (
                <rect
                  key={area.id}
                  x={area.clip.x}
                  y={area.clip.y}
                  width={area.clip.width}
                  height={area.clip.height}
                  fill="none"
                  stroke={PRINT_AREA_INK}
                  strokeWidth={4}
                  strokeDasharray="16 12"
                />
              ) : (
                <path
                  key={area.id}
                  d={area.clip.d}
                  fill="none"
                  stroke={PRINT_AREA_INK}
                  strokeWidth={4}
                  strokeDasharray="16 12"
                />
              ),
            )}
          </svg>
        ) : null}
      </ProductMockup>

      <h3 className="mt-3 font-medium text-ink-900">
        {localized(product.name)}
      </h3>
      <p className="text-sm text-ink-500">
        <code>{product.id}</code> · {product.line} · {formatPrice(product)} ·{' '}
        <span
          className={
            product.status === 'planned'
              ? 'text-marigold-900'
              : 'text-forest-600'
          }
        >
          {product.status}
        </span>
      </p>
      <p className="mt-2 text-sm text-ink-500">
        print areas:{' '}
        {printAreas
          .map((area) => `${area.id} (${area.allowedKinds.join('+')})`)
          .join(', ')}
      </p>
      <div className="mt-2">
        <ColorSwatches
          colors={product.baseColors}
          selected={baseColor}
          onSelect={setBaseColor}
        />
      </div>
    </li>
  )
}

function PatternCard({ pattern }: { pattern: Pattern }) {
  const localized = useLocalized()

  return (
    <li className="rounded-xl border border-border-soft bg-surface p-3">
      {pattern.kind === 'tile' ? (
        <div
          aria-hidden="true"
          className="aspect-square rounded-lg border border-border-soft bg-paper-50"
          style={{
            backgroundImage: `url(${pattern.src})`,
            backgroundSize: '50% auto',
            backgroundRepeat: 'repeat',
          }}
        />
      ) : (
        <img
          src={pattern.src}
          alt={`${localized(pattern.name)} motif`}
          className="aspect-square w-full rounded-lg border border-border-soft bg-paper-50 object-contain p-2"
        />
      )}

      <h3 className="mt-3 font-medium text-ink-900">
        {localized(pattern.name)}
      </h3>
      <p className="text-sm text-ink-500">
        <code>{pattern.id}</code> · {pattern.kind}
        {pattern.recolorable ? ' · recolorable' : ''}
      </p>
      {pattern.leafIds ? (
        <p className="text-sm text-ink-500">
          leaves: {pattern.leafIds.join(', ')}
        </p>
      ) : null}
      <div className="mt-2">
        <ColorSwatches colors={pattern.defaultColors} />
      </div>
    </li>
  )
}

export function DevCatalogPage() {
  const { status, catalog } = useCatalog()
  const localized = useLocalized()
  const [showPrintAreas, setShowPrintAreas] = useState(true)

  useNoIndex()

  // Loading and failure are drawn by CatalogGate, which this route sits behind.
  if (status !== 'ready') return null

  const { leafDyes, patterns, products } = catalog
  const tiles = patterns.filter((pattern) => pattern.kind === 'tile')
  const motifs = patterns.filter((pattern) => pattern.kind === 'motif')

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-teak-700">
        Catalog preview <span className="text-ink-500">(internal)</span>
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        {products.length} products · {tiles.length} tiles · {motifs.length}{' '}
        motifs · {leafDyes.length} leaf dyes. Every entry is a placeholder.
        Names follow the language toggle; this page is not linked from the nav
        and is marked noindex.
      </p>

      <section className="mt-6">
        <h2 className="font-medium text-ink-900">Leaf dyes</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {leafDyes.flatMap((leafDye) =>
            leafDye.colors.map((color) => (
              <li
                key={`${leafDye.id}-${color.id}`}
                className="flex items-center gap-2 rounded-full border border-border-soft bg-surface py-1 pr-3 pl-1 text-sm"
              >
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: color.hex }}
                  className="size-6 rounded-full"
                />
                {localized(leafDye.name)} · {localized(color.name)}
              </li>
            )),
          )}
        </ul>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium text-ink-900">Products</h2>
          <label className="flex min-h-touch items-center gap-2 text-sm text-ink-500">
            <input
              type="checkbox"
              checked={showPrintAreas}
              onChange={(event) => setShowPrintAreas(event.target.checked)}
              className="size-4"
            />
            Show print areas
          </label>
        </div>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showPrintAreas={showPrintAreas}
            />
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-medium text-ink-900">
          Tiles <span className="text-ink-500">(shown repeated)</span>
        </h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-medium text-ink-900">Motifs</h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {motifs.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </ul>
      </section>
    </div>
  )
}
