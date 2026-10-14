/**
 * Puts a design's colours into a pattern's SVG.
 *
 * Every tile in the catalog paints itself through `var(--c1, #default)`, so
 * the colours are a handful of custom properties rather than a search for fill
 * attributes — but a pattern reaches the canvas through `new Image()`, and an
 * image never sees the page's CSS. Nothing on the page can set those
 * properties for it. What can is a `<style>` rule inside the file itself, so
 * this writes one into the SVG text before it is handed over.
 *
 * `color` is set as well, for a pattern drawn with `currentColor`.
 *
 * Only `#rgb` and `#rrggbb` go in. The colours come from the catalog today and
 * from a share link in task 11, and a stylesheet assembled out of whatever a
 * URL carried is not something to leave open.
 */

/** `#a23b62` or `#abc`, and nothing else. */
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

export function isHexColor(value: string): boolean {
  return HEX.test(value)
}

/**
 * The end of the opening `<svg …>` tag, or -1.
 *
 * Quotes are respected, so an attribute holding a `>` cannot end the tag
 * early, and anything before the tag — an XML prologue, a comment, a doctype —
 * is skipped by looking for `<svg` itself.
 */
function openingTagEnd(svg: string): number {
  const start = svg.search(/<svg[\s>]/i)
  if (start < 0) return -1

  let quote: string | undefined

  for (let i = start; i < svg.length; i += 1) {
    const char = svg[i]

    if (quote !== undefined) {
      if (char === quote) quote = undefined
      continue
    }

    if (char === '"' || char === "'") quote = char
    else if (char === '>') return i + 1
  }

  return -1
}

/** `['#a23b62', '#e8b923']` → `--c1:#a23b62;--c2:#e8b923;color:#a23b62`. */
function declarations(colors: readonly string[]): string {
  const usable = colors.filter(isHexColor)

  if (usable.length === 0) return ''

  const vars = usable.map((hex, index) => `--c${String(index + 1)}:${hex}`)

  return [...vars, `color:${usable[0]}`].join(';')
}

/**
 * `svg` with `colors` written into its root element, or `svg` unchanged when
 * there is nothing usable to write or no root element to write it on.
 *
 * The rule goes on `svg` itself, which is the root of the image's own
 * document, so every shape inside inherits it. A pattern that leaves a
 * property out keeps the fallback written into its file — which is what it is
 * drawn in today, and stays its default when a design names fewer colours than
 * the pattern uses.
 */
export function recolorSvg(svg: string, colors: readonly string[]): string {
  const style = declarations(colors)
  if (style === '') return svg

  const at = openingTagEnd(svg)
  if (at < 0) return svg

  return `${svg.slice(0, at)}<style>svg{${style}}</style>${svg.slice(at)}`
}

/** An SVG string as a URL an `<img>` can load. */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
