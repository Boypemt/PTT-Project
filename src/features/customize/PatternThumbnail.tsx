/**
 * One pattern in the library: a swatch, its name, and whether it is standing
 * in for the designer's work.
 *
 * The swatch is the pattern's own file repeated as a background rather than a
 * single stretched copy, so what the visitor sees in the panel is what will
 * land on the cloth. `thumbnail` wins when the catalog gives one — a
 * photographed pattern will need one; a drawn SVG is small enough to be its
 * own swatch.
 *
 * The placeholder badge comes from `source.type`, so an entry the designer
 * replaces loses it by an edit to patterns.json. It is written on the button
 * rather than hung off a tooltip, because a tooltip is nothing on a phone.
 *
 * The button says its own name instead of letting one be assembled from the
 * text inside it: a name built from several elements picks up whatever spacing
 * the browser decides on between them, and this is a name that tests and
 * `npm run shot -- --click` have to be able to write down exactly.
 */
import { useTranslation } from 'react-i18next'
import type { Pattern } from '@/catalog'
import { useLocalized } from '@/i18n/useLocalized'

export function PatternThumbnail({
  pattern,
  current = false,
  onPick,
}: {
  pattern: Pattern
  /** Whether this is the pattern on the layer a tap would change. */
  current?: boolean
  onPick: () => void
}) {
  const { t } = useTranslation()
  const localized = useLocalized()

  const name = localized(pattern.name)
  const isPlaceholder = pattern.source.type === 'placeholder'

  return (
    <li className="w-24 shrink-0 md:w-auto">
      <button
        type="button"
        aria-label={
          isPlaceholder ? `${name} (${t('common.placeholderLabel')})` : name
        }
        // The pattern already on the selected layer, so the panel shows what a
        // tap would be changing away from.
        aria-pressed={current}
        onClick={onPick}
        className={`flex w-full flex-col items-start gap-1 rounded-xl border bg-surface p-1.5 text-left transition-colors hover:border-forest-600 hover:bg-paper-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 ${
          current
            ? 'border-forest-600 ring-2 ring-forest-600'
            : 'border-border-soft'
        }`}
      >
        <span
          style={{
            backgroundImage: `url("${pattern.thumbnail ?? pattern.src}")`,
          }}
          className="block aspect-square w-full rounded-lg border border-border-soft bg-paper-50 bg-[length:60%] bg-repeat"
        />
        {/* Already in the button's own label, so not read out twice. */}
        <span
          aria-hidden="true"
          className="text-xs leading-tight font-medium text-ink-900"
        >
          {name}
        </span>
        {isPlaceholder ? (
          <span
            aria-hidden="true"
            className="rounded-full bg-marigold-100 px-1.5 text-[0.625rem] font-semibold text-marigold-700"
          >
            {t('common.placeholderLabel')}
          </span>
        ) : null}
      </button>
    </li>
  )
}
