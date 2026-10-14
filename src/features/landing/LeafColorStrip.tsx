/**
 * The community's colour vocabulary: one chip per leaf, in the colours that
 * leaf gives on cloth.
 *
 * Straight out of `leaf-dyes.json` — nothing here names a leaf or a hex, so the
 * strip grows a chip when the community adds a dye and shifts colour when they
 * match the hexes against real fabric. Nothing is clickable: choosing a dye
 * belongs in the editor, and this is the shop window.
 */
import { useTranslation } from 'react-i18next'
import type { LeafDye } from '@/catalog'
import { useLocalized } from '@/i18n/useLocalized'

export function LeafColorStrip({ dyes }: { dyes: readonly LeafDye[] }) {
  const { t } = useTranslation()
  const localized = useLocalized()

  // Nothing to show until the catalog is there, which on this page it may not
  // be — see LandingPage.
  if (dyes.length === 0) return null

  return (
    <section className="border-y border-border-soft bg-forest-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-teak-700">
          {t('home.leaves.title')}
        </h2>
        <p className="mt-2 max-w-2xl text-ink-700">{t('home.leaves.intro')}</p>

        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {dyes.map((dye) => (
            <li key={dye.id} className="flex flex-col gap-2">
              {/* The leaf's colours as one bar, split into equal bands: what
                  this leaf gives, read as a set rather than as swatches. */}
              <ul className="flex h-20 overflow-hidden rounded-xl border border-border-soft shadow-sm">
                {dye.colors.map((color) => (
                  <li
                    key={color.id}
                    style={{ backgroundColor: color.hex }}
                    className="flex-1"
                  >
                    <span className="sr-only">{localized(color.name)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm font-medium text-ink-900">
                {localized(dye.name)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
