import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, Calculator, CheckCircle2 } from 'lucide-react'
import { getSiteSettings } from '@/lib/directus'
import { ConversionBand, EmptyState, HubHero, HubPage, SectionHeader, styles } from '@/components/public-hubs/PublicHub'

export const metadata: Metadata = {
  title: 'Free Tools, Calculators & Guides',
  description: 'Explore free international business tools: Setup Cost Estimator, Jurisdiction Comparison Matrix, Jurisdiction Matcher Quiz, and expert guides.',
  alternates: { canonical: '/resources' },
}

const DEFAULT_POSTS = [
  { id: '1', title: '2026 UAE Corporate Tax Guide for Freezone Entities', slug: 'uae-corporate-tax-guide-2026', excerpt: 'Comprehensive analysis of Qualifying Free Zone Person (QFZP) 0% rules, qualifying income definitions, and de minimis revenue thresholds.', category: 'Tax & Compliance', reading_time: 7, published_at: '2026-03-01' },
  { id: '2', title: 'UAE Corporate Bank Account Opening Blueprint', slug: 'uae-bank-account-opening-guide', excerpt: 'Step-by-step checklist to achieve Tier-1 UAE corporate bank pre-approval with Emirates NBD, Mashreq NeoBiz, and Wio Bank.', category: 'Banking', reading_time: 5, published_at: '2026-02-20' },
  { id: '3', title: 'Nominee UBO & Confidential Ownership Frameworks in DIFC / ADGM', slug: 'nominee-ubo-privacy-framework', excerpt: 'How international founders protect beneficial ownership legally using regulated corporate nominee shareholders and directors.', category: 'Privacy & Structuring', reading_time: 8, published_at: '2026-02-15' },
]

export default async function ResourcesHubPage() {
  const settings = await getSiteSettings()
  const posts = DEFAULT_POSTS
  const canonicalUrl = `${(settings.site_url || 'https://gccstartup.com').replace(/\/$/, '')}/resources`

  return (
    <HubPage>
      <HubHero
        eyebrow="Resources"
        title="Make formation decisions with a working brief, not a browser full of claims."
        description="Use our published guides to identify assumptions, compare options, and prepare the facts a specialist will need. Resources are informational and do not replace legal, tax, or financial advice."
        activeStage="operate"
        secondaryHref="/tools"
        secondaryLabel="Explore 10 interactive calculators"
        canonicalUrl={canonicalUrl}
      />

      <section className={styles.section} aria-labelledby="resource-path-title">
        <div className="wrap">
          <SectionHeader
            eyebrow="Decision Paths"
            title="Start with the decision currently blocking your formation plan"
            description="Explore our interactive calculators, comparative matrices, and legal playbooks."
            id="resource-path-title"
          />

          <div className={styles.grid}>
            <article className={styles.resourceCard}>
              <div className={styles.resourceIcon}><Calculator size={24} /></div>
              <h3>10 Interactive Decision Tools</h3>
              <p>Calculate UAE corporate tax liability, assess 0% QFZP eligibility, estimate visa fees, and evaluate banking approval odds in real time.</p>
              <Link href="/tools" className={styles.arrowLink}>
                <span>Launch Interactive Tools</span>
                <ArrowRight size={16} />
              </Link>
            </article>

            <article className={styles.resourceCard}>
              <div className={styles.resourceIcon}><BookOpen size={24} /></div>
              <h3>Jurisdiction Guides &amp; Matrix</h3>
              <p>Compare UAE Freezones, Saudi MISA, Bahrain, Oman, Qatar, Singapore, and Hong Kong on minimum capital, tax rates, and ownership rules.</p>
              <Link href="/compare" className={styles.arrowLink}>
                <span>Open Comparison Matrix</span>
                <ArrowRight size={16} />
              </Link>
            </article>

            <article className={styles.resourceCard}>
              <div className={styles.resourceIcon}><CheckCircle2 size={24} /></div>
              <h3>2026 Compliance Calendar</h3>
              <p>Keep track of statutory deadlines for Federal Tax Authority (FTA) Corporate Tax filing, VAT submissions, and Economic Substance (ESR) notifications.</p>
              <Link href="/tools/compliance-calendar" className={styles.arrowLink}>
                <span>View Compliance Calendar</span>
                <ArrowRight size={16} />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt} aria-labelledby="latest-playbooks-title">
        <div className="wrap">
          <SectionHeader
            eyebrow="Editorial Playbooks"
            title="Latest Research &amp; Regulatory Analysis"
            description="Written by senior corporate structuring specialists from our Dubai and Riyadh desks."
            id="latest-playbooks-title"
          />

          <div className={styles.grid}>
            {posts.map((post) => (
              <article key={post.id} className={styles.postCard}>
                <div className={styles.postMeta}>
                  <span className={styles.category}>{post.category}</span>
                  <span className={styles.readingTime}>{post.reading_time} min read</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className={styles.cardFooter}>
                  <Link href={`/blog/${post.slug}`} className={styles.arrowLink}>
                    <span>Read playbook</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ConversionBand
        title="Need assistance modeling your cross-border setup?"
        description="Book a confidential 30-minute consultation with our senior structuring advisory team."
        primaryHref="/#lead-form"
        primaryLabel="Schedule free consultation"
        secondaryHref="/tools"
        secondaryLabel="Calculate tax savings"
      />
    </HubPage>
  )
}
