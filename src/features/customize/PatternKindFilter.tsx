/**
 * Chips narrowing the library to one kind of pattern.
 *
 * Shown only where the print area takes more than one kind, and only with the
 * kinds that area allows — the shirt's sleeves take tiles alone, so there is
 * nothing to choose there.
 */
import { useTranslation } from 'react-i18next'
import type { PatternKind } from '@/catalog'

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
  /** Every kind the print area allows. */
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
          const isActive = active === kind

          return (
            <li key={kind}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  // Pressing the active chip clears the filter again.
                  onChange(isActive ? null : kind)
                }}
                className={`flex min-h-touch items-center rounded-full border px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-forest-600 bg-forest-600 text-white'
                    : 'border-border-soft bg-surface text-ink-700 hover:bg-paper-100'
                }`}
              >
                {t(KIND_LABELS[kind])}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
