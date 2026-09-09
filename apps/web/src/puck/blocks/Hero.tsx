import type { ComponentConfig } from '@puckeditor/core'
import { ButtonLink, Eyebrow, PhotoHero, MarkedText } from '@/components/ui'
import {
  styleFields,
  defaultStyleProps,
  type StyleProps,
  getSectionStyle,
  getSectionClassName,
  getContainerClassName,
} from '@/puck/fields/styleFields'
import { createMediaPickerField } from '@/components/admin/MediaPickerModal'

export type HeroProps = {
  eyebrow: string
  title: string
  /** A phrase from `title` to underline with the hand-drawn accent stroke. Leave
   * blank for a plain headline; an unmatched phrase is simply ignored. */
  titleHighlight: string
  description: string
  primaryCta: string
  primaryCtaLink: string
  secondaryCta: string
  secondaryCtaLink: string
  proofPoints: Array<{ num: string; label: string }>
  image: string
} & StyleProps

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1663768266259-d723cfbe969b?fm=jpg&q=80&w=2000&auto=format&fit=crop'

export const Hero: ComponentConfig<HeroProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    titleHighlight: { type: 'text', label: 'Underline this phrase in the title' },
    description: { type: 'textarea' },
    primaryCta: { type: 'text' },
    primaryCtaLink: { type: 'text' },
    secondaryCta: { type: 'text' },
    secondaryCtaLink: { type: 'text' },
    proofPoints: {
      type: 'array',
      arrayFields: { num: { type: 'text' }, label: { type: 'text' } },
      max: 4,
    },
    image: createMediaPickerField('Background Image'),
    ...styleFields,
  },
  defaultProps: {
    ...defaultStyleProps,
    bgPreset: 'dark',
    eyebrow: 'Company Formation · Global Banking · Tax Residency',
    title: 'Legally pay 0% tax. Bank globally. Own 100%.',
    titleHighlight: '0% tax',
    description:
      'Launch your company in the UAE, Bahrain, Hong Kong & beyond — with real bank accounts, full privacy, and total ownership.',
    primaryCta: 'Start My Company Today',
    primaryCtaLink: '#lead-form',
    secondaryCta: '',
    secondaryCtaLink: '',
    proofPoints: [
      { num: '15+', label: 'Jurisdictions' },
      { num: '500+', label: 'Companies registered' },
      { num: '48h', label: 'Fastest setup' },
    ],
    image: DEFAULT_IMAGE,
  },
  render: (props) => {
    const eyebrow = props.eyebrow || '2026 REGULATORY COMPLIANT · DUBAI & RIYADH DESKS'
    const title = props.title || (props as any).headline || 'Form Your UAE & Saudi Company in 72 Hours'
    const titleHighlight = props.titleHighlight || '0% tax'
    const description = props.description || (props as any).subhead || 'Direct government gateway for 0% Corporate Tax structuring, 100% foreign ownership, instant banking pre-approval, and annual compliance ledger.'
    const primaryCta = props.primaryCta || (props as any).ctaText || 'Start Formation Quote'
    const primaryCtaLink = props.primaryCtaLink || (props as any).ctaLink || '#lead-form'
    const secondaryCta = props.secondaryCta || (props as any).secondaryCtaText || 'Speak on WhatsApp'
    const secondaryCtaLink = props.secondaryCtaLink || (props as any).secondaryCtaLink || 'https://wa.me/971500000000'
    const proofPointsRaw = props.proofPoints || (props as any).stats
    const proofPoints = Array.isArray(proofPointsRaw) && proofPointsRaw.length > 0
      ? proofPointsRaw.map((p: any) => ({ num: p.num || p.value || '', label: p.label || '' }))
      : [
          { num: '$140M+', label: 'Capital Protected' },
          { num: '99.2%', label: 'Bank Approval Rate' },
          { num: '72 Hours', label: 'License Delivery' },
          { num: '0%', label: 'Corporate Tax QFZP' },
        ]
    const heroImage = props.image || DEFAULT_IMAGE
    const sectionStyle = getSectionStyle(props)
    const sectionClassName = getSectionClassName(props, 'hero-section')
    const containerClass = getContainerClassName(props.maxWidth)

    return (
      <div className={sectionClassName} style={sectionStyle}>
        <PhotoHero image={heroImage}>
          <div
            className={`${containerClass} reveal`}
            style={{
              padding: 'clamp(var(--space-10), 4vw, var(--space-16)) 0',
              maxWidth: props.maxWidth === 'narrow' ? '780px' : props.maxWidth === 'full' ? '100%' : '900px',
            }}
          >
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h1 style={{ color: 'var(--white)' }}>
              <MarkedText text={title} highlight={titleHighlight} />
            </h1>
            {description && <p style={{ marginTop: 'var(--space-4)', fontSize: 18, color: 'rgba(255,255,255,.85)' }}>{description}</p>}
            <div className="flex-wrap" style={{ marginTop: 'var(--space-8)' }}>
              {primaryCta && (
                <ButtonLink href={primaryCtaLink || '#'} shimmer>
                  {primaryCta}
                </ButtonLink>
              )}
              {secondaryCta && (
                <ButtonLink href={secondaryCtaLink || '#'} variant="outline" style={{ borderColor: 'rgba(255,255,255,.7)', color: 'var(--white)' }}>
                  {secondaryCta}
                </ButtonLink>
              )}
            </div>
            {proofPoints?.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 'clamp(var(--space-4), 3vw, var(--space-8))',
                  marginTop: 'clamp(var(--space-8), 4vw, var(--space-12))',
                  flexWrap: 'wrap',
                }}
              >
                {proofPoints.map((p, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, color: 'var(--orange)' }}>{p.num}</div>
                    <div style={{ fontSize: 'clamp(11px, 1.2vw, 13px)', color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>{p.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PhotoHero>
      </div>
    )
  },
}
