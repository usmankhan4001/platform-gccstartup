import type { ComponentConfig } from '@puckeditor/core'
import { Building2, Landmark, ShieldCheck, PackageCheck, IdCard, RefreshCw, Briefcase, type LucideIcon } from 'lucide-react'
import { Eyebrow } from '@/components/ui'

export type ServicesGridProps = {
  eyebrow: string
  title: string
  description: string
  services: Array<{ icon: string; title: string; description: string; linkText: string; url: string }>
}

const ICONS: Record<string, LucideIcon> = {
  'company-registration': Building2,
  'bank-account': Landmark,
  'nominee-ubo': ShieldCheck,
  'shelf-company': PackageCheck,
  'tax-residency': IdCard,
  'annual-renewals': RefreshCw,
}

const ICON_OPTIONS = [
  { label: 'Company registration', value: 'company-registration' },
  { label: 'Bank account', value: 'bank-account' },
  { label: 'Nominee UBO', value: 'nominee-ubo' },
  { label: 'Shelf company', value: 'shelf-company' },
  { label: 'Tax residency', value: 'tax-residency' },
  { label: 'Annual renewals', value: 'annual-renewals' },
]

export const ServicesGrid: ComponentConfig<ServicesGridProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
    services: {
      type: 'array',
      arrayFields: {
        icon: { type: 'select', options: ICON_OPTIONS },
        title: { type: 'text' },
        description: { type: 'textarea' },
        linkText: { type: 'text' },
        url: { type: 'text' },
      },
    },
  },
  defaultProps: { eyebrow: 'What we do', title: '', description: '', services: [] },
  render: ({ eyebrow = 'Full-Spectrum Corporate Solutions', title = 'Everything Required to Scale Across GCC', description = 'From single-shareholder Freezone setups to Nominee holdings and Regional Headquarters.', services = [] }) => {
    const list = Array.isArray(services) && services.length > 0
      ? services
      : [
          {
            icon: 'Briefcase',
            title: 'Freezone & Mainland Formation',
            description: '100% foreign ownership company registration across Dubai, Abu Dhabi, IFZA, Meydan, and RAKEZ in 72 hours.',
            linkText: 'Explore packages →',
            url: '/pricing',
          },
          {
            icon: 'Landmark',
            title: 'Tier-1 Corporate Banking',
            description: 'Guaranteed introductions and document curation for Emirates NBD, Wio Bank, Mashreq Neo, and FAB corporate accounts.',
            linkText: 'Test banking odds →',
            url: '/tools/banking-odds',
          },
          {
            icon: 'Shield',
            title: 'Nominee UBO & Asset Privacy',
            description: 'Compliant Nominee Director & Shareholder structures safeguarding ultimate beneficial owner privacy.',
            linkText: 'Check privacy rules →',
            url: '/tools/ubo-privacy',
          },
          {
            icon: 'FileText',
            title: '0% QFZP Corporate Tax Structuring',
            description: 'Qualifying Free Zone Person structuring to legally eliminate the 9% UAE corporate tax liability.',
            linkText: 'Calculate tax savings →',
            url: '/tools/tax-calculator',
          },
          {
            icon: 'CreditCard',
            title: 'Residency Visas & Emirates ID',
            description: 'VIP medical typing, biometrics escort, and 2-year Golden or Green Visa processing for founders and families.',
            linkText: 'Estimate visa costs →',
            url: '/tools/visa-estimator',
          },
          {
            icon: 'Calendar',
            title: 'Annual Compliance Ledger',
            description: 'Automated 60/30/7-day renewal notifications for Trade Licenses, UBO registers, and FTA Corporate Tax filings.',
            linkText: 'View compliance calendar →',
            url: '/tools/compliance-calendar',
          },
        ]

    return (
      <section className="section" id="services">
        <div className="wrap">
          <div className="reveal max-w-lg" style={{ marginBottom: 'var(--space-12)' }}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2>{title}</h2>
            {description && <p style={{ marginTop: 'var(--space-3)' }}>{description}</p>}
          </div>
          <div className="grid-3">
            {list.map((s, i) => {
              const Icon = ICONS[s.icon] ?? Briefcase
              return (
                <div className="card tile reveal" key={i} style={{ ['--tile-accent' as string]: 'var(--blue)', ['--tile-accent-lt' as string]: 'var(--blue-lt)' }}>
                  <span className="tile-icon">
                    <Icon size={22} strokeWidth={1.75} aria-hidden />
                  </span>
                  <h3 style={{ marginTop: 'var(--space-4)' }}>{s.title}</h3>
                  <p style={{ marginTop: 'var(--space-2)' }}>{s.description}</p>
                  {s.linkText && (
                    <a href={s.url} className="link" style={{ display: 'inline-block', marginTop: 'var(--space-3)', fontWeight: 700 }}>
                      {s.linkText}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  },
}
