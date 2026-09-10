import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSiteSettings } from '@/lib/directus'
import { ConversionBand, HubHero, HubPage, SectionHeader, styles } from '@/components/public-hubs/PublicHub'
import { getAllCountries } from '@/lib/programmatic/countries'
import { staticCountrySummaries } from '@/components/site/content'

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

export default async function JurisdictionsHubPage() {
  const [settings, liveCountries] = await Promise.all([getSiteSettings(), getAllCountries()])
  // Sourced from the same static catalogue that backs the /[slug] jurisdiction guides,
  // so every card here links to a page that actually exists.
  const countries = liveCountries.length > 0 ? liveCountries : staticCountrySummaries()
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
