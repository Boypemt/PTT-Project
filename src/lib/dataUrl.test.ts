import { describe, expect, it } from 'vitest'
import { dataUrlToBlob } from './dataUrl'

/** The first bytes of every PNG, which is what an exported design starts with. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

const base64 = (bytes: number[]) => btoa(String.fromCharCode(...bytes))

async function bytesOf(blob: Blob): Promise<number[]> {
  return [...new Uint8Array(await blob.arrayBuffer())]
}

describe('dataUrlToBlob', () => {
  it('keeps the bytes and the media type', async () => {
    const blob = dataUrlToBlob(`data:image/png;base64,${base64(PNG_SIGNATURE)}`)

    expect(blob.type).toBe('image/png')
    expect(await bytesOf(blob)).toEqual(PNG_SIGNATURE)
  })

  it('survives bytes that are not valid text', async () => {
    const bytes = [0x00, 0xff, 0x80, 0x7f, 0xc3, 0x28]
    const blob = dataUrlToBlob(`data:image/png;base64,${base64(bytes)}`)

    // The charCode loop is here rather than a TextEncoder for exactly this:
    // decoding base64 as a string and re-encoding it as UTF-8 would rewrite
    // every byte above 0x7f and quietly corrupt the PNG.
    expect(await bytesOf(blob)).toEqual(bytes)
  })

  it('reads an empty payload as an empty blob', async () => {
    const blob = dataUrlToBlob('data:image/png;base64,')

    expect(blob.type).toBe('image/png')
    expect(await bytesOf(blob)).toEqual([])
  })

  it('ignores whitespace a wrapped data URL picked up', async () => {
    const payload = base64(PNG_SIGNATURE)
    const wrapped = `data:image/png;base64,${payload.slice(0, 4)}\n  ${payload.slice(4)}`

    expect(await bytesOf(dataUrlToBlob(wrapped))).toEqual(PNG_SIGNATURE)
  })

  it('falls back to the media type the spec gives a URL that names none', () => {
    expect(dataUrlToBlob('data:;base64,').type).toBe('text/plain')
  })

  it('keeps parameters out of the media type', () => {
    expect(dataUrlToBlob('data:image/png;charset=utf-8;base64,').type).toBe(
      'image/png',
    )
  })

  it('refuses anything that is not a base64 data URL', () => {
    for (const notOne of [
      '',
      'https://example.org/design.png',
      'data:image/png,%89PNG',
      'blob:https://example.org/0c4f',
    ]) {
      expect(() => dataUrlToBlob(notOne), notOne).toThrow(TypeError)
    }
  })
})
