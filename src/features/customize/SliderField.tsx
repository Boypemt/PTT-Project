/**
 * One labelled slider with its value written next to it.
 *
 * A native `input[type=range]` rather than anything custom: it already has the
 * keyboard (arrows, Home/End, Page Up/Down), the screen-reader semantics and
 * the drag behaviour a phone expects, and nothing here would improve on them.
 * The row is 44px tall so the thumb can be caught with a thumb.
 *
 * The value is shown because a slider on its own says "more" and "less" but
 * never "how much" — and a design someone wants to repeat needs numbers.
 */
export function SliderField({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  /** The value as the visitor reads it: `1.40×`, `45°`, `60%`. */
  display: string
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 text-sm text-ink-700">
        {label}
        <span className="font-medium text-ink-900 tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          onChange(event.target.valueAsNumber)
        }}
        className="min-h-touch w-full accent-forest-600"
      />
    </label>
  )
}
