import type { ReactNode } from 'react'
import Image from 'next/image'

/** Shared full-bleed-photo hero shell — immersive photo + navy gradient overlay + white text on top.
 * Used by the Puck Hero block and every detail-page hero (country/service/pricing).
 * Fully responsive: fluid height, adaptive padding, and mobile-optimized layout. */
export function PhotoHero({ image, children }: { image: string; children: ReactNode }) {
  return (
    <section className="photo-hero">
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        quality={70}
        className="photo-hero-image"
      />
      <div className="photo-hero-overlay" />
      <div className="photo-hero-content">
        {children}
      </div>
    </section>
  )
}
