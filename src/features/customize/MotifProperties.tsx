/**
 * The settings of the leaf the visitor has selected: how big it is, which way
 * round it sits, how strongly it printed, and which dyes it took.
 *
 * The same controls a tile gets, minus the two offsets — a leaf is moved by
 * dragging it on the cloth, which is the whole point of a motif — plus the
 * three things you do to a leaf rather than to a pattern: copy it, put it back
 * the way it arrived, throw it away.
 *
 * Deliberately not a second implementation of anything: `SliderField` and
 * `LeafDyePicker` are the tile panel's, and the labels are the same keys, so a
 * leaf's "size" and a tile's "size" read alike in both languages.
 */
import { useTranslation } from 'react-i18next'
import { useCatalog, type MotifLayer, type Product } from '@/catalog'
import { areaBounds } from '@/editor/areaBounds'
import { duplicateMotif, motifPlacement } from '@/editor/motifPlacement'
import type { LayerPatch } from '@/editor/store'
import { useDesignStore } from '@/editor/useDesignStore'
import { useLocalized } from '@/i18n/useLocalized'
import { LeafDyePicker } from './LeafDyePicker'
import { SliderField } from './SliderField'

/**
 * Both ends of each slider, with the step a visitor can feel.
 *
 * The size slider stops short of `MOTIF_SCALE` at either end: those are the
 * limits a hand-edited design is held to, and a slider that can reach them
 * would spend half its travel on sizes nobody wants.
 */
const RANGES = {
  scale: { min: 0.1, max: 2, step: 0.05 },
  rotation: { min: 0, max: 360, step: 1 },
  // Not down to nothing: a leaf faded to invisible reads as one that has gone
  // wrong, and the list is the way to get rid of one.
  opacity: { min: 0.1, max: 1, step: 0.05 },
} as const

const BUTTON =
  'min-h-touch rounded-xl border border-border-soft px-3 text-sm font-medium text-ink-700 transition-colors hover:bg-paper-100'

export function MotifProperties({
  layer,
  product,
}: {
  layer: MotifLayer
  product: Product
}) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const { status, catalog } = useCatalog()
  const updateLayer = useDesignStore((state) => state.updateLayer)
  const removeLayer = useDesignStore((state) => state.removeLayer)
  const addLayer = useDesignStore((state) => state.addLayer)

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
            if (area === undefined) return

            addLayer(duplicateMotif(layer, areaBounds(area.clip)))
          }}
          className={BUTTON}
        >
          {t('customize.layer.duplicate')}
        </button>
        <button
          type="button"
          onClick={() => {
            set({
              // Back to the leaf as it arrived: the size a tap lays one at on
              // this area, upright and at full strength, in the pattern's own
              // dyes. Where the visitor put it stays — a leaf's place on the
              // cloth is the one thing they chose by hand, and a "reset" that
              // teleported it would be the opposite of putting it back.
              ...(area === undefined
                ? { scale: 1 }
                : { scale: motifPlacement(areaBounds(area.clip)).scale }),
              rotation: 0,
              opacity: 1,
              ...(pattern === undefined
                ? {}
                : { colors: [...pattern.defaultColors] }),
            })
          }}
          className={BUTTON}
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
