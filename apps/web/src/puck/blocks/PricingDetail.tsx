import type { ComponentConfig } from '@puckeditor/core'
import { Check } from 'lucide-react'
import { ButtonLink, Eyebrow, Badge } from '@/components/ui'
import { sanitizePublicUrl, sanitizeRichTextHtml } from '@/lib/sanitize-html'

export type PricingDetailProps = {
  tierLabel: string
  name: string
  description: string
  price: string
  priceNote: string
  featured: boolean
  ctaText: string
  ctaLink: string
  whoFor: Array<{ item: string }>
  features: Array<{ title: string; desc: string }>
}

/** Single-tier pricing detail — the same composition as PricingCards' individual card,
 * but full-width/standalone for a page focused on one specific package. */
export const PricingDetail: ComponentConfig<PricingDetailProps> = {
  fields: {
    tierLabel: { type: 'text' },
    name: { type: 'text' },
    description: { type: 'textarea' },
    price: { type: 'text' },
    priceNote: { type: 'text' },
    featured: { type: 'radio', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    ctaText: { type: 'text' },
    ctaLink: { type: 'text' },
    whoFor: { type: 'array', arrayFields: { item: { type: 'text' } }, getItemSummary: (item) => item.item || 'Item' },
    features: {
      type: 'array',
      arrayFields: { title: { type: 'text' }, desc: { type: 'textarea' } },
      getItemSummary: (item) => item.title || 'Feature',
    },
  },
  defaultProps: {
    tierLabel: 'Pricing',
    name: '',
    description: '',
    price: '',
    priceNote: '',
    featured: false,
    ctaText: 'Get started',
    ctaLink: '#lead-form',
    whoFor: [],
    features: [],
  },
  render: ({ tierLabel, name, description, price, priceNote, featured, ctaText, ctaLink, whoFor, features }) => (
    <section className="section">
      <div className="wrap-narrow">
        <div className={`card${featured ? ' card-featured' : ''}`} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          {featured && <Badge>Most popular</Badge>}
          <Eyebrow>{tierLabel}</Eyebrow>
          <h2>{name}</h2>
          {description && <p style={{ marginTop: 'var(--space-3)', color: 'var(--text-secondary)' }}>{description}</p>}
          <div style={{ marginTop: 'var(--space-8)', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 40, fontWeight: 900 }} dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(price) }} />
            {priceNote && <span style={{ color: 'var(--text-tertiary)' }}>{priceNote}</span>}
          </div>
          <ButtonLink href={sanitizePublicUrl(ctaLink) || '#'} shimmer style={{ marginTop: 'var(--space-8)' }}>
            {ctaText}
          </ButtonLink>
        </div>

        {whoFor?.length > 0 && (
          <div style={{ marginTop: 'var(--space-12)' }}>
            <h3>Who this is for</h3>
            <ul className="req-grid" style={{ marginTop: 'var(--space-6)', listStyle: 'none' }}>
              {whoFor.map((w, i) => {
                const label = typeof w === 'string' ? w : (w as { item?: string; title?: string }).item || (w as { item?: string; title?: string }).title || ''
                return (
                  <li key={i} className="req-item">
                    <span className="req-ic">
                      <Check size={15} strokeWidth={3} color="var(--blue)" aria-hidden />
                    </span>
                    {label}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {features?.length > 0 && (
          <div style={{ marginTop: 'var(--space-12)' }}>
            <h3>What's included</h3>
            <div style={{ marginTop: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)' }}>
              {features.map((f, i) => (
                <div key={i} className="card">
                  <h4>{f.title}</h4>
                  <p style={{ marginTop: 'var(--space-2)' }}>{f.desc || (f as { description?: string }).description || ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  ),
}
