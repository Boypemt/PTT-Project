/**
 * The three steps of the customizer, so a visitor knows what the button on the
 * hero leads to before pressing it.
 *
 * The icons are drawn here as inline SVG rather than fetched or imported: they
 * are three small line drawings, they inherit the text colour, and CLAUDE.md
 * prefers SVG drawn in code over a downloaded asset. They are decorative —
 * each step says in words what it is — so they are hidden from screen readers.
 */
import type { ComponentType, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/** One leaf, drawn around its own centre so a step can place several. */
const LEAF = 'M0-4.2c2.3 1.6 2.9 4.6 0 7.3-2.9-2.7-2.3-5.7 0-7.3Z'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-9 text-forest-600"
    >
      {children}
    </svg>
  )
}

/** Choose a product: a shirt, standing for the whole catalogue. */
function ProductIcon() {
  return (
    <Icon>
      <path d="M12.5 6 7 8.5 4.5 14l3.5 1.9L9.6 14v11.5h12.8V14l1.6 1.9L27.5 14 25 8.5 19.5 6a3.6 3.6 0 0 1-7 0Z" />
    </Icon>
  )
}

/** Choose a pattern: leaves repeating across a square of cloth. */
function PatternIcon() {
  return (
    <Icon>
      <rect x="4.5" y="4.5" width="23" height="23" rx="3.5" />
      {[
        { x: 11, y: 11, angle: -20 },
        { x: 21, y: 11, angle: 25 },
        { x: 11, y: 21, angle: 30 },
        { x: 21, y: 21, angle: -15 },
      ].map(({ x, y, angle }) => (
        <g
          key={`${String(x)}-${String(y)}`}
          transform={`translate(${String(x)} ${String(y)}) rotate(${String(angle)})`}
        >
          <path d={LEAF} />
          <path d="M0 3V-3.6" />
        </g>
      ))}
    </Icon>
  )
}

/** Adjust the colours: a leaf, and the dyes it gives. */
function ColorIcon() {
  return (
    <Icon>
      <g transform="translate(16 12) scale(1.9)">
        <path d={LEAF} />
        <path d="M0 3V-3.6" />
      </g>
      <circle cx="8" cy="26" r="3" fill="currentColor" stroke="none" />
      <circle
        cx="16"
        cy="26"
        r="3"
        fill="currentColor"
        fillOpacity="0.45"
        stroke="none"
      />
      <circle cx="24" cy="26" r="3" />
    </Icon>
  )
}

/**
 * The steps in order. Each key names a `home.how.steps.*` message pair, and
 * `as const` keeps them literal so a key missing from th.json is a typecheck
 * failure rather than a step titled "home.how.steps.colour.title" on screen.
 */
const STEPS = [
  { key: 'product', Icon: ProductIcon },
  { key: 'pattern', Icon: PatternIcon },
  { key: 'colors', Icon: ColorIcon },
] as const satisfies readonly { key: string; Icon: ComponentType }[]

export function HowItWorks() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12">
      <h2 className="font-display text-2xl font-bold text-teak-700">
        {t('home.how.title')}
      </h2>

      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
        {STEPS.map(({ key, Icon: StepIcon }, index) => (
          <li
            key={key}
            className="flex flex-col gap-3 rounded-2xl border border-border-soft bg-surface p-5"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-full bg-marigold-100 text-sm font-semibold text-marigold-700"
              >
                {index + 1}
              </span>
              <StepIcon />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink-900">
              {t(`home.how.steps.${key}.title`)}
            </h3>
            <p className="text-ink-500">{t(`home.how.steps.${key}.body`)}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
