import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getAllBusinessModels, getSiteSettings } from '@/lib/directus'
import { ConversionBand, EmptyState, HubHero, HubPage, SectionHeader, styles } from '@/components/public-hubs/PublicHub'
import type { BusinessModelItem } from '@/lib/programmatic/types'
import { staticBusinessModels } from '@/components/site/content'

export const metadata: Metadata = {
  title: 'Company Formation by Business Model',
  description: 'Find the optimal company structure and tax setup for E-Commerce, SaaS, Amazon FBA, Consultants, Digital Agencies, and High-Income Freelancers.',
  alternates: { canonical: '/business' },
  openGraph: {
    title: 'Company Formation by Business Model | GCC Startup',
    description: 'Find the optimal company structure and tax setup for E-Commerce, SaaS, Amazon FBA, Consultants, Digital Agencies, and High-Income Freelancers.',
    url: '/business',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Company Formation by Business Model | GCC Startup',
    description: 'Model-by-model jurisdiction fit: banking appetite, tax exposure, setup cost and timing per business model.',
  },
}

function itemList(value: BusinessModelItem['pain_points']): string[] {
  return Array.isArray(value) ? value.map((entry) => (typeof entry?.item === 'string' ? entry.item : '')).filter(Boolean) : []
}

export default async function BusinessModelsHubPage() {
  const [settings, models] = await Promise.all([getSiteSettings(), getAllBusinessModels()])
  // The `business_models` table is empty on a fresh install, which would render the
  // "guides are updating" empty state instead of the model library.
  const visible = models.length > 0 ? models : staticBusinessModels()
  const canonicalUrl = `${(settings.site_url || 'https://gccstartup.com').replace(/\/$/, '')}/business`

  return (
    <HubPage>
      <HubHero
        eyebrow="Business Models"
        title="Match the model to the jurisdiction, not the other way around."
        description="Each business model carries its own banking, tax and setup reality. These guides connect the model to the jurisdictions where it actually works."
        activeStage="structure"
        secondaryHref="/compare"
        secondaryLabel="Browse jurisdiction comparisons"
        canonicalUrl={canonicalUrl}
      />

      <section className={styles.section} aria-labelledby="models-list-title">
        <div className="wrap">
          <SectionHeader
            eyebrow="Target models"
            title="Choose your business model"
            description="Explore setup roadmaps designed for your exact commercial activity and international revenue flows."
            titleId="models-list-title"
          />
          {visible.length > 0 ? (
            <div className={styles.grid3}>
              {visible.map((raw) => {
                const model = raw as unknown as BusinessModelItem
                const painPoints = itemList(model.pain_points)
                return (
                  <Link key={model.id} href={`/business/${model.slug}`} className={styles.cardLink}>
                    <div className={styles.cardTopline}>
                      <span>{model.icon ? `${model.icon} ` : ''}Business Model</span>
                      <ArrowRight size={17} aria-hidden="true" />
                    </div>
                    <h3>{model.name}</h3>
                    <p>{model.intro || `Review jurisdiction and banking fit for ${model.name} businesses.`}</p>
                    {painPoints.length > 0 && (
                      <div className={styles.cardMeta}>
                        <span className={styles.metaPill}>{painPoints.length} pain points solved</span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="Business model guides are updating"
              description="Our model-specific playbooks are temporarily reloading. You can still reach out via our contact page to discuss your specific business activity."
            />
          )}
        </div>
      </section>

      <ConversionBand
        title="Need a custom setup for your business model?"
        description="Tell us how you invoice, where your customers are based, and your preferred banking currencies. We will map the ideal structure."
      />
    </HubPage>
  )
}