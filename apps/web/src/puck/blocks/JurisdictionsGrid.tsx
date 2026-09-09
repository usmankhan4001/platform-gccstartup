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
  render: ({ eyebrow = 'Premier GCC Hubs', title = 'Authorized Freezones & Mainland Gateways', description = 'Compare registered jurisdictions across UAE, Saudi Arabia, Qatar, Bahrain, and Oman.', jurisdictions = [] }) => {
    const list = Array.isArray(jurisdictions) && jurisdictions.length > 0
      ? jurisdictions
      : [
          {
            flagCode: 'AE',
            name: 'United Arab Emirates',
            rate: '0% QFZP Corporate Tax · 0% Personal Tax',
            description: 'World-leading trade hubs (IFZA, Meydan, DMCC, ADGM) with 100% foreign ownership and instant visa issuance.',
            timeline: '72 Hours',
            price: 'From $4,500',
            url: '/jurisdictions/uae',
          },
          {
            flagCode: 'SA',
            name: 'Saudi Arabia (MISA)',
            rate: '20% Corporate Tax · 0% Personal Tax · Regional HQ Incentives',
            description: 'Fastest-growing G20 economy with 100% foreign ownership via MISA fast-track investment license.',
            timeline: '5-7 Days',
            price: 'From $12,500',
            url: '/jurisdictions/saudi-arabia',
          },
          {
            flagCode: 'BH',
            name: 'Bahrain',
            rate: '0% Corporate Tax · 0% Personal Tax',
            description: 'Strategic low-cost gateway to Saudi Arabia with 100% foreign ownership across most commercial activities.',
            timeline: '48 Hours',
            price: 'From $5,200',
            url: '/jurisdictions/bahrain',
          },
          {
            flagCode: 'QA',
            name: 'Qatar (QFMA / QFC)',
            rate: '10% Corporate Tax · 0% Personal Tax',
            description: 'High-capital financial center with 100% foreign profit repatriation and state-of-the-art legal infrastructure.',
            timeline: '7-10 Days',
            price: 'From $8,900',
            url: '/jurisdictions/qatar',
          },
          {
            flagCode: 'OM',
            name: 'Oman (Special Economic Zones)',
            rate: '0% Tax in Freezones (Duqm, Sohar)',
            description: 'Strategic Indian Ocean shipping corridor offering 30-year tax exemptions and 100% foreign ownership.',
            timeline: '5-8 Days',
            price: 'From $6,400',
            url: '/jurisdictions/oman',
          },
          {
            flagCode: 'SG',
            name: 'Singapore & Hong Kong Holdings',
            rate: 'Offshore Territorial Exemption',
            description: 'Premier holding company jurisdictions to structure IP assets, dividends, and cross-border trade.',
            timeline: '24-48 Hours',
            price: 'From $3,800',
            url: '/jurisdictions/singapore',
          },
        ]

    return (
      <section className="section section-alt" id="jur">
        <div className="wrap">
          <div className="reveal max-w-lg" style={{ marginBottom: 'var(--space-12)' }}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2>{title}</h2>
            {description && <p style={{ marginTop: 'var(--space-3)' }}>{description}</p>}
          </div>
          <div className="grid-3">
            {list.map((j, i) => (
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
    )
  },
}
