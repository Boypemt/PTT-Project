/**
 * The frame every route renders inside: header, main landmark, footer.
 * Mounted as a layout route so the header stays put while the page changes.
 */
import { useTranslation } from 'react-i18next'
import { Outlet, useMatch } from 'react-router-dom'
import { useSyncLanguage } from '@/i18n/useSyncLanguage'
import { Footer } from './Footer'
import { Header } from './Header'

const MAIN_ID = 'main-content'

export function Layout() {
  const { t } = useTranslation()

  // On a phone the customizer is an app-like screen: the panel sheet sits on
  // the bottom edge, and a footer under it would both break that and push the
  // sheet off the end of the page. There is room for it from `md` up.
  const inEditor = useMatch('/customize/:productId') !== null

  useSyncLanguage()

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href={`#${MAIN_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:m-2 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-ink-900"
      >
        {t('nav.skipToContent')}
      </a>
      <Header />
      {/* A column, so a page that wants the whole screen — the customizer —
          can stretch into it with `flex-1`. */}
      <main id={MAIN_ID} className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer className={inEditor ? 'hidden md:block' : ''} />
    </div>
  )
}
