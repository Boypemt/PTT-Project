/**
 * Site footer: who the enterprise is, where they are, and a standing reminder
 * that what you are looking at is a prototype.
 *
 * `className` is how the layout hides it on a route that needs the whole
 * screen — the footer itself knows nothing about routes.
 */
import { useTranslation } from 'react-i18next'

export function Footer({ className = '' }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <footer
      className={`mt-auto border-t border-border-soft bg-paper-100 ${className}`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-sm text-ink-500">
        <p className="font-medium text-ink-700">{t('brand.enterprise')}</p>
        <address className="not-italic">{t('footer.address')}</address>
        <p>{t('footer.prototype')}</p>
      </div>
    </footer>
  )
}
