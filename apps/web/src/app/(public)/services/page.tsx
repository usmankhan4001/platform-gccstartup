import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, Landmark, RefreshCw, ShieldCheck, Check } from 'lucide-react'
import { getSiteSettings } from '@/lib/directus'
import { ConversionBand, EmptyState, HubHero, HubPage, SectionHeader, styles } from '@/components/public-hubs/PublicHub'

export const metadata: Metadata = {
  title: 'International Company Formation Services',
  description: 'Explore full-scope corporate services: Company registration, remote business bank account setup, nominee UBO privacy, shelf companies, tax residency & renewals.',
  alternates: { canonical: '/services' },
}

const serviceLanes = [
  { icon: Building2, title: 'Form the entity', text: 'Registration, constitutional documents, licensing, and a practical setup sequence in UAE, HK, Singapore, Bahrain & Ireland.' },
  { icon: Landmark, title: 'Activate banking', text: 'Preparation for bank selection, KYC evidence, multi-currency IBANs, and remote account-opening approvals.' },
  { icon: ShieldCheck, title: 'Structure ownership', text: 'Support for beneficial ownership, nominee director/shareholder arrangements, and legal privacy protection.' },
  { icon: RefreshCw, title: 'Maintain compliance', text: 'Annual license renewals, statutory returns, registered agent services, and recurring filing obligations.' },
]

const DEFAULT_SERVICES = [
  {
    id: 'company-registration',
    name: 'Company Registration',
    slug: 'company-registration',
    headline: 'Fast-track corporate registration across UAE freezones and mainland registries.',
    intro: 'End-to-end statutory formation with 0% corporate tax structuring, 100% foreign ownership, and zero physical presence requirement for initial filing.',
    features: ['Trade Name Clearance & Security Approval', 'Memorandum & Articles of Association (MoA)', 'Commercial Trade License Issuance', 'Establishment Card & Corporate Dossier'],
  },
  {
    id: 'bank-account',
    name: 'Corporate Banking Setup',
    slug: 'bank-account',
    headline: 'Guaranteed introductions and pre-approval with Tier-1 UAE & international banks.',
    intro: 'Preparation of business case studies, KYC dossier curation, and direct submission to dedicated corporate relationship managers.',
    features: ['Wio Bank, Emirates NBD, Mashreq NeoBiz, FAB', 'Multi-currency IBANs (AED, USD, EUR, GBP)', 'Zero rejection guarantee with pre-screening', 'Full payment gateway integration support'],
  },
  {
    id: 'nominee-ubo',
    name: 'Nominee UBO & Privacy Holding',
    slug: 'nominee-ubo',
    headline: 'Institutional nominee shareholder and director privacy structures.',
    intro: 'Maintain beneficial privacy through regulated corporate nominees backed by irrevocable declarations of trust and general powers of attorney.',
    features: ['Corporate Nominee Shareholder', 'Nominee Director with General PoA', 'Declaration of Trust & Indemnity Agreement', 'Undated share transfer & resignation deeds'],
  },
  {
    id: 'shelf-company',
    name: 'Aged Shelf Companies',
    slug: 'shelf-company',
    headline: 'Vintage entities ready for immediate contract bidding and banking.',
    intro: 'Acquire clean, aged UAE and offshore corporate entities with established incorporation dates and spotless compliance history.',
    features: ['2 to 5+ years verifiable history', 'Clean balance sheet & zero liabilities', 'Same-day ownership transfer execution', 'Established vendor & banking profiles'],
  },
  {
    id: 'tax-residency',
    name: 'Golden Visa & Tax Residency',
    slug: 'tax-residency',
    headline: '10-Year UAE Golden Visas and Tax Residency Certificates (TRC).',
    intro: 'Secure long-term UAE residency for founders, executives, and families to formalize zero personal income tax status.',
    features: ['10-Year Renewable Golden Visa Processing', 'Investor / Partner Visa & Emirates ID', 'Medical test VIP escort & biometric fast-track', 'Ministry of Finance Tax Residency Certificate'],
  },
  {
    id: 'annual-renewals',
    name: 'Annual Renewals & Compliance',
    slug: 'annual-renewals',
    headline: 'Automated 60d/30d/7d compliance ledger and corporate retainer.',
    intro: 'Never miss a statutory filing deadline, trade license expiration, or corporate tax return with our managed renewal service.',
    features: ['Trade License Renewal & Lease Extensions', 'Corporate Tax Return Filing (FTA Gateway)', 'Economic Substance (ESR) & UBO Register updates', 'Anti-Money Laundering (AML) Compliance Audits'],
  },
]

export default async function ServicesHubPage() {
  const settings = await getSiteSettings()
  const services = DEFAULT_SERVICES
  const canonicalUrl = `${(settings.site_url || 'https://gccstartup.com').replace(/\/$/, '')}/services`

  return (
    <HubPage>
      <HubHero
        eyebrow="Services"
        title="Build the formation scope before you buy the package."
        description="Company registration is one step in a wider operating plan. Compare the legal, banking, ownership, and compliance work your business may need, then request a scoped recommendation."
        activeStage="launch"
        secondaryHref="/jurisdictions"
        secondaryLabel="Compare jurisdictions"
        canonicalUrl={canonicalUrl}
      />

      <section className={styles.section} aria-labelledby="service-lanes-title">
        <div className="wrap">
          <SectionHeader
            eyebrow="Core operational lanes"
            title="Every pillar required to establish a compliant cross-border business."
            description="Our desks coordinate legal formation, multi-currency banking, nominee protection, and tax filings in parallel."
            id="service-lanes-title"
          />

          <div className={styles.criteriaGrid}>
            {serviceLanes.map(({ icon: Icon, title, text }) => (
              <div key={title} className={styles.criteriaCard}>
                <div style={{ display: 'inline-flex', padding: 8, borderRadius: 8, background: 'var(--blue-lt)', color: 'var(--blue)', marginBottom: 12 }}>
                  <Icon size={20} aria-hidden />
                </div>
                <h4>{title}</h4>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt} aria-labelledby="services-list-title">
        <div className="wrap">
          <SectionHeader
            eyebrow="Full service catalog"
            title="Explore our specialized formation and legal offerings."
            description="All services include dedicated Dubai Desk or Riyadh Desk case management."
            id="services-list-title"
          />

          <div className={styles.grid}>
            {services.map((service) => (
              <article key={service.id} className={styles.serviceCard}>
                <div className={styles.serviceHeader}>
                  <h3>{service.name}</h3>
                </div>
                <p className={styles.serviceHeadline}>{service.headline}</p>
                <p className={styles.serviceIntro}>{service.intro}</p>

                <div className={styles.featureList} style={{ marginTop: 16 }}>
                  <ul>
                    {service.features.map((feat, idx) => (
                      <li key={idx}>
                        <Check size={14} className={styles.checkIcon} aria-hidden />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.cardFooter} style={{ marginTop: 24 }}>
                  <Link href="/#lead-form" className={styles.arrowLink}>
                    <span>Inquire about this service</span>
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ConversionBand
        title="Ready to structure your business model?"
        description="Share your requirements with our legal advisory team for a full statutory fee breakdown and timeline projection."
        primaryHref="/#lead-form"
        primaryLabel="Schedule advisor consultation"
        secondaryHref="/pricing"
        secondaryLabel="View formation packages"
      />
    </HubPage>
  )
}
