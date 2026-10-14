/**
 * Site header: wordmark, primary nav and (from the next commit) the language
 * toggle. Below `md` the nav collapses behind a hamburger; the same single
 * `<nav>` is shown or hidden, so there is never a duplicate set of links in
 * the DOM for screen readers to read twice.
 */
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'

const NAV_ID = 'primary-nav'

function NavItem({
  to,
  end = false,
  onClick,
  children,
}: {
  to: string
  end?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex min-h-touch items-center rounded-lg px-3 font-medium transition-colors ${
          isActive
            ? 'bg-forest-50 text-forest-700'
            : 'text-ink-500 hover:bg-paper-100 hover:text-ink-900'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="size-6"
    >
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  )
}

export function Header() {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Following a link should put the collapsed menu away again.
  const closeMenu = () => {
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border-soft bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
        <Link
          to="/"
          onClick={closeMenu}
          className="order-1 mr-auto flex min-h-touch items-center font-display text-lg font-bold text-teak-700 md:mr-6"
        >
          {t('brand.name')}
        </Link>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls={NAV_ID}
          onClick={() => {
            setMenuOpen((open) => !open)
          }}
          className="order-2 flex size-touch items-center justify-center rounded-lg text-ink-700 hover:bg-paper-100 md:order-3 md:hidden"
        >
          <MenuIcon open={menuOpen} />
          <span className="sr-only">
            {menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          </span>
        </button>

        <nav
          id={NAV_ID}
          aria-label={t('nav.label')}
          className={`order-3 w-full flex-col gap-1 pb-2 md:order-2 md:mr-auto md:flex md:w-auto md:flex-row md:items-center md:pb-0 ${
            menuOpen ? 'flex' : 'hidden'
          }`}
        >
          <NavItem to="/" end onClick={closeMenu}>
            {t('nav.home')}
          </NavItem>
          <NavItem to="/products" onClick={closeMenu}>
            {t('nav.products')}
          </NavItem>
        </nav>
      </div>
    </header>
  )
}
