/**
 * Chips narrowing the library to one kind of pattern.
 *
 * Shown only where the print area takes more than one kind, and only with the
 * kinds that area allows — the shirt's sleeves take tiles alone, so there is
 * nothing to choose there.
 *
 * A kind the editor cannot place yet is listed but disabled, with "coming
 * soon" written in the chip rather than hidden in a tooltip a phone never
 * shows. That is the whole announcement that leaf motifs are on their way:
 * task 09 adds `'motif'` to `SUPPORTED_LAYER_KINDS` and the chip comes alive.
 */
import { useTranslation } from 'react-i18next'
import type { PatternKind } from '@/catalog'
import { isSupportedKind } from '@/editor/layerKinds'

/** Spelled out rather than built from the kind, so `t()` stays type-checked. */
const KIND_LABELS = {
  tile: 'customize.kinds.tile',
  motif: 'customize.kinds.motif',
} as const

export function PatternKindFilter({
  kinds,
  active,
  onChange,
}: {
  /** Every kind the print area allows, placeable or not. */
  kinds: readonly PatternKind[]
  /** The kind on its own, or null for all of them. */
  active: PatternKind | null
  onChange: (kind: PatternKind | null) => void
}) {
  const { t } = useTranslation()

  if (kinds.length < 2) return null

  return (
    <nav aria-label={t('customize.kindFilter')}>
      <ul className="flex flex-wrap gap-2">
        {kinds.map((kind) => {
          const placeable = isSupportedKind(kind)
          const isActive = active === kind

          return (
            <li key={kind}>
              <button
                type="button"
                disabled={!placeable}
                aria-pressed={placeable ? isActive : undefined}
                onClick={() => {
                  // Pressing the active chip clears the filter again.
                  onChange(isActive ? null : kind)
                }}
                className={`flex min-h-touch items-center rounded-full border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:border-dashed disabled:bg-paper-100 disabled:text-ink-500 ${
                  isActive
                    ? 'border-forest-600 bg-forest-600 text-white'
                    : 'border-border-soft bg-surface text-ink-700 hover:bg-paper-100'
                }`}
              >
                {t(KIND_LABELS[kind])}
                {placeable ? null : (
                  <span className="ml-1 text-xs font-normal">
                    · {t('customize.comingSoon')}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
