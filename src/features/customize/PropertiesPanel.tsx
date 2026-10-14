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
import { useCatalog, type Product } from '@/catalog'
import { PlaceholderNote } from '@/components/PlaceholderNote'
import { useDesignFor, useDesignStore } from '@/editor/useDesignStore'
import { useLocalized } from '@/i18n/useLocalized'
import { formatPrice } from '@/lib/price'
import { BaseColorPicker } from './BaseColorPicker'

/**
 * Puts one tile layer on the selected print area and cycles it through the
 * catalog's tiles, so the pattern fill can be seen working before the pattern
 * library lands in the next PR. The second button pushes it off its defaults,
 * which is how a rotated fill is checked for bare corners.
 *
 * Dev builds only — `import.meta.env.DEV` is a constant Vite folds away, so
 * neither the buttons nor this text reaches a visitor. Untranslated for the
 * same reason, as on /dev/catalog. Both go away with the real library.
 */
function DevTileControls({ product }: { product: Product }) {
  const { status, catalog } = useCatalog()
  const layers = useDesignStore((state) => state.design.layers)
  const selectedLayerId = useDesignStore((state) => state.selectedLayerId)
  const selectedPrintAreaId = useDesignStore(
    (state) => state.selectedPrintAreaId,
  )
  const addLayer = useDesignStore((state) => state.addLayer)
  const removeLayer = useDesignStore((state) => state.removeLayer)
  const updateLayer = useDesignStore((state) => state.updateLayer)

  const printAreaId = selectedPrintAreaId ?? product.printAreas[0]?.id
  const tiles =
    status === 'ready'
      ? catalog.patterns.filter((pattern) => pattern.kind === 'tile')
      : []
  const current = layers.at(-1)
  const at = tiles.findIndex((pattern) => pattern.id === current?.patternId)
  const next = tiles.at((at + 1) % Math.max(tiles.length, 1))

  if (printAreaId === undefined || next === undefined) return null

  const button =
    'min-h-touch rounded-xl border border-dashed border-border-soft px-3 text-sm text-ink-500 hover:bg-paper-100'

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => {
          // One tile at a time, so each click is a clean look at one pattern.
          if (current !== undefined) removeLayer(current.id)

          addLayer({
            type: 'tile',
            patternId: next.id,
            printAreaId,
            scale: 1,
            rotation: 0,
            offsetX: 0,
            offsetY: 0,
            colors: next.defaultColors,
            opacity: 1,
          })
        }}
        className={button}
      >
        Tile → {next.id} (dev)
      </button>

      <button
        type="button"
        disabled={selectedLayerId === null}
        onClick={() => {
          if (selectedLayerId !== null) {
            updateLayer(selectedLayerId, { scale: 1.6, rotation: 45 })
          }
        }}
        className={`${button} disabled:opacity-40`}
      >
        45° ×1.6 (dev)
      </button>
    </div>
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

      {import.meta.env.DEV ? <DevTileControls product={product} /> : null}
    </>
  )
}
