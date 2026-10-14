/**
 * What `/customize/some-typo` shows: a dead end that says what happened and
 * offers the one useful way on, the product list.
 *
 * Separate from the app's 404 because the route itself is fine — it is the
 * product in it that is not in the catalog, and a visitor following an old
 * shared link should land back at the products rather than the home page.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function ProductNotFound() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start gap-5 px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-teak-700">
        {t('customize.notFound.title')}
      </h1>
      <p className="text-lg text-ink-500">{t('customize.notFound.body')}</p>
      <Link
        to="/products"
        className="inline-flex min-h-touch items-center rounded-full bg-forest-600 px-6 font-medium text-paper-50 transition-colors hover:bg-forest-700"
      >
        {t('customize.notFound.back')}
      </Link>
    </section>
  )
}
