/**
 * The right panel: what the visitor is designing, and the settings that act on
 * it. For now that is the product it belongs to and the colour of the cloth
 * underneath; the selected layer's own settings — scale, rotation, offset,
 * opacity — arrive with the layer controls in the next PR.
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
  const showPrintAreas = useDesignStore((state) => state.showPrintAreas)
  const setShowPrintAreas = useDesignStore((state) => state.setShowPrintAreas)

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

      {/* Which part of the product a pattern may land on is not obvious from
          a drawn mockup, so the visitor can ask to see it. */}
      <label className="flex min-h-touch items-center gap-2 text-sm text-ink-500">
        <input
          type="checkbox"
          checked={showPrintAreas}
          onChange={(event) => {
            setShowPrintAreas(event.target.checked)
          }}
          className="size-4"
        />
        {t('customize.showPrintAreas')}
      </label>

      <PlaceholderNote>{t('customize.propertiesPlaceholder')}</PlaceholderNote>
    </>
  )
}
