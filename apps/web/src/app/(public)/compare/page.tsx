import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSiteSettings } from '@/lib/directus'
import { ConversionBand, HubHero, HubPage, SectionHeader, styles } from '@/components/public-hubs/PublicHub'
import { staticComparisonSummaries } from '@/components/site/content'

export const metadata: Metadata = {
  title: 'Jurisdiction Comparisons & Head-to-Head Guides',
  description: 'Compare company formation jurisdictions head-to-head: UAE vs Singapore, Singapore vs Hong Kong, Bahrain vs UAE, Ireland vs UK on tax, speed & banking.',
  alternates: { canonical: '/compare' },
}

export default async function CompareHubPage() {
  const settings = await getSiteSettings()
  const visible = staticComparisonSummaries()
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
            {visible.map((cmp) => (
              <div key={cmp.id} className={styles.card}>
                <div className={styles.cardTopline}>
                  <span className="badge">{cmp.typeLabel}</span>
                  <span className={styles.metaPill}>{cmp.rowCount} data points</span>
                </div>
                <h3 style={{ marginTop: 12 }}>{cmp.headline}</h3>
                <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{cmp.intro}</p>
                <div className={styles.cardFooter} style={{ marginTop: 20 }}>
                  <Link href={`/compare/${cmp.slug}`} className={styles.arrowLink}>
                    <span>Read the full comparison</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
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