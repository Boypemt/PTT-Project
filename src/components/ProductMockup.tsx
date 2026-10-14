/**
 * Draws a product's placeholder mockup in a chosen base colour.
 *
 * The drawn SVGs come in two parts: `base` is the silhouette, used here as a
 * mask so one flat colour can stand for any fabric, and `overlay` holds the
 * shading and folds, multiplied on top so the colour shows through. The same
 * two layers will sit under the pattern in the editor, which is why this lives
 * in `components/` rather than in either page that uses it.
 *
 * `children` draw inside the frame, above the mockup — the internal catalog
 * page puts its print-area outlines there.
 */
import type { ReactNode } from 'react'
import type { ProductMockup as Mockup } from '@/catalog'

export function ProductMockup({
  mockup,
  baseColor,
  className = '',
  children,
}: {
  mockup: Mockup
  baseColor: string
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={`relative overflow-hidden bg-paper-100 ${className}`}
      style={{ aspectRatio: `${mockup.width} / ${mockup.height}` }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: baseColor,
          maskImage: `url(${mockup.base})`,
          WebkitMaskImage: `url(${mockup.base})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
        }}
      />
      {mockup.overlay ? (
        <img
          src={mockup.overlay}
          alt=""
          className="absolute inset-0 size-full mix-blend-multiply"
        />
      ) : null}
      {children}
    </div>
  )
}
