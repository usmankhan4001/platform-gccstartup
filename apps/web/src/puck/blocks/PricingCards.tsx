import type { ComponentConfig } from '@puckeditor/core'
import { Check } from 'lucide-react'
import { ButtonLink, Badge, Eyebrow } from '@/components/ui'
import { sanitizePublicUrl, sanitizeRichTextHtml } from '@/lib/sanitize-html'

export type PricingCardsProps = {
  eyebrow: string
  title: string
  description: string
  tiers: Array<{
    label: string
    name: string
    description: string
    price: string
    priceNote: string
    featured: boolean
    url: string
    features: Array<{ item: string }>
  }>
}

export const PricingCards: ComponentConfig<PricingCardsProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
    tiers: {
      type: 'array',
      arrayFields: {
        label: { type: 'text' },
        name: { type: 'text' },
        description: { type: 'textarea' },
        price: { type: 'text' },
        priceNote: { type: 'text' },
        featured: { type: 'radio', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
        url: { type: 'text' },
        features: { type: 'array', arrayFields: { item: { type: 'text' } } },
      },
    },
  },
  defaultProps: { eyebrow: 'Pricing', title: '', description: '', tiers: [] },
  render: ({ eyebrow, title, description, tiers }) => (
    <section className="section section-alt" id="tiers">
      <div className="wrap" style={{ textAlign: 'center' }}>
        <div className="reveal max-w-lg" style={{ marginBottom: 'var(--space-12)' }}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2>{title}</h2>
          {description && <p style={{ marginTop: 'var(--space-3)' }}>{description}</p>}
        </div>
        <div className="grid-3" style={{ textAlign: 'left' }}>
          {tiers.map((t, i) => (
            <div
              className={`card tile reveal${t.featured ? ' card-featured' : ''}`}
              key={i}
              style={{ ['--tile-accent' as string]: 'var(--blue)', ['--tile-accent-lt' as string]: 'var(--blue-lt)' }}
            >
              {t.featured && <Badge>Most popular</Badge>}
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>{t.label}</div>
              <h3 style={{ marginTop: 'var(--space-1)' }}>{t.name}</h3>
              <p style={{ marginTop: 'var(--space-2)' }}>{t.description}</p>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <span style={{ fontSize: 32, fontWeight: 900 }} dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(t.price) }} />
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{t.priceNote}</div>
              </div>
              <ul style={{ marginTop: 'var(--space-4)', listStyle: 'none', display: 'grid', gap: 'var(--space-2)' }}>
                {t.features.map((f, fi) => {
                  const label = typeof f === 'string' ? f : (f as { item?: string; title?: string }).item || (f as { item?: string; title?: string }).title || ''
                  return (
                    <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                      <Check size={16} strokeWidth={2.5} color="var(--success)" aria-hidden />
                      {label}
                    </li>
                  )
                })}
              </ul>
              <ButtonLink href={sanitizePublicUrl(t.url) || '#'} variant={t.featured ? 'primary' : 'outline'} className="w-full flex-center" style={{ marginTop: 'var(--space-6)' }}>
                View full breakdown
              </ButtonLink>
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
}
