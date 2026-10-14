/**
 * Which part of the product the next pattern lands on: the shawl's whole cloth
 * or its end band, the shirt's front or its sleeves.
 *
 * Only shown when there is a choice to make. A product with one usable area
 * needs no chips, and an area the editor cannot place anything on yet is not
 * offered at all (see `layerKinds.ts`) — so the handkerchief, whose corner
 * takes motifs only, shows none of this until task 09.
 *
 * The chips read the selection back from the store rather than keeping their
 * own, so picking a layer on the canvas — which moves the selection to that
 * layer's area — lights up the matching chip.
 */
import { useTranslation } from 'react-i18next'
import type { Product } from '@/catalog'
import { targetPrintArea, usablePrintAreas } from '@/editor/layerKinds'
import { useDesignStore } from '@/editor/useDesignStore'
import { useLocalized } from '@/i18n/useLocalized'

export function PrintAreaSelector({ product }: { product: Product }) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const selectedId = useDesignStore((state) => state.selectedPrintAreaId)
  const selectPrintArea = useDesignStore((state) => state.selectPrintArea)

  const areas = usablePrintAreas(product)
  const target = targetPrintArea(product, selectedId)

  if (areas.length < 2) return null

  return (
    <div>
      <p className="text-sm font-medium text-ink-700">
        {t('customize.printArea')}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {areas.map((area) => {
          const isTarget = area.id === target?.id

          return (
            <li key={area.id}>
              <button
                type="button"
                aria-pressed={isTarget}
                onClick={() => {
                  selectPrintArea(area.id)
                }}
                className={`flex min-h-touch items-center rounded-full border px-4 text-sm font-medium transition-colors ${
                  isTarget
                    ? 'border-forest-600 bg-forest-600 text-white'
                    : 'border-border-soft bg-surface text-ink-700 hover:bg-paper-100'
                }`}
              >
                {localized(area.name)}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
