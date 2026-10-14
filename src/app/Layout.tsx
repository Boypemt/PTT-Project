/**
 * The frame every route renders inside: header, main landmark, footer.
 * Mounted as a layout route so the header stays put while the page changes.
 */
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Header } from './Header'

const MAIN_ID = 'main-content'

export function Layout() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href={`#${MAIN_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:m-2 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-ink-900"
      >
        {t('nav.skipToContent')}
      </a>
      <Header />
      <main id={MAIN_ID} className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
