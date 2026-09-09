import type { ComponentConfig } from '@puckeditor/core'
import { Eyebrow, FeatureShowcase } from '@/components/ui'

export type BenefitGridProps = {
  eyebrow: string
  title: string
  accent: 'blue' | 'orange'
  benefits: Array<{ title: string; description: string; image: string }>
}

export const BenefitGrid: ComponentConfig<BenefitGridProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    accent: {
      type: 'select',
      options: [
        { label: 'Blue', value: 'blue' },
        { label: 'Orange', value: 'orange' },
      ],
    },
    benefits: {
      type: 'array',
      arrayFields: {
        title: { type: 'text' },
        description: { type: 'textarea' },
        image: { type: 'text' },
      },
    },
  },
  defaultProps: { eyebrow: '', title: '', accent: 'blue', benefits: [] },
  render: ({ eyebrow, title, accent = 'blue', benefits = [] }) => (
    <section className="section">
      <div className="wrap">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {title && <h2>{title}</h2>}
        <div style={{ marginTop: 'var(--space-12)' }}>
          <FeatureShowcase
            accent={accent}
            items={(benefits || []).map((b) => ({
              title: b.title,
              desc: b.description || (b as { desc?: string }).desc || '',
              image: b.image,
            }))}
          />
        </div>
      </div>
    </section>
  ),
}
