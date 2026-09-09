import type { ComponentConfig } from '@puckeditor/core'
import { ButtonLink } from '@/components/ui'
import {
  styleFields,
  defaultStyleProps,
  type StyleProps,
  getSectionStyle,
  getSectionClassName,
  getContainerClassName,
} from '@/puck/fields/styleFields'

export type GlobalCtaProps = {
  headline: string
  subhead: string
  primaryBtn: string
  primaryLink: string
  secondaryBtn: string
  secondaryLink: string
} & StyleProps

export const GlobalCta: ComponentConfig<GlobalCtaProps> = {
  fields: {
    headline: { type: 'text' },
    subhead: { type: 'textarea' },
    primaryBtn: { type: 'text' },
    primaryLink: { type: 'text' },
    secondaryBtn: { type: 'text' },
    secondaryLink: { type: 'text' },
    ...styleFields,
  },
  defaultProps: {
    ...defaultStyleProps,
    bgPreset: 'dark',
    maxWidth: 'narrow',
    headline: 'Your global company is 15 minutes away.',
    subhead: 'Book a free strategy call — direct with the founder. No obligation, no sales script.',
    primaryBtn: 'Book a free call',
    primaryLink: '#lead-form',
    secondaryBtn: 'WhatsApp us',
    secondaryLink: 'https://wa.me/447868762416',
  },
  render: (props) => {
    const headline = props.headline || 'Ready to Launch Your GCC Entity?'
    const subhead = props.subhead || 'Join 1,200+ international businesses structured for 0% tax efficiency in the UAE and Saudi Arabia.'
    const primaryBtn = props.primaryBtn || (props as any).buttonText || 'Schedule Advisor Call'
    const primaryLink = props.primaryLink || (props as any).buttonLink || '#lead-form'
    const secondaryBtn = props.secondaryBtn || 'WhatsApp Us'
    const secondaryLink = props.secondaryLink || 'https://wa.me/971500000000'
    const maxWidth = props.maxWidth
    const sectionClass = getSectionClassName(props, 'section reveal')
    const sectionStyle = getSectionStyle(props, { textAlign: 'center' })
    const containerClass = getContainerClassName(maxWidth ?? 'narrow')

    return (
      <section className={sectionClass} style={sectionStyle}>
        <div className={containerClass}>
          <h2>{headline}</h2>
          {subhead && <p style={{ marginTop: 'var(--space-4)' }}>{subhead}</p>}
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', marginTop: 'var(--space-8)', flexWrap: 'wrap' }}>
            {primaryBtn && <ButtonLink href={primaryLink}>{primaryBtn}</ButtonLink>}
            {secondaryBtn && (
              <ButtonLink
                href={secondaryLink}
                variant="outline"
                style={{ borderColor: 'rgba(255,255,255,.35)', color: '#fff' }}
              >
                {secondaryBtn}
              </ButtonLink>
            )}
          </div>
        </div>
      </section>
    )
  },
}
