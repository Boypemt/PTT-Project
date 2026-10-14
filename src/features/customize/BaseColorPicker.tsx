/**
 * The cloth a pattern is printed on: one swatch per colour the product lists.
 *
 * The colours come from `product.baseColors`, so a product that offers a new
 * undyed cloth gets it by an edit to products.json. Each swatch is a 44px
 * touch target and carries its hex in the label, because a colour alone says
 * nothing to a screen reader — once the community colour-matches the dyes
 * these can take the leaf-dye names from the catalog instead (task 10).
 */
import { useTranslation } from 'react-i18next'

export function BaseColorPicker({
  colors,
  selected,
  onSelect,
}: {
  colors: readonly string[]
  selected: string
  onSelect: (color: string) => void
}) {
  const { t } = useTranslation()

  return (
    <div>
      <p className="text-sm font-medium text-ink-700">
        {t('customize.baseColor')}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {colors.map((color) => (
          <li key={color}>
            <button
              type="button"
              aria-label={t('customize.baseColorOption', { color })}
              aria-pressed={color === selected}
              onClick={() => {
                onSelect(color)
              }}
              style={{ backgroundColor: color }}
              className={`size-touch rounded-full border border-border-soft transition-shadow ${
                color === selected
                  ? 'ring-2 ring-forest-600 ring-offset-2'
                  : 'hover:ring-2 hover:ring-border-soft hover:ring-offset-2'
              }`}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
