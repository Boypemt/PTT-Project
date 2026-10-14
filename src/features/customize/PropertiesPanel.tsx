/**
 * The right panel: what the visitor is designing, and the settings that act on
 * it. For now that is the product it belongs to and the colour of the cloth
 * underneath, and then the settings of whichever layer is selected.
 *
 * It reads the base colour from the store rather than from a prop, so the
 * canvas and the swatches cannot disagree about what is on screen.
 */
import { useTranslation } from 'react-i18next'
import type { Product } from '@/catalog'
import { useDesignFor, useDesignStore } from '@/editor/useDesignStore'
import { useLocalized } from '@/i18n/useLocalized'
import { formatPrice } from '@/lib/price'
import { BaseColorPicker } from './BaseColorPicker'
import { LayerProperties } from './LayerProperties'

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

      {/* Before the settings that act on the whole product: once a pattern is
          on the cloth, this is what the visitor came back to the panel for,
          and on a phone the sheet is short enough that order decides what
          they have to scroll for. */}
      <LayerProperties product={product} />

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
    </>
  )
}
