import type { ComponentConfig } from '@puckeditor/core'
import { ButtonLink, Eyebrow } from '@/components/ui'
import {
  styleFields,
  defaultStyleProps,
  type StyleProps,
  getSectionStyle,
  getSectionClassName,
  getContainerClassName,
} from '@/puck/fields/styleFields'

export type FaqProps = {
  title: string
  contactTitle: string
  contactDescription: string
  contactButtonText: string
  contactButtonLink: string
  faqs: Array<{ q: string; a: string }>
} & StyleProps

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="card" style={{ marginBottom: 'var(--space-3)', padding: 'var(--space-4) var(--space-6)' }}>
      <style>{`summary::-webkit-details-marker{display:none}.faq-toggle{transition:transform .15s ease}details[open] .faq-toggle{transform:rotate(45deg)}`}</style>
      <details>
        <summary
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-4)',
            cursor: 'pointer',
            fontWeight: 700,
            color: 'var(--text)',
            listStyle: 'none',
          }}
        >
          <span>{q}</span>
          <span className="faq-toggle" aria-hidden style={{ color: 'var(--accent)', fontSize: 20, flexShrink: 0 }}>+</span>
        </summary>
        <p style={{ marginTop: 'var(--space-3)' }}>{a}</p>
      </details>
    </div>
  )
}

export const Faq: ComponentConfig<FaqProps> = {
  fields: {
    title: { type: 'text' },
    contactTitle: { type: 'text' },
    contactDescription: { type: 'textarea' },
    contactButtonText: { type: 'text' },
    contactButtonLink: { type: 'text' },
    faqs: { type: 'array', arrayFields: { q: { type: 'text' }, a: { type: 'textarea' } } },
    ...styleFields,
  },
  defaultProps: {
    ...defaultStyleProps,
    title: 'Common questions answered.',
    contactTitle: 'Still have questions?',
    contactDescription: 'WhatsApp us for a direct, honest answer. Most questions are resolved within a few hours.',
    contactButtonText: 'WhatsApp us now',
    contactButtonLink: 'https://wa.me/447868762416',
    faqs: [],
  },
  render: (props) => {
    const { title, contactTitle, contactDescription, contactButtonText, contactButtonLink, faqs, maxWidth } = props
    const sectionClass = getSectionClassName(props)
    const sectionStyle = getSectionStyle(props)
    const containerClass = getContainerClassName(maxWidth)

    const list = Array.isArray(faqs) && faqs.length > 0
      ? faqs
      : [
          {
            q: 'Can foreign nationals own 100% of a UAE or Saudi company?',
            a: 'Yes. Both UAE Freezones and Mainland commercial entities now allow 100% foreign ownership with zero requirement for a local Emirati partner or nominee. Saudi Arabia also permits 100% foreign ownership via the MISA investment program.',
          },
          {
            q: 'How does the 0% UAE Corporate Tax (QFZP) regime work?',
            a: 'Under UAE Corporate Tax Law, Qualifying Free Zone Persons (QFZPs) that conduct qualifying activities, maintain adequate economic substance, and do not exceed the de minimis non-qualifying revenue threshold are taxed at an effective 0% corporate tax rate.',
          },
          {
            q: 'How long does it take to open a corporate bank account?',
            a: 'Digital business accounts (such as Wio Bank) are typically approved and operational within 48 to 72 hours. Tier-1 conventional accounts (Emirates NBD, Mashreq, FAB) take 7 to 14 business days with our direct relationship manager pre-approval.',
          },
          {
            q: 'Do I need to visit Dubai or Riyadh to start my company?',
            a: 'Initial security clearance, name reservation, and trade license issuance are 100% digital with no travel required. A brief 1-day visit is only required later for residency visa medical typing and biometrics.',
          },
        ]

    return (
      <section className={sectionClass} style={sectionStyle} id="faq">
        <div className={`${containerClass} grid-2-split-rev`}>
          <div className="reveal">
            <Eyebrow>Questions</Eyebrow>
            <h2>{title || 'Frequently Asked Questions'}</h2>
            <div className="card" style={{ marginTop: 'var(--space-8)' }}>
              <h4>{contactTitle}</h4>
              <p style={{ marginTop: 'var(--space-2)' }}>{contactDescription}</p>
              {contactButtonText && (
                <ButtonLink href={contactButtonLink} style={{ marginTop: 'var(--space-4)' }}>
                  {contactButtonText}
                </ButtonLink>
              )}
            </div>
          </div>
          <div className="reveal">
            {list.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>
    )
  },
}
