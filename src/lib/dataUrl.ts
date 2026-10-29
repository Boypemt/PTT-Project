/**
 * A `data:` URL as bytes.
 *
 * Konva hands a rendered stage over as a base64 `data:` URL, and both things
 * the prototype does with one — hang it off a download link, and later pass it
 * to the Web Share API as a file — want a `Blob` instead. A 2000px PNG is a
 * few megabytes of base64, which is past what some browsers will follow as a
 * link; an object URL is a pointer to bytes the page already holds.
 *
 * Base64 only, because that is what `toDataURL` produces. A percent-encoded
 * `data:` URL is a different format with its own escaping rules, and guessing
 * at one here would be untested code standing between a visitor and their
 * design. It says so rather than returning something subtly wrong.
 */

/** `data:<media type>;base64,<payload>` — the shape `toDataURL` writes. */
const BASE64_DATA_URL = /^data:([^;,]*)(?:;[^;,]*)*;base64,([A-Za-z0-9+/=\s]*)$/

/** The type a `data:` URL that names none is read as, per the data URL spec. */
const DEFAULT_MEDIA_TYPE = 'text/plain'

export function dataUrlToBlob(dataUrl: string): Blob {
  const match = BASE64_DATA_URL.exec(dataUrl)

  if (match === null) {
    throw new TypeError('dataUrlToBlob needs a base64 data: URL')
  }

  const [, mediaType, payload] = match

  // `atob` wants the payload alone; a data URL that has been wrapped across
  // lines somewhere is still the same bytes.
  const binary = atob(payload.replace(/\s+/g, ''))
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)

  return new Blob([bytes], {
    type: mediaType === '' ? DEFAULT_MEDIA_TYPE : mediaType,
  })
}
