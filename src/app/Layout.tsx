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

  // A phone-width customizer is exactly the screen and never scrolls: the
  // sheet takes its share from the bottom and the canvas keeps the rest, so
  // what the visitor is designing stays in front of them while they choose.
  // That needs a height rather than a minimum — `min-h-dvh` would let the
  // sheet grow the page instead of the canvas giving way. Every other page,
  // and this one from `md` up, is an ordinary scrolling page.
  const frame = inEditor
    ? 'h-dvh overflow-hidden md:h-auto md:min-h-dvh md:overflow-visible'
    : 'min-h-dvh'

  return (
    <div className={`flex flex-col ${frame}`}>
      <a
        href={`#${MAIN_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:m-2 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-ink-900"
      >
        {t('nav.skipToContent')}
      </a>
      <Header />
      {/* A column, so a page that wants the whole screen — the customizer —
          can stretch into it with `flex-1`. `min-h-0` lets such a page shrink
          its own insides to the screen instead of growing the page: without
          it a flex item never goes below its content, and the customizer's
          bottom sheet would push the canvas off the end. */}
      <main id={MAIN_ID} className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      <Footer className={inEditor ? 'hidden md:block' : ''} />
    </div>
  )
}
