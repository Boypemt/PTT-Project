/**
 * Screenshots one page of the built site, so whoever changed the UI — me
 * included — can look at it instead of guessing.
 *
 *   npm run build
 *   npm run shot -- /customize/shawl-cotton
 *   npm run shot -- /customize/shawl-cotton --mobile
 *   npm run shot -- /customize/shawl-cotton --click "ลายใบไม้กระจาย" --as shawl-scatter
 *   npm run shot -- /customize/shawl-cotton --click "ลายจุด" --set "ความเข้มของลาย=0.6"
 *
 * On Git Bash for Windows, drop the leading slash — `npm run shot --
 * customize/shawl-cotton` — because that shell rewrites an argument starting
 * with `/` into a Windows path before node ever sees it.
 *
 * It serves `dist/` with `vite preview` on a free port, opens the path, waits
 * for the network to go quiet (the catalog JSON is fetched by the page) and
 * for the webfonts, runs any `--click` and `--set` steps in the order given,
 * writes
 * `screenshots/<slug>-<desktop|mobile>.png`, then shuts the server down. It
 * never builds: a stale `dist/` would be a screenshot of the wrong code, so a
 * missing one is an error instead.
 *
 * `--click` takes the button's accessible name, matched exactly — the Thai
 * pattern names all start with "ลาย", so a substring match would hit a
 * thumbnail when the sheet's "ลาย" tab was meant. A page nobody has clicked is
 * a page half the editor cannot be seen on, which is what this is for: the
 * library puts the pattern on the cloth, and `--as` keeps each interaction in
 * a file of its own instead of overwriting the plain shot of the same path.
 *
 * Playwright tests and CI belong to task 14 — this is only the camera.
 */
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'node:net'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium, devices, type Page } from '@playwright/test'
import { preview } from 'vite'

/** Wide enough for the editor's three columns. */
const DESKTOP_VIEWPORT = { width: 1280, height: 800 }

/** A current mid-size Android, from Playwright's own device registry. */
const MOBILE_DEVICE = 'Pixel 7'

const OUT_DIR = 'screenshots'

const root = fileURLToPath(new URL('..', import.meta.url))

/** One thing to do to the page before the shutter. */
export type Step =
  | { kind: 'click'; name: string }
  | { kind: 'set'; label: string; value: string }

type Options = {
  pagePath: string
  mobile: boolean
  /** What to do before the shot, in the order it was asked for. */
  steps: Step[]
  /** Overrides the file name the path would give. */
  as?: string
}

const USAGE =
  'usage: npm run shot -- <path> [--mobile] [--click "<button name>"]… [--set "<label>=<value>"]… [--as <name>]'

/** Flags that take the next argument as their value. */
const VALUE_FLAGS = ['--click', '--set', '--as']

export function parseArgs(argv: string[]): Options {
  const paths: string[] = []
  const steps: Step[] = []
  let mobile = false
  let as: string | undefined

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === '--mobile') {
      mobile = true
      continue
    }

    if (VALUE_FLAGS.includes(arg)) {
      const value = argv[i + 1]
      // A missing value would otherwise swallow the next flag, or the path.
      if (value === undefined || value.startsWith('--')) throw new Error(USAGE)

      if (arg === '--click') {
        steps.push({ kind: 'click', name: value })
      } else if (arg === '--set') {
        const at = value.indexOf('=')
        if (at < 1) throw new Error(USAGE)

        steps.push({
          kind: 'set',
          label: value.slice(0, at),
          value: value.slice(at + 1),
        })
      } else {
        as = value
      }

      i += 1
      continue
    }

    if (arg.startsWith('--')) throw new Error(USAGE)

    paths.push(arg)
  }

  if (paths.length !== 1) throw new Error(USAGE)

  const pagePath = paths[0]

  return {
    pagePath: pagePath.startsWith('/') ? pagePath : `/${pagePath}`,
    mobile,
    steps,
    ...(as === undefined ? {} : { as }),
  }
}

/** As many arrow presses as a slider can need before something is wrong. */
const MAX_PRESSES = 400

/**
 * Does one step to the page.
 *
 * `--set` walks a slider there with the keyboard — Home, then one arrow per
 * step — rather than writing its value. `fill()` refuses an input nobody can
 * type into, and setting `value` from script leaves React none the wiser,
 * since it listens for the events a real key press sends. The keyboard is also
 * the thing being photographed working.
 */
async function run(page: Page, step: Step): Promise<void> {
  if (step.kind === 'click') {
    await page.getByRole('button', { name: step.name, exact: true }).click()
    return
  }

  const slider = page.getByLabel(step.label, { exact: true })
  const [min, stride] = await Promise.all(
    ['min', 'step'].map(async (name) =>
      Number(await slider.getAttribute(name)),
    ),
  )

  if (!Number.isFinite(min) || !(stride > 0)) {
    throw new Error(`--set needs a slider with min and step: "${step.label}"`)
  }

  const presses = Math.round((Number(step.value) - min) / stride)

  if (!Number.isInteger(presses) || presses < 0 || presses > MAX_PRESSES) {
    throw new Error(`--set cannot reach ${step.value} on "${step.label}"`)
  }

  await slider.press('Home')
  for (let i = 0; i < presses; i += 1) await slider.press('ArrowRight')

  // A control that is in the DOM but off screen — the sheet's other tab on a
  // phone — takes the key presses nowhere. Better a failed run than a
  // screenshot quietly showing the value nobody asked for.
  const reached = Number(await slider.inputValue())

  if (Math.abs(reached - Number(step.value)) > stride / 2) {
    throw new Error(
      `"${step.label}" stayed at ${String(reached)}, not ${step.value} — is it on screen at this width?`,
    )
  }
}

/** `/customize/shawl-cotton` → `customize-shawl-cotton`, `/` → `home`. */
export function slugify(pagePath: string): string {
  const slug = pagePath
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug === '' ? 'home' : slug
}

/** A port the OS says is free right now, so parallel runs do not collide. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer()

    probe.on('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address()

      if (typeof address !== 'object' || address === null) {
        probe.close()
        reject(new Error('could not find a free port'))
        return
      }

      const { port } = address
      probe.close(() => {
        resolve(port)
      })
    })
  })
}

async function shoot({ pagePath, mobile, steps, as }: Options): Promise<void> {
  if (!existsSync(path.join(root, 'dist', 'index.html'))) {
    throw new Error('dist/ is missing — run `npm run build` first')
  }

  const server = await preview({
    root,
    preview: { port: await freePort(), strictPort: true, open: false },
    logLevel: 'warn',
  })
  const origin = server.resolvedUrls?.local[0]?.replace(/\/$/, '')

  if (origin === undefined) throw new Error('vite preview reported no URL')

  const browser = await chromium.launch()

  try {
    const context = await browser.newContext(
      mobile ? devices[MOBILE_DEVICE] : { viewport: DESKTOP_VIEWPORT },
    )
    const page = await context.newPage()

    // A blank screenshot is usually a thrown error, so say what it was.
    const problems: string[] = []
    page.on('pageerror', (error) => problems.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(message.text())
    })

    const response = await page.goto(`${origin}${pagePath}`, {
      waitUntil: 'networkidle',
    })
    await page.evaluate('document.fonts.ready')

    for (const step of steps) await run(page, step)

    if (steps.length > 0) {
      // A click can start a pattern loading, and the canvas redraws once it is
      // decoded — which is after the network has gone quiet again.
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(400)
    }

    const file = path.join(
      root,
      OUT_DIR,
      `${as ?? slugify(pagePath)}-${mobile ? 'mobile' : 'desktop'}.png`,
    )
    await mkdir(path.dirname(file), { recursive: true })
    await page.screenshot({ path: file, fullPage: true })

    const size = mobile
      ? MOBILE_DEVICE
      : `${DESKTOP_VIEWPORT.width}×${DESKTOP_VIEWPORT.height}`
    console.log(`${file} — ${pagePath} at ${size}`)

    if (response !== null && !response.ok()) {
      console.warn(`warning: the server answered ${response.status()}`)
    }

    for (const problem of new Set(problems)) {
      console.warn(`warning: the page logged "${problem}"`)
    }
  } finally {
    await browser.close()
    await server.close()
  }
}

try {
  await shoot(parseArgs(process.argv.slice(2)))
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
