/**
 * Dev-only preview of every catalog asset, so the placeholder mockups,
 * tiles and motifs can be eyeballed in one place: are the mockups the right
 * shape, do the print areas sit inside them, do the tiles repeat without a
 * seam? Reached at /dev/catalog while `import.meta.env.DEV` (see App.tsx);
 * the real routing and the product picker arrive with tasks 05 and 06.
 *
 * Strings here are deliberately not translated — this page is a drawing board
 * for whoever is building the catalog, not part of the visitor's site.
 */
import { useState } from 'react'
import { useCatalog, type Pattern, type Product } from '@/catalog'

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
  const [baseColor, setBaseColor] = useState(product.baseColors[0] ?? '#ffffff')
  const { mockup, printAreas } = product

  return (
    <li className="rounded-xl border border-border-soft bg-surface p-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-paper-100">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundColor: baseColor,
            maskImage: `url(${mockup.base})`,
            WebkitMaskImage: `url(${mockup.base})`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
          }}
        />
        {mockup.overlay ? (
          <img
            src={mockup.overlay}
            alt=""
            className="absolute inset-0 size-full mix-blend-multiply"
          />
        ) : null}
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
      </div>

      <h3 className="mt-3 font-medium text-ink-900">
        {product.name.th}{' '}
        <span className="text-ink-500">/ {product.name.en}</span>
      </h3>
      <p className="text-sm text-ink-500">
        <code>{product.id}</code> · {product.line} · {formatPrice(product)} ·{' '}
        <span
          className={
            product.status === 'planned'
              ? 'text-marigold-700'
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
          alt={`${pattern.name.en} motif`}
          className="aspect-square w-full rounded-lg border border-border-soft bg-paper-50 object-contain p-2"
        />
      )}

      <h3 className="mt-3 font-medium text-ink-900">
        {pattern.name.th}{' '}
        <span className="text-ink-500">/ {pattern.name.en}</span>
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
  const { status, catalog, error } = useCatalog()
  const [showPrintAreas, setShowPrintAreas] = useState(true)

  if (status === 'loading') {
    return <p className="p-8 text-ink-500">Loading the catalog…</p>
  }

  if (status === 'error') {
    return (
      <pre className="m-8 overflow-auto rounded-lg bg-teak-100 p-4 text-sm text-teak-900">
        {error.message}
      </pre>
    )
  }

  const { leafDyes, patterns, products } = catalog
  const tiles = patterns.filter((pattern) => pattern.kind === 'tile')
  const motifs = patterns.filter((pattern) => pattern.kind === 'motif')

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-teak-700">
        Catalog preview <span className="text-ink-500">(dev only)</span>
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        {products.length} products · {tiles.length} tiles · {motifs.length}{' '}
        motifs · {leafDyes.length} leaf dyes. Every entry is a placeholder.
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
                {leafDye.name.en} · {color.name.en}
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
    </main>
  )
}
