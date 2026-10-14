/**
 * Filter chips for the product lines, with the choice kept in the URL query
 * (`?line=fabric`) so a filtered view can be shared or bookmarked. "All" is
 * the default and drops the parameter rather than writing `?line=all`.
 */
import { useTranslation } from 'react-i18next'
import type { ProductLine } from '@/catalog'
import { PRODUCT_LINES } from '@/lib/products'

/** Spelled out rather than built from the id, so `t()` stays type-checked. */
const LINE_LABELS = {
  fabric: 'products.lines.fabric',
  leaf: 'products.lines.leaf',
  gift: 'products.lines.gift',
  drinkware: 'products.lines.drinkware',
} as const

export function LineFilter({
  active,
  onChange,
}: {
  active: ProductLine | null
  onChange: (line: ProductLine | null) => void
}) {
  const { t } = useTranslation()

  const chip = (line: ProductLine | null, label: string) => {
    const isActive = line === active

    return (
      <li key={line ?? 'all'}>
        <button
          type="button"
          aria-pressed={isActive}
          onClick={() => {
            onChange(line)
          }}
          className={`flex min-h-touch items-center rounded-full border px-4 font-medium transition-colors ${
            isActive
              ? 'border-forest-600 bg-forest-600 text-white'
              : 'border-border-soft bg-surface text-ink-700 hover:bg-paper-100'
          }`}
        >
          {label}
        </button>
      </li>
    )
  }

  return (
    <nav aria-label={t('products.filterLabel')}>
      <ul className="flex flex-wrap gap-2">
        {chip(null, t('products.lines.all'))}
        {PRODUCT_LINES.map((line) => chip(line, t(LINE_LABELS[line])))}
      </ul>
    </nav>
  )
}
