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

/**
 * Puts a stub layer on the selected print area, so the clipping and the layer
 * renderer can be seen working before the pattern library lands in task 08.
 *
 * Dev builds only — `import.meta.env.DEV` is a constant Vite folds away, so
 * neither the button nor this text reaches a visitor. Untranslated for the
 * same reason, as on /dev/catalog.
 */
function AddTestLayerButton({ product }: { product: Product }) {
  const addLayer = useDesignStore((state) => state.addLayer)
  const selected = useDesignStore((state) => state.selectedPrintAreaId)
  const printAreaId = selected ?? product.printAreas[0]?.id

  if (printAreaId === undefined) return null

  return (
    <button
      type="button"
      onClick={() => {
        addLayer({
          type: 'tile',
          patternId: 'dev-stub',
          printAreaId,
          scale: 1,
          rotation: 0,
          offsetX: 0,
          offsetY: 0,
          colors: ['#a23b62'],
          opacity: 0.5,
        })
      }}
      className="min-h-touch rounded-xl border border-dashed border-border-soft px-3 text-sm text-ink-500 hover:bg-paper-100"
    >
      Add test layer — {printAreaId} (dev)
    </button>
  )
}

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

      {import.meta.env.DEV ? <AddTestLayerButton product={product} /> : null}
    </>
  )
}
