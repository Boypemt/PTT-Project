/**
 * The right panel: what the visitor is designing, and the settings that act on
 * it. For now that is the product it belongs to and its base colour; the
 * selected layer's own settings arrive with the pattern tools in task 08.
 */
import { useTranslation } from 'react-i18next'
import type { Product } from '@/catalog'
import { PlaceholderNote } from '@/components/PlaceholderNote'
import { useLocalized } from '@/i18n/useLocalized'
import { formatPrice } from '@/lib/price'

export function PropertiesPanel({ product }: { product: Product }) {
  const { t } = useTranslation()
  const localized = useLocalized()

  return (
    <>
      <div>
        <p className="font-medium text-ink-900">{localized(product.name)}</p>
        <p className="text-sm text-ink-500">
          {formatPrice(product.price, t('products.priceComingSoon'))}
        </p>
      </div>

      <PlaceholderNote>{t('customize.propertiesPlaceholder')}</PlaceholderNote>
    </>
  )
}
