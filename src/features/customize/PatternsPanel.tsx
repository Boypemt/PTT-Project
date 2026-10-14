/**
 * The left panel: the library a visitor picks patterns from.
 *
 * What it offers follows the selected print area, not the other way round:
 * the area decides which kinds of pattern are allowed, `SUPPORTED_LAYER_KINDS`
 * decides which of those the editor can place yet, and only then is the
 * catalog filtered. No pattern or product is named here — the panel would show
 * the designer's real patterns the day patterns.json changes.
 *
 * Two shapes, one DOM. From `md` up it is a column with a search box, kind
 * chips and a grid. Below `md` the panel is a sheet along the bottom edge
 * sharing the screen with the canvas, so the search and the chips go away and
 * the grid becomes a strip that scrolls sideways: the sheet stays short enough
 * to see what you are designing.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useCatalog,
  type Pattern,
  type PatternKind,
  type Product,
} from '@/catalog'
import { targetPrintArea, usableKinds } from '@/editor/layerKinds'
import { filterPatterns } from '@/editor/patternFilter'
import { useDesignStore } from '@/editor/useDesignStore'
import { useLocalized } from '@/i18n/useLocalized'
import { PatternKindFilter } from './PatternKindFilter'
import { PatternThumbnail } from './PatternThumbnail'
import { PrintAreaSelector } from './PrintAreaSelector'

export function PatternsPanel({ product }: { product: Product }) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const { status, catalog } = useCatalog()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<PatternKind | null>(null)
  const selectedPrintAreaId = useDesignStore(
    (state) => state.selectedPrintAreaId,
  )
  const addLayer = useDesignStore((state) => state.addLayer)

  const area = targetPrintArea(product, selectedPrintAreaId)
  const placeable = area === undefined ? [] : usableKinds(area)
  const kinds = kind === null ? placeable : placeable.filter((k) => k === kind)
  const patterns =
    status === 'ready'
      ? filterPatterns(catalog.patterns, { query, kinds }, (pattern) =>
          localized(pattern.name),
        )
      : []

  const place = (pattern: Pattern, printAreaId: string) => {
    addLayer({
      type: 'tile',
      patternId: pattern.id,
      printAreaId,
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      // Copied, so the layer cannot write back into the loaded catalog.
      colors: [...pattern.defaultColors],
      opacity: 1,
    })
  }

  return (
    <>
      <PrintAreaSelector product={product} />

      {area === undefined ? (
        <p className="text-sm text-ink-500">{t('customize.noPrintArea')}</p>
      ) : (
        <>
          <label className="hidden md:block">
            <span className="sr-only">{t('customize.searchPatterns')}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
              }}
              placeholder={t('customize.searchPatterns')}
              className="min-h-touch w-full rounded-xl border border-border-soft bg-surface px-3 text-sm text-ink-900 placeholder:text-ink-500"
            />
          </label>

          <div className="hidden md:block">
            <PatternKindFilter
              kinds={area.allowedKinds}
              active={kind}
              onChange={setKind}
            />
          </div>

          {patterns.length === 0 ? (
            <p className="text-sm text-ink-500">{t('customize.noPatterns')}</p>
          ) : (
            <ul className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-x-visible">
              {patterns.map((pattern) => (
                <PatternThumbnail
                  key={pattern.id}
                  pattern={pattern}
                  onPick={() => {
                    place(pattern, area.id)
                  }}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
