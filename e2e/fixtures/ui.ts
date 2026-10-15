/**
 * The words on screen, read from the app's own message catalogs.
 *
 * A journey that hard-coded "ออกแบบของคุณเอง" would fail the day that button
 * is reworded — a copy edit, not a regression — and would never notice a key
 * missing from `en.json`. Importing th.json and en.json means the specs break
 * only when a key disappears, which is a real break.
 */
import en from '../../src/i18n/en.json' with { type: 'json' }
import th from '../../src/i18n/th.json' with { type: 'json' }

export const messages = { th, en }

export type Lang = keyof typeof messages

/** The message catalog of one language: what a spec reads its labels from. */
export type Messages = (typeof messages)[Lang]

/**
 * Fills i18next's `{{placeholders}}`, so a spec can name the control whose
 * label the app assembles — "Select {{name}}", "Base colour {{color}}".
 */
export function interpolate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (whole, key: string) =>
    key in values ? values[key] : whole,
  )
}
