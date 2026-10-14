/**
 * The editor's working area: the canvas with a panel on either side.
 *
 * One arrangement serves both widths. From `md` up it is three columns —
 * patterns, canvas, properties. Below `md` it becomes a column: the canvas
 * stays at the top where the visitor can see what they are doing, and the two
 * panels drop to a sheet along the bottom edge where a switcher shows one at a
 * time. Each panel is in the DOM exactly once either way, as in `Header`, so
 * a screen reader never meets two copies of the same controls.
 *
 * The switcher is a pair of toggle buttons rather than ARIA tabs: above `md`
 * both panels are open at once, and a tablist that never hides anything would
 * describe the page wrongly. `aria-pressed` and `aria-controls` say what the
 * buttons actually do at the width where they are visible.
 *
 * The canvas itself arrives as `children`, so this file stays free of Konva
 * and of any one product.
 */
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Product } from '@/catalog'
import { PatternsPanel } from './PatternsPanel'
import { PropertiesPanel } from './PropertiesPanel'

const PANELS = ['patterns', 'properties'] as const

type PanelId = (typeof PANELS)[number]

const panelId = (panel: PanelId) => `editor-panel-${panel}`

function Panel({
  panel,
  title,
  open,
  className,
  children,
}: {
  panel: PanelId
  title: string
  /** Whether the bottom sheet is showing this panel. Ignored from `md` up. */
  open: boolean
  className: string
  children: ReactNode
}) {
  return (
    <section
      id={panelId(panel)}
      aria-labelledby={`${panelId(panel)}-title`}
      className={`${open ? 'flex' : 'hidden'} max-h-[45vh] flex-col gap-3 overflow-y-auto bg-surface px-4 pt-3 pb-6 md:flex md:max-h-none md:rounded-2xl md:border md:border-border-soft md:p-4 ${className}`}
    >
      {/* In the sheet the switcher above already says which panel this is, so
          the heading only shows from `md` up — but it stays in the accessibility
          tree at every width, because it is what names this region. */}
      <h2
        id={`${panelId(panel)}-title`}
        className="sr-only font-display font-semibold text-ink-900 md:not-sr-only"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export function EditorWorkspace({
  product,
  children,
}: {
  product: Product
  children: ReactNode
}) {
  const { t } = useTranslation()
  const [openPanel, setOpenPanel] = useState<PanelId>('patterns')

  const titles: Record<PanelId, string> = {
    patterns: t('customize.patterns'),
    properties: t('customize.properties'),
  }

  return (
    <div className="flex flex-1 flex-col gap-0 md:flex-row md:items-start md:gap-4 md:px-4 md:pb-6">
      {/* `mb-auto` keeps the sheet on the bottom edge when the canvas does
          not fill the screen. */}
      <div className="order-1 flex min-h-[55vh] items-center justify-center bg-paper-100 p-4 max-md:mb-auto md:order-2 md:min-h-[70vh] md:flex-1 md:rounded-2xl">
        {children}
      </div>

      <div
        role="group"
        aria-label={t('customize.panelSwitcher')}
        className="order-2 flex gap-1 rounded-t-2xl border-t border-border-soft bg-surface px-2 pt-2 shadow-[0_-10px_24px_-12px_rgba(36,31,24,0.45)] md:hidden"
      >
        {PANELS.map((panel) => (
          <button
            key={panel}
            type="button"
            aria-pressed={openPanel === panel}
            aria-controls={panelId(panel)}
            onClick={() => {
              setOpenPanel(panel)
            }}
            className={`min-h-touch flex-1 rounded-xl px-3 font-medium transition-colors ${
              openPanel === panel
                ? 'bg-forest-50 text-forest-700'
                : 'text-ink-500 hover:bg-paper-100'
            }`}
          >
            {titles[panel]}
          </button>
        ))}
      </div>

      <Panel
        panel="patterns"
        title={titles.patterns}
        open={openPanel === 'patterns'}
        className="order-3 md:order-1 md:w-60 lg:w-64"
      >
        <PatternsPanel />
      </Panel>

      <Panel
        panel="properties"
        title={titles.properties}
        open={openPanel === 'properties'}
        className="order-4 md:order-3 md:w-64 lg:w-72"
      >
        <PropertiesPanel product={product} />
      </Panel>
    </div>
  )
}
