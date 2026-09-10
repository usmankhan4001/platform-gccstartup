import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { getSiteSettings } from '@/lib/directus'
import { ConversionBand, HubHero, HubPage, SectionHeader, styles } from '@/components/public-hubs/PublicHub'

export const metadata: Metadata = {
  title: 'Company Formation Pricing & Packages',
  description: 'Compare transparent company formation pricing across UAE, Hong Kong, Singapore & offshore. Self as UBO, Nominee UBO & Shelf Company packages from $4,800.',
  alternates: { canonical: '/pricing' },
}

const DEFAULT_TIERS = [
  {
    id: 'self-ubo',
    name: 'Self as UBO',
    slug: 'self-ubo',
    tier_label: 'Standard Freezone',
    featured: false,
    price: '$4,800',
    price_note: 'All-inclusive first year statutory & visa cost',
    intro: 'Ideal for single founders and international startups establishing 100% owned operational entities in the UAE or GCC.',
    features: [
      '100% Foreign Ownership Certificate',
      '0% Corporate Tax structuring (QFZP guidance)',
      '1 Investor / Partner Visa included',
      'Dedicated Dubai Desk Case Officer',
      'Tier-1 Corporate Bank Introduction',
    ],
    who_for: 'Global founders, digital agencies, consultants, software engineers, and ecommerce operators.',
  },
  {
    id: 'nominee-ubo',
    name: 'Nominee UBO Service',
    slug: 'nominee-ubo',
    tier_label: 'Confidential Holding',
    featured: true,
    price: '$12,500',
    price_note: 'Annual nominee holding & power of attorney',
    intro: 'Full privacy structuring using institutional corporate nominee directors and shareholders with signed declaration of trust.',
    features: [
      'Corporate Nominee Shareholder',
      'Nominee Director with General Power of Attorney',
      'Irrevocable Declaration of Trust (DoT)',
      'Pre-signed Indemnity & Resignation Letters',
      'DIFC/ADGM compliant privacy framework',
    ],
    who_for: 'High-net-worth individuals, crypto executives, international asset protection, and confidential holdings.',
  },
  {
    id: 'shelf-company',
    name: 'Aged Shelf Company',
    slug: 'shelf-company',
    tier_label: 'Instant Vintage Entity',
    featured: false,
    price: '$11,000',
    price_note: 'Aged, never-traded entity \u2014 price scales with incorporation date',
    intro: 'Pre-registered corporate entities with established incorporation history, no trading record and no liabilities, transferable within days.',
    features: [
      '1–4+ Years Verifiable Incorporation History',
      'Never Traded \u2014 No Liabilities, Warranted In Writing',
      'Ownership Transfer In 3–5 Days',
      'Immediate Tender & Contract Eligibility',
      'Full Due Diligence Pack Before You Commit',
    ],
    who_for: 'Contractors bidding on enterprise/government tenders requiring multi-year company history.',
  },
]

export default async function PricingHubPage() {
  const settings = await getSiteSettings()
  const tiers = DEFAULT_TIERS
  const canonicalUrl = `${(settings.site_url || 'https://gccstartup.com').replace(/\/$/, '')}/pricing`

  return (
    <HubPage>
      <HubHero
        eyebrow="Pricing"
        title="Compare the full operating cost, not the formation headline."
        description="Package price depends on jurisdiction, ownership, activity, banking, residency, speed, and ongoing compliance. Use the published tiers to understand the model, then request a situation-specific scope."
        activeStage="structure"
        secondaryHref="/tools/tax-calculator"
        secondaryLabel="Calculate Tax Savings"
        canonicalUrl={canonicalUrl}
      />

      <section className={styles.section} aria-labelledby="pricing-tiers-title">
        <div className="wrap">
          <SectionHeader
            eyebrow="Published packages"
            title="Choose the ownership and support model"
            description="All packages include statutory government fee pass-through, formal formation filings, and corporate governance documentation."
            id="pricing-tiers-title"
          />

          <div className={styles.grid}>
            {tiers.map((tier) => (
              <article key={tier.id} className={tier.featured ? styles.pricingCardFeatured : styles.pricingCard}>
                {tier.featured && <span className={styles.featuredBadge}>Most Popular</span>}
                <div className={styles.pricingHeader}>
                  <span className={styles.tierLabel}>{tier.tier_label}</span>
                  <h3>{tier.name}</h3>
                  <div className={styles.priceRow}>
                    <strong className={styles.price}>{tier.price}</strong>
                    <span className={styles.priceNote}>{tier.price_note}</span>
                  </div>
                </div>

                <p className={styles.tierIntro}>{tier.intro}</p>

                <div className={styles.featureList}>
                  <h4>What is included:</h4>
                  <ul>
                    {tier.features.map((feature, idx) => (
                      <li key={idx}>
                        <Check size={16} className={styles.checkIcon} aria-hidden />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.whoFor}>
                  <strong>Best suited for:</strong>
                  <p>{tier.who_for}</p>
                </div>

                <div className={styles.cardFooter} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                  <Link href={`/pricing/${tier.slug}`} className={tier.featured ? 'btn btn-primary' : 'btn btn-outline'}>
                    <span>See what&rsquo;s included</span>
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                  <Link href="/#lead-form" className={styles.arrowLink}>
                    <span>Request a customised quote</span>
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ConversionBand
        title="Need an itemized breakdown for your exact jurisdiction?"
        description="Our advisors calculate exact government fees, immigration quotas, and nominee structures with zero hidden markups."
        primaryHref="/#lead-form"
        primaryLabel="Request complete price breakdown"
        secondaryHref="/tools"
        secondaryLabel="Explore 10 interactive calculators"
      />
    </HubPage>
  )
}
