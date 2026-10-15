/**
 * What the site does when the catalog is wrong — the state the designer will
 * meet, on the Vercel preview, the first time they drop real patterns in.
 *
 * Two things have to hold. The message has to name the file and the entry, not
 * say that something went wrong: there is no console to open on a preview
 * link, so the page is the error report. And the landing page has to survive
 * it, because a half-finished patterns.json must not take the whole site down
 * while the demo is being shown.
 *
 * The broken file is served by route interception rather than committed, so
 * the real catalog stays the one the rest of the suite runs against.
 */
import { expect, test } from '@playwright/test'
import { CATALOG_VERSION } from './fixtures/catalog'
import { messages } from './fixtures/ui'

const th = messages.th

/** The entry the message has to point at. */
const BROKEN_ENTRY = 'eco-print-scatter'

/**
 * patterns.json as an edit in progress leaves it: valid JSON, the right
 * version, and one entry that has lost the fields saying what to draw.
 */
const BROKEN_PATTERNS = {
  catalogVersion: CATALOG_VERSION,
  items: [
    {
      id: BROKEN_ENTRY,
      name: { th: 'ลายใบไม้กระจาย', en: 'Eco-print leaf scatter' },
      kind: 'tile',
    },
  ],
}

test('a broken catalog names the file and the entry, and leaves the landing page standing', async ({
  page,
}) => {
  await page.route('**/catalog/patterns.json', async (route) => {
    await route.fulfill({ json: BROKEN_PATTERNS })
  })

  await page.goto('/products')

  await expect(
    page.getByRole('heading', { level: 1, name: th.catalog.errorTitle }),
  ).toBeVisible()
  await expect(page.getByText(th.catalog.errorIntro)).toBeVisible()

  // The whole `CatalogError` message, which is what names the file, the entry
  // and the path inside it. Located by its element because it is deliberately
  // raw text: there is no role for "the report you fix the JSON from".
  const report = page.locator('pre')
  await expect(report).toContainText('patterns.json')
  await expect(report).toContainText(BROKEN_ENTRY)

  await expect(
    page.getByRole('button', { name: th.catalog.retry, exact: true }),
  ).toBeVisible()

  // Outside the gate on purpose (see `AppRoutes`): the way out is still there.
  await page.getByRole('link', { name: th.brand.name, exact: true }).click()
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/)
  await expect(
    page.getByRole('heading', { level: 1, name: th.home.title }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: th.home.cta, exact: true }),
  ).toBeVisible()
})
