import type { ReactNode } from 'react'
import { Eyebrow } from './Section'

/** One confident statement, no card, no icon — a device serious consultancy sites
 * use to signal authority between denser sections. */
export function EditorialBreak({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <section className="editorial-break">
      <div className="wrap">
        <div className="editorial-break-inner reveal">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 style={{ marginTop: 'var(--space-4)' }}>{children}</h2>
        </div>
      </div>
    </section>
  )
}
