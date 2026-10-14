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
import { replaceableTile } from '@/editor/selection'
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
  const updateLayer = useDesignStore((state) => state.updateLayer)
  const design = useDesignStore((state) => state.design)
  const selectedLayerId = useDesignStore((state) => state.selectedLayerId)

  const area = targetPrintArea(product, selectedPrintAreaId)
  const placeable = area === undefined ? [] : usableKinds(area)
  const kinds = kind === null ? placeable : placeable.filter((k) => k === kind)
  const all = status === 'ready' ? catalog.patterns : []
  const patterns = filterPatterns(all, { query, kinds }, (pattern) =>
    localized(pattern.name),
  )

  const selected =
    area === undefined
      ? undefined
      : replaceableTile(design, selectedLayerId, area.id)
  const selectedPattern = all.find((entry) => entry.id === selected?.patternId)

  const add = (pattern: Pattern, printAreaId: string) => {
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

  /**
   * A tap changes the selected tile rather than stacking another one on top of
   * it — trying patterns is what this panel is for. How that tile is scaled,
   * turned and shifted is the visitor's work and survives; the colours belong
   * to the pattern, so they come from the new one.
   */
  const place = (pattern: Pattern, printAreaId: string) => {
    if (selected === undefined) {
      add(pattern, printAreaId)
      return
    }

    updateLayer(selected.id, {
      patternId: pattern.id,
      colors: [...pattern.defaultColors],
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

          {/* Only where a tap would change something rather than add it: with
              nothing selected a tap already starts a layer, and a button
              saying so twice is in the way. */}
          {selected === undefined ? null : (
            <div className="flex flex-col gap-1">
              <p className="hidden text-xs text-ink-500 md:block">
                {t('customize.layers.tapReplaces')}
              </p>
              <button
                type="button"
                onClick={() => {
                  // Starts as what is already there, so the next tap on a
                  // pattern has a layer of its own to change. Looked up in the
                  // whole catalog, not the list on screen, which a search may
                  // have narrowed past it.
                  if (selectedPattern !== undefined) {
                    add(selectedPattern, area.id)
                  }
                }}
                className="min-h-touch self-start rounded-xl border border-dashed border-forest-600 px-3 text-sm font-medium text-forest-700 transition-colors hover:bg-forest-50"
              >
                {t('customize.layers.add')}
              </button>
            </div>
          )}

          {patterns.length === 0 ? (
            <p className="text-sm text-ink-500">{t('customize.noPatterns')}</p>
          ) : (
            <ul className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-x-visible">
              {patterns.map((pattern) => (
                <PatternThumbnail
                  key={pattern.id}
                  pattern={pattern}
                  current={pattern.id === selected?.patternId}
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
