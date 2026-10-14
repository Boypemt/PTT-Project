/**
 * What buying one of these pieces is part of: the size of the group, the
 * forest it clears fuel from, and the share of revenue that goes back into it.
 *
 * The three numbers are copy, not catalog data — they describe the enterprise
 * rather than anything a visitor designs — so they live in the message files
 * with the rest of the text, value and label apart so the number can be set in
 * display type while its sentence reads normally.
 */
import { useTranslation } from 'react-i18next'

/** Each key names a `home.facts.*` value and label pair. */
const FACTS = ['households', 'forest', 'fund'] as const

export function CommunityFacts() {
  const { t } = useTranslation()

  return (
    <section className="bg-teak-700 text-paper-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-paper-50">
          {t('home.facts.title')}
        </h2>

        <ul className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {FACTS.map((fact) => (
            <li
              key={fact}
              className="border-l-2 border-marigold-500 pl-4 sm:border-l-0 sm:border-t-2 sm:pt-4 sm:pl-0"
            >
              <p className="font-display text-4xl font-bold text-marigold-300">
                {t(`home.facts.${fact}.value`)}
              </p>
              <p className="mt-1 text-pretty">
                {t(`home.facts.${fact}.label`)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
