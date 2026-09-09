import type { ReactNode } from 'react'
import { CountUp } from './CountUp'

export type StatBandItem = {
  icon: ReactNode
  label: string
  /** Static text (e.g. a per-item value that isn't a clean number, like "0-5%").
   * When omitted, `value` renders as an animated count-up instead. */
  raw?: string
  value?: number
  suffix?: string
  prefix?: string
}

/** Tonal (sand) stat strip with icon badges and count-up numbers — v7 pattern,
 * replaces relying on the hero as the only place stats ever appear on a page. */
export function StatBand({ items }: { items: StatBandItem[] }) {
  return (
    <section className="stat-band">
      <div className="wrap stat-band-grid">
        {items.map((item, i) => (
          <div className="stat-band-cell reveal" key={i}>
            <div className="stat-band-icon">{item.icon}</div>
            <div className="stat-band-num">
              {item.raw ? item.raw : <CountUp value={item.value ?? 0} suffix={item.suffix} prefix={item.prefix} />}
            </div>
            <div className="stat-band-label">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
