/**
 * An axe pass over the three pages the demo goes through, at both widths.
 *
 * Serious and critical findings fail the run; moderate and minor ones are
 * reported in the terminal and left to a person to judge. That split is
 * deliberate — a gate nobody can get through gets switched off, and the point
 * of this one is that the community's own site stays usable with a keyboard
 * and a screen reader.
 *
 * axe is not an accessibility audit. It cannot tell whether a label says
 * anything useful, which is why the journeys drive the editor by its
 * accessible names: between them, one checks the names are right and the other
 * that they are there at all.
 */
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { applyTile } from './fixtures/editor'
import { messages } from './fixtures/ui'

const th = messages.th

const PRODUCT = 'shawl-cotton'
const PATTERN = 'eco-print-scatter'

const PAGES = ['/', '/products', `/customize/${PRODUCT}`]

/** WCAG 2.1 A and AA: what a public prototype should already meet. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const BLOCKING = ['serious', 'critical']

for (const path of PAGES) {
  test(`no serious accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Most of the editor's controls — the sliders, the leaf dyes, the layer
    // rows — only exist once something is being designed, so scanning the
    // page as it opens would scan the half of it with nothing in it.
    if (path.startsWith('/customize/')) {
      await applyTile(page, th, 'th', PATTERN)
    }

    const { violations } = await new AxeBuilder({ page })
      .withTags(TAGS)
      .analyze()

    // Reported as the rule and the elements it fired on, because a failure
    // message that says "1 violation" sends the reader to the HTML report.
    const summarize = (impacts: string[]) =>
      violations
        .filter((violation) => impacts.includes(violation.impact ?? ''))
        .map((violation) => ({
          rule: violation.id,
          impact: violation.impact,
          help: violation.help,
          elements: violation.nodes.map((node) => node.target.join(' ')),
        }))

    const advisory = summarize(['moderate', 'minor'])
    if (advisory.length > 0) {
      console.log(`axe advisory on ${path}:`, JSON.stringify(advisory, null, 2))
    }

    expect(summarize(BLOCKING)).toEqual([])
  })
}
