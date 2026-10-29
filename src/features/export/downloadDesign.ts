/**
 * Puts a rendered design in the visitor's Downloads folder.
 *
 * There is no backend and there is not going to be one, so "saving" a design
 * is the browser saving a file: an anchor carrying `download`, clicked from
 * script. The bytes are already in the page, so they go through an object URL
 * rather than the `data:` URL Konva produced — a few megabytes of base64 in an
 * `href` is more than some browsers will follow.
 *
 * The URL is revoked on the next turn of the event loop rather than straight
 * after the click: revoking it in the same tick cancels the download in
 * browsers that fetch it asynchronously, which is most of them.
 */
import type { DesignPng } from '@/editor/designPng'
import { dataUrlToBlob } from '@/lib/dataUrl'
import { exportFileName } from '@/lib/exportName'

/**
 * Downloads `png` as the design of `productId`, and returns the name it was
 * given — which is what the dialog in the next task tells the visitor to look
 * for.
 *
 * `now` is a parameter so the name is something a caller decides rather than
 * something the clock does during a test.
 */
export function downloadDesignPng(
  png: DesignPng,
  productId: string,
  now: Date = new Date(),
): string {
  const fileName = exportFileName(productId, now)
  const url = URL.createObjectURL(dataUrlToBlob(png.dataUrl))

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  // Firefox only fires the click on an anchor that is in the document.
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()

  globalThis.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)

  return fileName
}
