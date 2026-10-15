/**
 * The front door's first screen: the community's own sentence, the way in to
 * the customizer, and a product standing on a piece of leaf print.
 *
 * The backdrop is the eco-print tile repeated as a CSS background, not a
 * drawing of one — the same file the editor prints onto cloth, so the hero
 * changes with the catalog. Konva stays out of this page on purpose (see
 * `AppRoutes`): the editor's chunk should not be downloaded by someone who has
 * only read the headline.
 *
 * Product and tile arrive as props because the landing page renders before the
 * catalog does — until it is there, the text stands on its own and the frame is
 * simply absent rather than being a box waiting for a picture.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Pattern, Product } from '@/catalog'
import { ProductMockup } from '@/components/ProductMockup'
import { useLocalized } from '@/i18n/useLocalized'

/** The printed mat the product sits on, with the product framed on top. */
function PrintedFrame({ product, tile }: { product: Product; tile?: Pattern }) {
  const { t } = useTranslation()
  const localized = useLocalized()

  const name = localized(product.name)
  // The product's default cloth, as in the picker and the editor.
  const baseColor = product.baseColors[0] ?? '#ffffff'

  return (
    <figure className="flex flex-col items-center gap-3">
      <div
        // Roughly a third of the card per repeat: large enough that the leaves
        // still read as leaves rather than turning into texture.
        style={
          tile === undefined
            ? undefined
            : { backgroundImage: `url("${tile.src}")` }
        }
        className="w-full max-w-md rounded-[1.75rem] border border-paper-400 bg-paper-200 bg-[length:32%] bg-repeat p-4 shadow-sm sm:p-6"
      >
        {/* Unpainted, so the cloth sits on the leaf print rather than on a
            card laid over it. */}
        <ProductMockup
          mockup={product.mockup}
          baseColor={baseColor}
          transparent
          className="drop-shadow-md"
        />
      </div>
      <figcaption className="text-sm text-ink-500">
        {t('home.preview', { product: name })}
      </figcaption>
    </figure>
  )
}

export function HeroSection({
  product,
  tile,
}: {
  /** Undefined until the catalog is loaded, and if it fails to load at all. */
  product?: Product
  tile?: Pattern
}) {
  const { t } = useTranslation()

  return (
    <section className="border-b border-border-soft bg-paper-100">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16">
        <div className="flex flex-col items-start gap-5">
          {/* Tracked capitals in English only — they break Thai mark
              placement (see the `en:` variant in index.css). */}
          <p className="text-sm font-semibold text-forest-600 en:tracking-[0.18em] en:uppercase">
            {t('brand.enterprise')}
          </p>
          {/* Thai sets a touch taller than Latin, hence the explicit leading. */}
          <h1 className="font-display text-4xl leading-tight font-bold text-balance text-teak-700 sm:text-5xl">
            {t('home.title')}
          </h1>
          <p className="max-w-xl text-lg text-pretty text-ink-700">
            {t('home.intro')}
          </p>
          <Link
            to="/products"
            className="inline-flex min-h-touch items-center rounded-full bg-forest-600 px-7 text-lg font-medium text-paper-50 shadow-sm transition-colors hover:bg-forest-700"
          >
            {t('home.cta')}
          </Link>
        </div>

        {product === undefined ? null : (
          <PrintedFrame product={product} tile={tile} />
        )}
      </div>
    </section>
  )
}
