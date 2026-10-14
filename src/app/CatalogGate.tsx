/**
 * A layout route for the pages that cannot render without catalog data.
 *
 * The error branch prints the whole `CatalogError` message. That is on
 * purpose: it names the file, the entry id and the path inside it, which is
 * exactly what the designer dropping real patterns into public/catalog/ needs
 * to see — including on the Vercel preview, where there is no console to open.
 */
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'
import { useCatalog } from '@/catalog'

export function CatalogGate() {
  const { t } = useTranslation()
  const { status, error, reload } = useCatalog()

  if (status === 'loading') {
    return (
      <p
        role="status"
        className="mx-auto max-w-3xl px-4 py-12 text-lg text-ink-500"
      >
        {t('catalog.loading')}
      </p>
    )
  }

  if (status === 'error') {
    return (
      <section className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-4 py-12">
        <h1 className="font-display text-2xl font-bold text-teak-700">
          {t('catalog.errorTitle')}
        </h1>
        <p className="text-ink-500">{t('catalog.errorIntro')}</p>
        <pre className="w-full overflow-auto rounded-xl border border-teak-300 bg-teak-100 p-4 text-sm whitespace-pre-wrap text-teak-900">
          {error.message}
        </pre>
        <button
          type="button"
          onClick={reload}
          className="inline-flex min-h-touch items-center rounded-full bg-forest-600 px-6 font-medium text-paper-50 transition-colors hover:bg-forest-700"
        >
          {t('catalog.retry')}
        </button>
      </section>
    )
  }

  return <Outlet />
}
