import { describe, expect, it } from 'vitest'
import { isHexColor, recolorSvg, svgDataUrl } from './svgColor'

const TILE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
  '<rect width="200" height="200" fill="var(--c1, #4b2a4f)" />' +
  '</svg>'

const TEAK = '#4B2A4F'
const PINK = '#A23B62'

/** The rule this writes, as a single string to look for. */
const rule = (declarations: string) => `<style>svg{${declarations}}</style>`

describe('isHexColor', () => {
  it('takes the two shapes a catalog colour comes in', () => {
    expect(isHexColor('#a23b62')).toBe(true)
    expect(isHexColor('#A23B62')).toBe(true)
    expect(isHexColor('#abc')).toBe(true)
  })

  it('turns away anything that is not one', () => {
    for (const value of [
      'red',
      'rgb(1,2,3)',
      '#12345',
      '#gggggg',
      'a23b62',
      '#a23b62;}body{display:none',
      '',
    ]) {
      expect(isHexColor(value)).toBe(false)
    }
  })
})

describe('recolorSvg', () => {
  it('writes the colours onto the root element', () => {
    const out = recolorSvg(TILE, [TEAK, PINK])

    expect(out).toContain(rule(`--c1:${TEAK};--c2:${PINK};color:${TEAK}`))
  })

  it('puts the rule inside the root, where the shapes inherit it', () => {
    const out = recolorSvg(TILE, [TEAK])

    expect(out.indexOf('<style>')).toBeGreaterThan(out.indexOf('<svg'))
    expect(out.indexOf('<style>')).toBeLessThan(out.indexOf('<rect'))
    expect(out).toContain('fill="var(--c1, #4b2a4f)"')
  })

  it('names as many properties as the design has colours', () => {
    expect(recolorSvg(TILE, [TEAK])).toContain(
      rule(`--c1:${TEAK};color:${TEAK}`),
    )
    expect(recolorSvg(TILE, [TEAK, PINK, '#abc'])).toContain(
      rule(`--c1:${TEAK};--c2:${PINK};--c3:#abc;color:${TEAK}`),
    )
  })

  it('leaves the file alone when there is nothing to put in it', () => {
    expect(recolorSvg(TILE, [])).toBe(TILE)
    expect(recolorSvg(TILE, ['tomato', 'url(#x)'])).toBe(TILE)
  })

  it('drops a colour it cannot vouch for and keeps the rest in order', () => {
    const out = recolorSvg(TILE, ['javascript:alert(1)', TEAK])

    expect(out).toContain(rule(`--c1:${TEAK};color:${TEAK}`))
    expect(out).not.toContain('javascript')
  })

  it('finds the root past a prologue, a comment and an attribute with a >', () => {
    const svg =
      '<?xml version="1.0"?>\n<!-- a > inside a comment -->\n' +
      '<svg xmlns="http://www.w3.org/2000/svg" aria-label="a > b"><rect /></svg>'

    const out = recolorSvg(svg, [TEAK])

    expect(out).toContain('aria-label="a > b"><style>')
    expect(out).toContain('</style><rect />')
  })

  it('gives back anything that is not an SVG at all', () => {
    const notSvg = '<html><body>nope</body></html>'

    expect(recolorSvg(notSvg, [TEAK])).toBe(notSvg)
  })
})

describe('svgDataUrl', () => {
  it('escapes what a URL cannot carry as it stands', () => {
    const url = svgDataUrl(recolorSvg(TILE, [TEAK]))

    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
    expect(url).not.toContain('<')
    expect(url).not.toContain('#')
    expect(decodeURIComponent(url.split(',')[1])).toContain(TEAK)
  })
})
