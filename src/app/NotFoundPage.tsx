/**
 * Catch-all route. Lives in `app/` rather than `features/` because it belongs
 * to the routing table, not to any one feature.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start gap-5 px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-teak-700">
        {t('notFound.title')}
      </h1>
      <p className="text-lg text-ink-500">{t('notFound.body')}</p>
      <Link
        to="/"
        className="inline-flex min-h-touch items-center rounded-full bg-forest-600 px-6 font-medium text-paper-50 transition-colors hover:bg-forest-700"
      >
        {t('notFound.backHome')}
      </Link>
    </section>
  )
}
