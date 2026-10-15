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
 * sharing the screen with the canvas, so the search goes away and the grid
 * becomes a strip that scrolls sideways: the sheet stays short enough to see
 * what you are designing.
 *
 * The kind chips stay at every width, because they are what keeps tiles and
 * leaves apart. One strip holding both would be fourteen thumbnails to scroll
 * sideways through, and at that size a leaf silhouette and a tile swatch are
 * not tellable apart — while someone laying leaves wants the leaves and
 * nothing else. They cost one row of the sheet, and only appear where the
 * print area takes more than one kind.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useCatalog,
  type Pattern,
  type PatternKind,
  type PrintArea,
  type Product,
} from '@/catalog'
import { targetPrintArea, usableKinds } from '@/editor/layerKinds'
import { newMotifLayer } from '@/editor/motifPlacement'
import { filterPatterns } from '@/editor/patternFilter'
import { replaceableLayer } from '@/editor/selection'
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
  const selectLayer = useDesignStore((state) => state.selectLayer)
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
      : replaceableLayer(design, selectedLayerId, area.id)

  /**
   * Whether the next tap starts a layer rather than changing one. True once
   * "add layer" has let the selection go, and equally true after the selected
   * layer is deleted or one on another print area is picked — in each of
   * those the next tap really does add, so the same line says so.
   */
  const addsNext = selected === undefined && design.layers.length > 0

  /**
   * A leaf lands in the middle of the area at a quarter of its shorter side
   * (see `motifPlacement`); a tile covers the area and is moved by its own
   * offsets instead. Colours are copied either way, so the layer cannot write
   * back into the loaded catalog.
   */
  const add = (pattern: Pattern, printArea: PrintArea) => {
    addLayer(
      pattern.kind === 'motif'
        ? newMotifLayer(pattern, printArea)
        : {
            type: 'tile',
            patternId: pattern.id,
            printAreaId: printArea.id,
            scale: 1,
            rotation: 0,
            offsetX: 0,
            offsetY: 0,
            colors: [...pattern.defaultColors],
            opacity: 1,
          },
    )
  }

  /**
   * A tap changes the selected layer rather than stacking another one on top
   * of it — trying patterns is what this panel is for. How that layer is
   * scaled, turned and placed is the visitor's work and survives; the colours
   * belong to the pattern, so they come from the new one. A tap of the other
   * kind adds instead, because a tile and a leaf are not interchangeable.
   */
  const place = (pattern: Pattern, printArea: PrintArea) => {
    const replaceable = replaceableLayer(
      design,
      selectedLayerId,
      printArea.id,
      pattern.kind,
    )

    if (replaceable === undefined) {
      add(pattern, printArea)
      return
    }

    updateLayer(replaceable.id, {
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

          <PatternKindFilter
            kinds={area.allowedKinds}
            active={kind}
            onChange={setKind}
          />

          {/* The button only where a tap would change something rather than
              add it; otherwise the line saying the next tap starts a layer.
              Never both, because they are the two halves of one answer to
              "what happens if I tap a pattern now". */}
          {selected === undefined ? (
            addsNext ? (
              <p className="text-xs text-forest-700">
                {t('customize.layers.tapAdds')}
              </p>
            ) : null
          ) : (
            <div className="flex flex-col gap-1">
              <p className="hidden text-xs text-ink-500 md:block">
                {t('customize.layers.tapReplaces')}
              </p>
              <button
                type="button"
                onClick={() => {
                  // Nothing is added here. Letting the selection go is what
                  // makes the next tap add rather than change, and the line
                  // above takes this button's place until it does — a layer
                  // added now would be an invisible copy of the one it sits on.
                  selectLayer(null)
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
                    place(pattern, area)
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
