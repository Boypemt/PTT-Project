/**
 * The settings of the tile layer the visitor has selected: how big the pattern
 * is, which way round it sits, where it starts and how strongly it prints.
 *
 * Every slider writes straight to the store, which is cheap enough to do on
 * each frame of a drag: the pattern's bitmap is cached per file (see
 * `usePatternImage`), so moving a slider only hands Konva different numbers —
 * nothing is fetched, rasterised or re-cached while a thumb is moving.
 *
 * Offsets are in mockup units, the same units the design stores and a share
 * link will carry. ±300 covers a full repeat of every tile in the catalog and
 * most of a repeat of the largest, which is as far as moving one is useful:
 * a pattern that repeats looks the same again after that.
 */
import { useTranslation } from 'react-i18next'
import { useCatalog, type Product } from '@/catalog'
import type { LayerPatch } from '@/editor/store'
import { useDesignStore } from '@/editor/useDesignStore'
import { useLocalized } from '@/i18n/useLocalized'
import { LeafDyePicker } from './LeafDyePicker'
import { SliderField } from './SliderField'

/** Both ends of each slider, with the step a visitor can feel. */
const RANGES = {
  scale: { min: 0.2, max: 3, step: 0.05 },
  rotation: { min: 0, max: 360, step: 1 },
  offset: { min: -300, max: 300, step: 5 },
  // Not down to nothing: a layer faded to invisible reads as a layer that has
  // gone wrong, and the list is the way to get rid of one.
  opacity: { min: 0.1, max: 1, step: 0.05 },
} as const

export function LayerProperties({ product }: { product: Product }) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const { status, catalog } = useCatalog()
  const layers = useDesignStore((state) => state.design.layers)
  const selectedLayerId = useDesignStore((state) => state.selectedLayerId)
  const updateLayer = useDesignStore((state) => state.updateLayer)
  const removeLayer = useDesignStore((state) => state.removeLayer)

  const layer = layers.find((entry) => entry.id === selectedLayerId)

  // Motifs get their own tools in task 09; until then this is tiles only.
  if (layer === undefined || layer.type !== 'tile') {
    return <p className="text-sm text-ink-500">{t('customize.layer.none')}</p>
  }

  const pattern =
    status === 'ready'
      ? catalog.patterns.find((entry) => entry.id === layer.patternId)
      : undefined
  const area = product.printAreas.find(
    (entry) => entry.id === layer.printAreaId,
  )

  const set = (patch: LayerPatch) => {
    updateLayer(layer.id, patch)
  }

  return (
    <section className="flex flex-col gap-2 border-t border-border-soft pt-3">
      <div>
        <h3 className="font-medium text-ink-900">
          {pattern === undefined
            ? t('customize.layer.title')
            : localized(pattern.name)}
        </h3>
        {area === undefined ? null : (
          <p className="text-xs text-ink-500">{localized(area.name)}</p>
        )}
      </div>

      <SliderField
        label={t('customize.layer.scale')}
        value={layer.scale}
        display={`${layer.scale.toFixed(2)}×`}
        {...RANGES.scale}
        onChange={(scale) => {
          set({ scale })
        }}
      />

      <SliderField
        label={t('customize.layer.rotation')}
        value={layer.rotation}
        display={`${Math.round(layer.rotation).toString()}°`}
        {...RANGES.rotation}
        onChange={(rotation) => {
          set({ rotation })
        }}
      />

      <SliderField
        label={t('customize.layer.offsetX')}
        value={layer.offsetX}
        display={Math.round(layer.offsetX).toString()}
        {...RANGES.offset}
        onChange={(offsetX) => {
          set({ offsetX })
        }}
      />

      <SliderField
        label={t('customize.layer.offsetY')}
        value={layer.offsetY}
        display={Math.round(layer.offsetY).toString()}
        {...RANGES.offset}
        onChange={(offsetY) => {
          set({ offsetY })
        }}
      />

      <SliderField
        label={t('customize.layer.opacity')}
        value={layer.opacity}
        display={`${Math.round(layer.opacity * 100).toString()}%`}
        {...RANGES.opacity}
        onChange={(opacity) => {
          set({ opacity })
        }}
      />

      <LeafDyePicker
        dyes={status === 'ready' ? catalog.leafDyes : []}
        pattern={pattern}
        colors={layer.colors}
        onChange={(colors) => {
          set({ colors })
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            set({ scale: 1, rotation: 0, offsetX: 0, offsetY: 0, opacity: 1 })
          }}
          className="min-h-touch rounded-xl border border-border-soft px-3 text-sm font-medium text-ink-700 transition-colors hover:bg-paper-100"
        >
          {t('customize.layer.reset')}
        </button>
        <button
          type="button"
          onClick={() => {
            removeLayer(layer.id)
          }}
          className="min-h-touch rounded-xl border border-teak-300 px-3 text-sm font-medium text-teak-700 transition-colors hover:bg-teak-100"
        >
          {t('customize.layer.delete')}
        </button>
      </div>
    </section>
  )
}
