/**
 * The right panel: what the visitor is designing, and the settings that act on
 * it. For now that is the product it belongs to and the colour of the cloth
 * underneath; the selected layer's own settings arrive with the pattern tools
 * in task 08.
 *
 * It reads the base colour from the store rather than from a prop, so the
 * canvas and the swatches cannot disagree about what is on screen.
 */
import { useTranslation } from 'react-i18next'
import type { Product } from '@/catalog'
import { PlaceholderNote } from '@/components/PlaceholderNote'
import { useDesignFor, useDesignStore } from '@/editor/useDesignStore'
import { useLocalized } from '@/i18n/useLocalized'
import { formatPrice } from '@/lib/price'
import { BaseColorPicker } from './BaseColorPicker'

export function PropertiesPanel({ product }: { product: Product }) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const { baseColor } = useDesignFor(product)
  const setBaseColor = useDesignStore((state) => state.setBaseColor)

  return (
    <>
      <div>
        <p className="font-medium text-ink-900">{localized(product.name)}</p>
        <p className="text-sm text-ink-500">
          {formatPrice(product.price, t('products.priceComingSoon'))}
        </p>
      </div>

      <BaseColorPicker
        colors={product.baseColors}
        selected={baseColor}
        onSelect={setBaseColor}
      />

      <PlaceholderNote>{t('customize.propertiesPlaceholder')}</PlaceholderNote>
    </>
  )
}
