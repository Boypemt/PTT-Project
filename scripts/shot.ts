/**
 * Screenshots one page of the built site, so whoever changed the UI — me
 * included — can look at it instead of guessing.
 *
 *   npm run build
 *   npm run shot -- /customize/shawl-cotton
 *   npm run shot -- /customize/shawl-cotton --mobile
 *
 * On Git Bash for Windows, drop the leading slash — `npm run shot --
 * customize/shawl-cotton` — because that shell rewrites an argument starting
 * with `/` into a Windows path before node ever sees it.
 *
 * It serves `dist/` with `vite preview` on a free port, opens the path, waits
 * for the network to go quiet (the catalog JSON is fetched by the page) and
 * for the webfonts, writes `screenshots/<slug>-<desktop|mobile>.png`, then
 * shuts the server down. It never builds: a stale `dist/` would be a
 * screenshot of the wrong code, so a missing one is an error instead.
 *
 * Playwright tests and CI belong to task 14 — this is only the camera.
 */
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'node:net'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium, devices } from '@playwright/test'
import { preview } from 'vite'

/** Wide enough for the editor's three columns. */
const DESKTOP_VIEWPORT = { width: 1280, height: 800 }

/** A current mid-size Android, from Playwright's own device registry. */
const MOBILE_DEVICE = 'Pixel 7'

const OUT_DIR = 'screenshots'

const root = fileURLToPath(new URL('..', import.meta.url))

type Options = { pagePath: string; mobile: boolean }

const USAGE = 'usage: npm run shot -- <path> [--mobile]'

function parseArgs(argv: string[]): Options {
  const paths = argv.filter((arg) => !arg.startsWith('--'))
  const unknownFlags = argv.filter(
    (arg) => arg.startsWith('--') && arg !== '--mobile',
  )

  if (paths.length !== 1 || unknownFlags.length > 0) throw new Error(USAGE)

  const pagePath = paths[0]

  return {
    pagePath: pagePath.startsWith('/') ? pagePath : `/${pagePath}`,
    mobile: argv.includes('--mobile'),
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

async function shoot({ pagePath, mobile }: Options): Promise<void> {
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

    const file = path.join(
      root,
      OUT_DIR,
      `${slugify(pagePath)}-${mobile ? 'mobile' : 'desktop'}.png`,
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
