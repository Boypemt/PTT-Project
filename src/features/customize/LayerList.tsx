/**
 * Every layer on the product, and the three things you can do to one without
 * opening it: pick it, move it through the stack, throw it away.
 *
 * Listed topmost first, which is the opposite of the order they are stored
 * in — `design.layers` is draw order, so its last entry is the one nearest the
 * viewer, and a list that put that at the bottom would disagree with the
 * picture. "Up" therefore means towards the top of this list and towards the
 * viewer, and the row already at the top cannot go up.
 *
 * A layer is named by its pattern. Two layers of the same pattern read alike,
 * which is honest: what tells them apart is where they print, and that is on
 * the second line.
 */
import { useTranslation } from 'react-i18next'
import { useCatalog, type Layer, type Product } from '@/catalog'
import { useDesignStore } from '@/editor/useDesignStore'
import { useLocalized } from '@/i18n/useLocalized'

const CONTROL =
  'flex size-touch shrink-0 items-center justify-center rounded-lg border border-border-soft text-ink-700 transition-colors hover:bg-paper-100 disabled:border-transparent disabled:text-ink-500/40'

export function LayerList({ product }: { product: Product }) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const { status, catalog } = useCatalog()
  const layers = useDesignStore((state) => state.design.layers)
  const selectedLayerId = useDesignStore((state) => state.selectedLayerId)
  const selectLayer = useDesignStore((state) => state.selectLayer)
  const reorderLayer = useDesignStore((state) => state.reorderLayer)
  const removeLayer = useDesignStore((state) => state.removeLayer)

  const patterns = status === 'ready' ? catalog.patterns : []

  const nameOf = (layer: Layer) => {
    const pattern = patterns.find((entry) => entry.id === layer.patternId)

    // A design can outlive a pattern being renamed; the id still says which.
    return pattern === undefined ? layer.patternId : localized(pattern.name)
  }

  const areaOf = (layer: Layer) => {
    const area = product.printAreas.find(
      (entry) => entry.id === layer.printAreaId,
    )

    return area === undefined ? layer.printAreaId : localized(area.name)
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-medium text-ink-900">
        {t('customize.layers.title')}
      </h3>

      {layers.length === 0 ? (
        <p className="text-sm text-ink-500">{t('customize.layers.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {layers
            .map((layer, index) => ({ layer, index }))
            .reverse()
            .map(({ layer, index }) => {
              const isSelected = layer.id === selectedLayerId
              const name = nameOf(layer)

              return (
                <li
                  key={layer.id}
                  className={`flex items-center gap-1 rounded-xl border px-1 ${
                    isSelected
                      ? 'border-forest-600 bg-forest-50'
                      : 'border-border-soft'
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      selectLayer(layer.id)
                    }}
                    className="min-h-touch min-w-0 flex-1 px-2 py-1 text-left"
                  >
                    <span className="block truncate text-sm font-medium text-ink-900">
                      {name}
                    </span>
                    <span className="block truncate text-xs text-ink-500">
                      {areaOf(layer)}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label={t('customize.layers.moveUp', { name })}
                    disabled={index === layers.length - 1}
                    onClick={() => {
                      reorderLayer(layer.id, 'up')
                    }}
                    className={CONTROL}
                  >
                    <span aria-hidden="true">↑</span>
                  </button>
                  <button
                    type="button"
                    aria-label={t('customize.layers.moveDown', { name })}
                    disabled={index === 0}
                    onClick={() => {
                      reorderLayer(layer.id, 'down')
                    }}
                    className={CONTROL}
                  >
                    <span aria-hidden="true">↓</span>
                  </button>
                  <button
                    type="button"
                    aria-label={t('customize.layers.delete', { name })}
                    onClick={() => {
                      removeLayer(layer.id)
                    }}
                    className={`${CONTROL} hover:bg-teak-100 hover:text-teak-700`}
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </li>
              )
            })}
        </ul>
      )}
    </section>
  )
}
