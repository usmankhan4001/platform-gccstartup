import type { ComponentConfig } from '@puckeditor/core'
import { ButtonLink, Eyebrow } from '@/components/ui'

export type ProcessStepsProps = {
  eyebrow: string
  title: string
  description: string
  steps: Array<{ title: string; description: string }>
  ctaText: string
  ctaLink: string
}

export const ProcessSteps: ComponentConfig<ProcessStepsProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
    steps: { type: 'array', arrayFields: { title: { type: 'text' }, description: { type: 'textarea' } } },
    ctaText: { type: 'text' },
    ctaLink: { type: 'text' },
  },
  defaultProps: { eyebrow: 'How it works', title: '', description: '', steps: [], ctaText: '', ctaLink: '' },
  render: ({ eyebrow = '4-Step Fast-Track Setup', title = 'How Your GCC Entity Is Formed in 72 Hours', description = 'Zero physical presence required for initial approval, trade license issuance, and bank pre-vetting.', steps = [], ctaText = 'Start Your Company Today', ctaLink = '#lead-form' }) => {
    const list = Array.isArray(steps) && steps.length > 0
      ? steps
      : [
          {
            title: '1. Strategy & Structure Mapping',
            description: 'We align your business model, trade activities, and ownership structure to guarantee 0% tax qualification.',
          },
          {
            title: '2. Name Approval & Security Clearance',
            description: 'Digital submission to government registry with initial name reservation and ministry security clearance.',
          },
          {
            title: '3. Trade License & MOA Issuance',
            description: 'Electronic Memorandum of Association signing and official government trade license delivery.',
          },
          {
            title: '4. Banking & Residence Onboarding',
            description: 'Fast-track corporate bank account opening (Wio / Emirates NBD) and VIP residence visa processing.',
          },
        ]

    return (
      <section className="section" id="process">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <div className="reveal max-w-lg" style={{ marginBottom: 'var(--space-12)' }}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2>{title}</h2>
            {description && <p style={{ marginTop: 'var(--space-3)' }}>{description}</p>}
          </div>
          <div className="process-track reveal">
            {list.map((s, i) => (
              <div className="process-step" key={i}>
                <div className="process-circle">{i + 1}</div>
                <div className="process-content">
                  <h4>{s.title}</h4>
                  <p style={{ marginTop: 'var(--space-1)' }}>{s.description}</p>
                </div>
              </div>
            ))}
          </div>
          {ctaText && (
            <ButtonLink href={ctaLink || '#lead-form'} style={{ marginTop: 'var(--space-12)' }}>
              {ctaText}
            </ButtonLink>
          )}
        </div>
      </section>
    )
  },
}
