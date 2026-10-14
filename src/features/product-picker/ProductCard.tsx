/**
 * One product in the picker grid: mockup, name, price and the way in to the
 * customizer.
 *
 * The whole card is one link, stretched over the card by the `after:` layer on
 * the Customize control, so there is a single thing to tab to and nothing
 * interactive nested inside it. The focus ring is drawn on the card
 * (`focus-within`) rather than on the control, so keyboard users see the whole
 * target they are about to follow.
 *
 * Badges come from data — the `bestseller` tag and the product's status — so
 * highlighting a different product is an edit to products.json.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Product } from '@/catalog'
import { ProductMockup } from '@/components/ProductMockup'
import { useLocalized } from '@/i18n/useLocalized'
import { formatPrice } from '@/lib/price'
import { isBestseller } from '@/lib/products'

function Badge({
  tone,
  children,
}: {
  tone: 'forest' | 'marigold'
  children: string
}) {
  const tones = {
    forest: 'bg-forest-100 text-forest-700',
    marigold: 'bg-marigold-100 text-marigold-700',
  }

  return (
    <li
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </li>
  )
}

export function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation()
  const localized = useLocalized()

  const name = localized(product.name)
  // The first base colour is the product's default cloth, as in the editor.
  const baseColor = product.baseColors[0] ?? '#ffffff'

  return (
    <li className="relative flex flex-col overflow-hidden rounded-2xl border border-border-soft bg-surface transition-shadow focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forest-600 hover:shadow-md">
      <ProductMockup mockup={product.mockup} baseColor={baseColor} />

      <div className="flex flex-1 flex-col gap-2 p-4">
        {isBestseller(product) || product.status === 'planned' ? (
          <ul className="flex flex-wrap gap-1.5">
            {isBestseller(product) ? (
              <Badge tone="forest">{t('products.bestseller')}</Badge>
            ) : null}
            {product.status === 'planned' ? (
              <Badge tone="marigold">{t('products.concept')}</Badge>
            ) : null}
          </ul>
        ) : null}

        <h2 className="font-display text-lg font-semibold text-ink-900">
          {name}
        </h2>
        <p className="text-ink-700">
          {formatPrice(product.price, t('products.priceComingSoon'))}
        </p>

        <Link
          to={`/customize/${product.id}`}
          aria-label={t('products.customizeProduct', { product: name })}
          className="mt-auto flex min-h-touch items-center justify-center rounded-xl bg-forest-600 px-4 font-medium text-white transition-colors after:absolute after:inset-0 hover:bg-forest-700 focus-visible:outline-none"
        >
          {t('products.customize')}
        </Link>
      </div>
    </li>
  )
}
