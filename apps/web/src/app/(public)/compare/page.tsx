import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSiteSettings } from '@/lib/directus'
import { ConversionBand, EmptyState, HubHero, HubPage, SectionHeader, styles } from '@/components/public-hubs/PublicHub'

export const metadata: Metadata = {
  title: 'Jurisdiction Comparisons & Head-to-Head Guides',
  description: 'Compare company formation jurisdictions head-to-head: UAE vs Singapore, Singapore vs Hong Kong, Bahrain vs UAE, Ireland vs UK on tax, speed & banking.',
  alternates: { canonical: '/compare' },
}

const TYPE_LABEL: Record<string, string> = {
  'company-formation': 'Company formation',
  tax: 'Tax & Compliance',
  banking: 'Corporate Banking',
}

const DEFAULT_COMPARISONS = [
  { id: '1', slug: 'uae-freezone-vs-mainland', headline: 'UAE Freezone vs. Mainland Incorporation', intro: 'Compare 100% foreign ownership, local UAE market access, office lease requirements, and 0% QFZP tax rules.', comparison_type: 'company-formation', compare_rows: [1, 2, 3, 4, 5] },
  { id: '2', slug: 'uae-vs-saudi-arabia', headline: 'UAE Freezone vs. Saudi Arabia (MISA / RHQ)', intro: 'Detailed breakdown comparing 0% corporate tax holding in Dubai vs access to government procurement in Riyadh.', comparison_type: 'tax', compare_rows: [1, 2, 3, 4, 5] },
  { id: '3', slug: 'uae-vs-singapore', headline: 'Dubai (UAE) vs. Singapore', intro: 'Comparing global trade hubs on corporate tax rates, banking turnaround, venture funding, and founder visas.', comparison_type: 'banking', compare_rows: [1, 2, 3, 4, 5] },
  { id: '4', slug: 'hong-kong-vs-singapore', headline: 'Hong Kong vs. Singapore', intro: 'Evaluating Asia Pacific hubs for cross-border ecommerce, mainland China trade, and territorial tax exemptions.', comparison_type: 'company-formation', compare_rows: [1, 2, 3, 4, 5] },
]

export default async function CompareHubPage() {
  const settings = await getSiteSettings()
  const visible = DEFAULT_COMPARISONS
  const canonicalUrl = `${(settings.site_url || 'https://gccstartup.com').replace(/\/$/, '')}/compare`

  return (
    <HubPage>
      <HubHero
        eyebrow="Comparisons"
        title="Side-by-side jurisdiction decisions, grounded in operating facts."
        description="Headline tax rates do not tell the whole story. Compare cost, timeline, banking ease, ownership requirements, and ongoing compliance between two jurisdictions."
        activeStage="jurisdiction"
        secondaryHref="/jurisdictions"
        secondaryLabel="Browse country guides"
        canonicalUrl={canonicalUrl}
      />

      <section className={styles.section} aria-labelledby="comparisons-list-title">
        <div className="wrap">
          <SectionHeader
            eyebrow="Published comparisons"
            title="Head-to-head comparisons"
            description="Direct side-by-side analysis for founders choosing between the two most common options for their profile."
            id="comparisons-list-title"
          />
          <div className={styles.grid}>
            {visible.map((cmp) => {
              const typeText = TYPE_LABEL[cmp.comparison_type] || 'Comparison'
              return (
                <div key={cmp.id} className={styles.card}>
                  <div className={styles.cardTopline}>
                    <span className="badge">{typeText}</span>
                  </div>
                  <h3 style={{ marginTop: 12 }}>{cmp.headline}</h3>
                  <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{cmp.intro}</p>
                  <div className={styles.cardFooter} style={{ marginTop: 20 }}>
                    <Link href="/#lead-form" className={styles.arrowLink}>
                      <span>Request detailed comparison</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <ConversionBand
        title="Need a custom comparison for your business model?"
        description="Our senior advisors evaluate your customers, revenue scale, and banking requirements to recommend the optimal setup."
        primaryHref="/#lead-form"
        primaryLabel="Schedule advisor consultation"
        secondaryHref="/tools/jurisdiction-quiz"
        secondaryLabel="Take 5-question suitability quiz"
      />
    </HubPage>
  )
}