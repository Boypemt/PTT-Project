/**
 * Guards the asset files themselves. A malformed SVG is served with a 200 and
 * passes every manifest check — it simply renders as nothing, which only shows
 * up as a blank product or an empty swatch in the browser. One double hyphen
 * inside an XML comment is enough to cause it, so the files are parsed here.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const CATALOG_DIR = 'public/catalog'

/** Paths relative to the catalog directory, with forward slashes. */
function catalogSvgPaths(): string[] {
  return readdirSync(CATALOG_DIR, { recursive: true, encoding: 'utf8' })
    .map((entry) => entry.replaceAll('\\', '/'))
    .filter((entry) => entry.endsWith('.svg'))
    .sort()
}

/** The parser's complaint, or `null` when the source is a well-formed SVG. */
function svgParseError(source: string): string | null {
  const document = new DOMParser().parseFromString(source, 'image/svg+xml')
  const failure = document.querySelector('parsererror')

  if (failure) {
    return failure.textContent?.replace(/\s+/g, ' ').trim() || 'parse error'
  }

  const root = document.documentElement.tagName
  return root === 'svg' ? null : `root element is <${root}>, expected <svg>`
}

describe('the SVG assets in public/catalog', () => {
  it('are well-formed XML', () => {
    const problems = catalogSvgPaths().flatMap((path) => {
      const error = svgParseError(readFileSync(join(CATALOG_DIR, path), 'utf8'))
      return error === null ? [] : [`${path}: ${error}`]
    })

    expect(problems).toEqual([])
  })

  it('covers the products and patterns directories', () => {
    const paths = catalogSvgPaths()

    expect(paths.filter((path) => path.startsWith('products/')).length).toBe(22)
    expect(paths.filter((path) => path.startsWith('patterns/')).length).toBe(14)
  })

  // The check is only worth having if it actually rejects something: a double
  // hyphen is illegal inside an XML comment, and that is how a hand-written
  // SVG usually breaks.
  it('rejects a document the parser cannot read', () => {
    expect(
      svgParseError(
        '<svg xmlns="http://www.w3.org/2000/svg"><!-- uses --c1 --></svg>',
      ),
    ).not.toBeNull()
    expect(
      svgParseError('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    ).toBe(null)
  })
})
