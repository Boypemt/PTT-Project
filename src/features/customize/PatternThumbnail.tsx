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
 * replaces loses it by an edit to patterns.json. It is part of the button's
 * text rather than a tooltip, because a tooltip is nothing on a phone.
 */
import { useTranslation } from 'react-i18next'
import type { Pattern } from '@/catalog'
import { useLocalized } from '@/i18n/useLocalized'

export function PatternThumbnail({
  pattern,
  onPick,
}: {
  pattern: Pattern
  onPick: () => void
}) {
  const { t } = useTranslation()
  const localized = useLocalized()

  return (
    <li className="w-24 shrink-0 md:w-auto">
      <button
        type="button"
        onClick={onPick}
        className="flex w-full flex-col items-start gap-1 rounded-xl border border-border-soft bg-surface p-1.5 text-left transition-colors hover:border-forest-600 hover:bg-paper-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
      >
        <span
          style={{
            backgroundImage: `url("${pattern.thumbnail ?? pattern.src}")`,
          }}
          className="block aspect-square w-full rounded-lg border border-border-soft bg-paper-50 bg-[length:60%] bg-repeat"
        />
        <span className="text-xs leading-tight font-medium text-ink-900">
          {localized(pattern.name)}
        </span>
        {pattern.source.type === 'placeholder' ? (
          <span className="rounded-full bg-marigold-100 px-1.5 text-[0.625rem] font-semibold text-marigold-700">
            {t('common.placeholderLabel')}
          </span>
        ) : null}
      </button>
    </li>
  )
}
