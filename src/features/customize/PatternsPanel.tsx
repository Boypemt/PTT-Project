/**
 * The left panel: the library a visitor picks patterns from.
 *
 * What it offers follows the selected print area, not the other way round: the
 * area decides which kinds of pattern are allowed, the product decides which
 * patterns may print on it at all, and only then is the catalog filtered. No
 * pattern or product is named here — the panel shows the designer's real
 * patterns the day patterns.json changes.
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
 * nothing else. They cost one row of the sheet, and on a phone that row buys
 * back several swipes.
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
import { newMotifLayer } from '@/editor/motifPlacement'
import { filterPatterns } from '@/editor/patternFilter'
import { targetPrintArea } from '@/editor/printAreas'
import { leafPatterns, scatterMotifs, scatterSeed } from '@/editor/scatter'
import { replaceableLayer } from '@/editor/selection'
import { useDesignStore } from '@/editor/useDesignStore'
import { useLocalized } from '@/i18n/useLocalized'
import { PatternKindFilter } from './PatternKindFilter'
import { PatternThumbnail } from './PatternThumbnail'
import { PrintAreaSelector } from './PrintAreaSelector'

/**
 * Three leaves thrown across the cloth: the scatter button's whole meaning,
 * in the space a word would take. Drawn here rather than loaded, so it tints
 * with the button's own colour and costs no request.
 */
function ScatterIcon() {
  /** One leaf, a lens about its own centre, so a transform can place it. */
  const leaf = 'M0 -4.2 C 2.6 -1.6 2.6 1.6 0 4.2 C -2.6 1.6 -2.6 -1.6 0 -4.2 Z'

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4 shrink-0"
    >
      <path d={leaf} transform="translate(6 15.5) rotate(-28)" />
      <path d={leaf} transform="translate(12.5 7.5) rotate(16)" />
      <path d={leaf} transform="translate(18 16) rotate(-6)" />
    </svg>
  )
}

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
  const addLayers = useDesignStore((state) => state.addLayers)
  const updateLayer = useDesignStore((state) => state.updateLayer)
  const selectLayer = useDesignStore((state) => state.selectLayer)
  const design = useDesignStore((state) => state.design)
  const selectedLayerId = useDesignStore((state) => state.selectedLayerId)

  const area = targetPrintArea(product, selectedPrintAreaId)
  const allowed = area?.allowedKinds ?? []
  const kinds = kind === null ? allowed : allowed.filter((k) => k === kind)
  const all = status === 'ready' ? catalog.patterns : []
  const patterns = filterPatterns(all, { query, kinds, product }, (pattern) =>
    localized(pattern.name),
  )

  const selected =
    area === undefined
      ? undefined
      : replaceableLayer(design, selectedLayerId, area.id)

  const canScatter =
    area !== undefined &&
    area.allowedKinds.includes('motif') &&
    leafPatterns(all).length > 0

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

          {/* One row on a phone, which is what keeps the pattern names above
              the fold: the kinds on the left, the scatter on the right.
              Either can be missing — an area that takes one kind has no
              toggle, an area that takes no leaves has no scatter — and with a
              single child `justify-between` leaves it where it started, on
              the left, rather than stranding it against the far edge.
              Stacked again from `md` up, where the panel is a column too
              narrow to hold both side by side. */}
          <div className="flex items-center justify-between gap-2 md:flex-col md:items-start md:gap-3">
            {/* Nothing at all where the area takes one kind, at either width:
                the component itself says so, rather than a row of one chip. */}
            <PatternKindFilter
              kinds={area.allowedKinds}
              active={kind}
              onChange={setKind}
            />

            {/* Above the library rather than in it: it is not a pattern you
                pick, it is the whole cloth in one tap. Only where leaves can
                be placed at all, and only where the catalog has leaves to
                throw. The leaves on it are what make it legible at this size,
                where the words alone are another chip in a row of chips. */}
            {canScatter ? (
              <button
                type="button"
                onClick={() => {
                  // Seeded from the clock, so each tap throws a different
                  // handful and any one of them could be reproduced.
                  addLayers(scatterMotifs(all, area, scatterSeed()))
                }}
                className="flex min-h-touch shrink-0 items-center gap-1.5 rounded-xl border border-forest-600 bg-forest-50 px-2.5 text-sm font-medium text-forest-700 transition-colors hover:bg-forest-100"
              >
                <ScatterIcon />
                {t('customize.layers.scatter')}
              </button>
            ) : null}
          </div>

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
