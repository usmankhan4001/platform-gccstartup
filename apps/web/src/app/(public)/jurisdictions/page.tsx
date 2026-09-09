import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSiteSettings } from '@/lib/directus'
import { ConversionBand, EmptyState, HubHero, HubPage, SectionHeader, styles } from '@/components/public-hubs/PublicHub'

export const metadata: Metadata = {
  title: 'Compare Company Formation Jurisdictions',
  description: 'Compare 15+ company formation jurisdictions: UAE, Bahrain, Hong Kong, Singapore, Ireland, BVI & Cayman on corporate tax, setup speed, banking & cost.',
  alternates: { canonical: '/jurisdictions' },
}

const criteria = [
  ['01', 'Owner and residency position', 'Where owners live and manage the company can matter as much as where the entity is incorporated.'],
  ['02', 'Customer and payment flows', 'Markets, currencies, payment processors, and counterparties influence practical jurisdiction fit.'],
  ['03', 'Banking and KYC readiness', 'Bank appetite depends on activity, ownership, substance, expected transactions, and supporting evidence.'],
  ['04', 'Tax and reporting context', 'Headline rates are only one factor; substance, management, treaties, and filings need case-specific review.'],
  ['05', 'Setup and recurring cost', 'Compare the complete first-year and annual operating cost, not registration in isolation.'],
  ['06', 'Timing and maintenance', 'Formation speed matters, but so do renewals, accounting, audit, filings, and local requirements.'],
]

const DEFAULT_JURISDICTIONS = [
  { id: 'uae', name: 'United Arab Emirates', slug: 'uae', flag: '🇦🇪', region: 'Middle East', tax: '0% QFZP / 9%', timeline: '48–72 Hours', from_price: '$4,800', headline: 'The global standard for 0% tax structuring and fintech.', intro: 'UAE Freezones offer 100% foreign ownership, 0% personal tax, and zero capital repatriation restrictions.' },
  { id: 'saudi-arabia', name: 'Saudi Arabia', slug: 'saudi-arabia', flag: '🇸🇦', region: 'Middle East', tax: '20% Corporate / 0% Personal', timeline: '5–7 Days', from_price: '$8,500', headline: 'The largest economy in the GCC with massive Vision 2030 scale.', intro: 'Access government tenders, regional headquarters (RHQ) tax incentives, and the largest domestic market.' },
  { id: 'bahrain', name: 'Bahrain', slug: 'bahrain', flag: '🇧🇭', region: 'Middle East', tax: '0% Corporate', timeline: '3–5 Days', from_price: '$4,200', headline: 'Cost-effective gateway with 0% corporate tax and direct Saudi causeway access.', intro: 'Low operating overhead, 100% foreign ownership in most activities, and fast-track banking.' },
  { id: 'oman', name: 'Oman', slug: 'oman', flag: '🇴🇲', region: 'Middle East', tax: '15% / Freezone 0%', timeline: '4–6 Days', from_price: '$4,900', headline: 'Strategic maritime logistics hub with US-Oman Free Trade Agreement.', intro: 'Direct access to Indian Ocean trade corridors and dedicated Special Economic Zones.' },
  { id: 'qatar', name: 'Qatar', slug: 'qatar', flag: '🇶🇦', region: 'Middle East', tax: '10% / QFC 0%', timeline: '5–7 Days', from_price: '$6,800', headline: 'Ultra-high purchasing power market anchored by Qatar Financial Centre.', intro: 'World-class legal infrastructure based on English Common Law in the QFC.' },
  { id: 'singapore', name: 'Singapore', slug: 'singapore', flag: '🇸🇬', region: 'Asia Pacific', tax: '17% (Partial Exemption)', timeline: '1–2 Days', from_price: '$3,800', headline: 'Asia’s premier financial hub with strong double-tax treaty network.', intro: 'Unrivaled global banking reputation and startup venture capital ecosystem.' },
  { id: 'hongkong', name: 'Hong Kong', slug: 'hongkong', flag: '🇭🇰', region: 'Asia Pacific', tax: '8.25% / 16.5% (Territorial 0%)', timeline: '2–3 Days', from_price: '$3,200', headline: 'Premier gateway for global trading, ecommerce, and China connectivity.', intro: 'Territorial tax system where offshore profits are exempt from Hong Kong tax.' },
]

export default async function JurisdictionsHubPage() {
  const settings = await getSiteSettings()
  const countries = DEFAULT_JURISDICTIONS
  const canonicalUrl = `${(settings.site_url || 'https://gccstartup.com').replace(/\/$/, '')}/jurisdictions`

  return (
    <HubPage>
      <HubHero
        eyebrow="Jurisdictions"
        title="Choose where the company works, not just where it is cheap."
        description="Compare jurisdictions through the realities that affect founders after incorporation: management, banking, tax context, customer access, credibility, and annual maintenance."
        activeStage="jurisdiction"
        secondaryHref="/services"
        secondaryLabel="Explore formation services"
        canonicalUrl={canonicalUrl}
      />

      <section className={styles.section} aria-labelledby="jurisdictions-list-title">
        <div className="wrap">
          <SectionHeader
            eyebrow="Available options"
            title="Active jurisdictions supported by our team."
            description="Explore tax regimes, setup speed, minimum requirements, and formation structures across the GCC, Asia, and Europe."
            id="jurisdictions-list-title"
          />

          <div className={styles.grid}>
            {countries.map((country: any) => (
              <article key={country.id} className={styles.countryCard}>
                <div className={styles.countryHeader}>
                  <div className={styles.flagBadge}>
                    <span style={{ fontSize: 24 }}>{country.flag}</span>
                    <div>
                      <h3>{country.name}</h3>
                      <span className={styles.region}>{country.region}</span>
                    </div>
                  </div>
                  {country.from_price && <span className={styles.priceTag}>from {country.from_price}</span>}
                </div>

                <div className={styles.metrics}>
                  <div className={styles.metric}>
                    <span>Tax Regime</span>
                    <strong>{country.tax || 'Case-specific'}</strong>
                  </div>
                  <div className={styles.metric}>
                    <span>Turnaround</span>
                    <strong>{country.timeline || 'Fast-track'}</strong>
                  </div>
                </div>

                <p className={styles.countryIntro}>{country.headline || country.intro}</p>

                <div className={styles.cardFooter}>
                  <Link href={`/${country.slug}`} className={styles.arrowLink}>
                    <span>View jurisdiction guide</span>
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt} aria-labelledby="criteria-title">
        <div className="wrap">
          <SectionHeader
            eyebrow="Evaluation framework"
            title="Six factors that determine jurisdiction fit."
            description="We review client requirements against operational realities before recommending a registration route."
            id="criteria-title"
          />

          <div className={styles.criteriaGrid}>
            {criteria.map(([num, title, text]) => (
              <div key={num} className={styles.criteriaCard}>
                <span className={styles.criteriaNum}>{num}</span>
                <h4>{title}</h4>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ConversionBand
        title="Need guidance comparing two jurisdictions?"
        description="Share your business model, customer locations, and banking requirements. Our senior advisors will map the optimal structure."
        primaryHref="/#lead-form"
        primaryLabel="Request a structure review"
        secondaryHref="/compare"
        secondaryLabel="View comparison matrix"
      />
    </HubPage>
  )
}
