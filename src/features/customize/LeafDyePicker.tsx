/**
 * The colours a layer can be printed in: the community's own leaf dyes, one
 * row per leaf.
 *
 * Nothing here is a colour picker in the usual sense. The palette is the
 * catalog's `leaf-dyes.json` — what these leaves actually give on cloth — so a
 * visitor chooses the dye rather than a colour, and the hexes become the real
 * ones by an edit to that file once the community colour-matches them against
 * fabric samples.
 *
 * A pattern drawn in two colours gets a second group for its second colour.
 * How many it uses is the pattern's own business (`defaultColors`), so a
 * one-colour tile shows one group and nothing has to be told which is which.
 */
import { useTranslation } from 'react-i18next'
import type { LeafDye, Pattern } from '@/catalog'
import { useLocalized } from '@/i18n/useLocalized'

function Swatch({
  hex,
  label,
  selected,
  onSelect,
}: {
  hex: string
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <li>
      <button
        type="button"
        aria-label={label}
        aria-pressed={selected}
        onClick={onSelect}
        style={{ backgroundColor: hex }}
        className={`size-touch rounded-full border border-border-soft transition-shadow ${
          selected
            ? 'ring-2 ring-forest-600 ring-offset-2'
            : 'hover:ring-2 hover:ring-border-soft hover:ring-offset-2'
        }`}
      />
    </li>
  )
}

/** One slot of the layer's colours, with every leaf dye offered for it. */
function ColorSlot({
  title,
  dyes,
  selected,
  onSelect,
}: {
  title: string
  dyes: readonly LeafDye[]
  /** The hex this slot holds now, if any. */
  selected: string | undefined
  onSelect: (hex: string) => void
}) {
  const localized = useLocalized()

  return (
    <div>
      <p className="text-xs text-ink-500">{title}</p>
      <ul className="mt-1 flex flex-col gap-1">
        {dyes.map((dye) => (
          <li key={dye.id} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate text-xs text-ink-700">
              {localized(dye.name)}
            </span>
            <ul className="flex flex-wrap gap-1">
              {dye.colors.map((color) => (
                <Swatch
                  key={color.id}
                  hex={color.hex}
                  // Named by both, because "deep purple" says nothing about
                  // which leaf it came out of — and that is the point here.
                  label={`${localized(dye.name)} — ${localized(color.name)}`}
                  selected={color.hex.toLowerCase() === selected?.toLowerCase()}
                  onSelect={() => {
                    onSelect(color.hex)
                  }}
                />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LeafDyePicker({
  dyes,
  pattern,
  colors,
  onChange,
}: {
  dyes: readonly LeafDye[]
  /** The pattern on the layer, which says how many colours it is drawn in. */
  pattern: Pattern | undefined
  /** The layer's colours now. */
  colors: readonly string[]
  onChange: (colors: string[]) => void
}) {
  const { t } = useTranslation()

  if (dyes.length === 0) return null

  const slots = Math.max(pattern?.defaultColors.length ?? 1, 1)

  /** The layer's colours with `hex` in one slot and the rest left alone. */
  const set = (index: number, hex: string) => {
    const next = [...colors]

    // A design can name fewer colours than the pattern uses; the gap takes the
    // pattern's own default, so nothing it draws goes missing.
    while (next.length <= index) {
      next.push(pattern?.defaultColors[next.length] ?? hex)
    }

    next[index] = hex
    onChange(next)
  }

  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-sm font-medium text-ink-900">
        {t('customize.leafDyes.title')}
      </h4>

      <ColorSlot
        title={t('customize.leafDyes.main')}
        dyes={dyes}
        selected={colors[0]}
        onSelect={(hex) => {
          set(0, hex)
        }}
      />

      {slots > 1 ? (
        <ColorSlot
          title={t('customize.leafDyes.second')}
          dyes={dyes}
          selected={colors[1]}
          onSelect={(hex) => {
            set(1, hex)
          }}
        />
      ) : null}
    </section>
  )
}
