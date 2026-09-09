import type { ReactNode } from 'react'

export type BentoItem = {
  icon: ReactNode
  title: string
  desc: string
  href?: string
  tint?: 'orange' | 'sand' | 'blue'
}

/** One featured (large, dark) tile + several tonal smaller tiles — replaces a
 * uniform grid so one editor-picked item gets visual priority. `featured` is
 * always the first tile and always spans both rows. */
export function BentoGrid({ featured, items }: { featured: BentoItem; items: BentoItem[] }) {
  return (
    <div className="bento-grid">
      <div className="bento-tile bento-tile-big reveal">
        <div>
          <div className="bento-icon">{featured.icon}</div>
          <h3 style={{ marginTop: 'var(--space-4)' }}>{featured.title}</h3>
          <p>{featured.desc}</p>
        </div>
        {featured.href && (
          <a className="bento-arrow" href={featured.href} style={{ color: '#fff' }}>
            Explore →
          </a>
        )}
      </div>
      {items.map((item, i) => (
        <div className={['bento-tile', 'bento-tile-sm', item.tint ? `tint-${item.tint}` : ''].filter(Boolean).join(' ')} key={i}>
          <div className="bento-icon">{item.icon}</div>
          <h4>{item.title}</h4>
          <p>{item.desc}</p>
          {item.href && (
            <a className="bento-arrow" href={item.href}>
              Explore →
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
