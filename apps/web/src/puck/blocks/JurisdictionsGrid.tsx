import type { ComponentConfig } from '@puckeditor/core'
import { Eyebrow, Flag } from '@/components/ui'

export type JurisdictionsGridProps = {
  eyebrow: string
  title: string
  description: string
  jurisdictions: Array<{
    /** ISO 3166-1 alpha-2 country code (e.g. "ae", "hk") — rendered via flagcdn.com,
     * not an emoji, so it renders crisply and consistently everywhere. */
    flagCode: string
    name: string
    rate: string
    description: string
    timeline: string
    price: string
    url: string
  }>
}

export const JurisdictionsGrid: ComponentConfig<JurisdictionsGridProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
    jurisdictions: {
      type: 'array',
      arrayFields: {
        flagCode: { type: 'text' },
        name: { type: 'text' },
        rate: { type: 'text' },
        description: { type: 'textarea' },
        timeline: { type: 'text' },
        price: { type: 'text' },
        url: { type: 'text' },
      },
    },
  },
  defaultProps: { eyebrow: 'Where we operate', title: '', description: '', jurisdictions: [] },
  render: ({ eyebrow, title, description, jurisdictions }) => (
    <section className="section section-alt" id="jur">
      <div className="wrap">
        <div className="reveal max-w-lg" style={{ marginBottom: 'var(--space-12)' }}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2>{title}</h2>
          {description && <p style={{ marginTop: 'var(--space-3)' }}>{description}</p>}
        </div>
        <div className="grid-3">
          {jurisdictions.map((j, i) => (
            <a
              href={j.url}
              className="card tile reveal"
              key={i}
              style={{ display: 'block', ['--tile-accent' as string]: 'var(--orange)', ['--tile-accent-lt' as string]: 'var(--orange-lt)' }}
            >
              <Flag code={j.flagCode} size="lg" />
              <h3 style={{ marginTop: 'var(--space-3)' }}>{j.name}</h3>
              <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14, marginTop: 'var(--space-1)' }}>{j.rate}</div>
              <p style={{ marginTop: 'var(--space-2)' }}>{j.description}</p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                  marginTop: 'var(--space-4)',
                  paddingTop: 'var(--space-3)',
                  borderTop: '1px solid var(--border)',
                  fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--text-tertiary)' }}>{j.timeline}</span>
                <strong>{j.price}</strong>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  ),
}
