import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getAllGuides, getSiteSettings } from '@/lib/directus'
import { ConversionBand, EmptyState, HubHero, HubPage, SectionHeader, styles } from '@/components/public-hubs/PublicHub'
import { getAllCountries } from '@/lib/programmatic/countries'
import type { GuideItem } from '@/lib/programmatic/types'
import { staticGuides, staticCountrySummaries } from '@/components/site/content'

export const metadata: Metadata = {
  title: 'International Company Setup Guides & Knowledge Base',
  description: 'In-depth guides on company formation costs, offshore tax exemption rules, non-resident banking, nominee director laws, and tax residency certificates.',
  alternates: { canonical: '/guides' },
  openGraph: {
    title: 'International Company Setup Guides & Knowledge Base | GCC Startup',
    description: 'In-depth guides on company formation costs, offshore tax exemption rules, non-resident banking, nominee director laws, and tax residency certificates.',
    url: '/guides',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'International Company Setup Guides & Knowledge Base | GCC Startup',
    description: 'Cost breakdowns, banking notes, city guides and glossary terms for GCC and offshore formation.',
  },
}

const GUIDE_TYPE_LABEL: Record<GuideItem['guide_type'], string> = {
  cost: 'Cost',
  banking: 'Banking',
  glossary: 'Glossary',
  city: 'City',
}

const GUIDE_GROUP_ORDER: GuideItem['guide_type'][] = ['cost', 'banking', 'glossary', 'city']

const GUIDE_GROUP_TITLE: Record<GuideItem['guide_type'], string> = {
  cost: 'Cost guides',
  banking: 'Banking guides',
  glossary: 'Glossary',
  city: 'City guides',
}

const GUIDE_GROUP_DESCRIPTION: Record<GuideItem['guide_type'], string> = {
  cost: 'What formation actually costs — government fees, corporate tax and the setup timeline.',
  banking: 'What banks look at in each jurisdiction, and how the local facts shape account opening.',
  glossary: 'The terms used across jurisdiction, formation and banking discussions, defined plainly.',
  city: 'Specific setup and living notes for regional entrepreneur hubs.',
}

export default async function GuidesHubPage() {
  const [settings, liveGuides, liveCountries] = await Promise.all([
    getSiteSettings(),
    getAllGuides(),
    getAllCountries(),
  ])
  // Both tables are empty on a fresh install — fall back to the static library rather
  // than rendering the "library is updating" empty state.
  const visible = liveGuides.length > 0 ? liveGuides : staticGuides()
  const countries = liveCountries.length > 0 ? liveCountries : staticCountrySummaries()
  const countryBySlug = new Map(countries.map((c) => [c.slug, c.name]))
  const canonicalUrl = `${(settings.site_url || 'https://gccstartup.com').replace(/\/$/, '')}/guides`

  const byGroup: Record<GuideItem['guide_type'], GuideItem[]> = {
    cost: [],
    banking: [],
    glossary: [],
    city: [],
  }
  for (const g of visible) {
    const raw = g as unknown as GuideItem
    if (byGroup[raw.guide_type]) {
      byGroup[raw.guide_type].push(raw)
    }
  }

  return (
    <HubPage>
      <HubHero
        eyebrow="Guides"
        title="Reference notes for cross-border formation decisions."
        description="Factual, unhyped reference guides on company formation costs, banking realities, tax substance, and plain-English legal terminology."
        activeStage="operate"
        secondaryHref="/jurisdictions"
        secondaryLabel="Browse country guides"
        canonicalUrl={canonicalUrl}
      />

      {GUIDE_GROUP_ORDER.map((group) => {
        const items = byGroup[group]
        if (!items || items.length === 0) return null
        const title = GUIDE_GROUP_TITLE[group]
        const description = GUIDE_GROUP_DESCRIPTION[group]
        return (
          <section key={group} className={styles.section} aria-labelledby={`guide-group-${group}`}>
            <div className="wrap">
              <SectionHeader
                eyebrow={GUIDE_TYPE_LABEL[group]}
                title={title}
                description={description}
                titleId={`guide-group-${group}`}
              />
              <div className={styles.grid3}>
                {items.map((g) => {
                  const countryName = g.jurisdiction_slug ? countryBySlug.get(g.jurisdiction_slug) || g.jurisdiction_slug : null
                  return (
                    <Link key={g.id} href={`/guides/${g.slug}`} className={styles.cardLink}>
                      <div className={styles.cardTopline}>
                        <span>{countryName || GUIDE_TYPE_LABEL[g.guide_type]}</span>
                        <ArrowRight size={17} aria-hidden="true" />
                      </div>
                      <h3>{g.title}</h3>
                      <p>{g.intro || g.definition || `Read our comprehensive guide on ${g.title}.`}</p>
                      {g.faq && g.faq.length > 0 && (
                        <div className={styles.cardMeta}>
                          <span className={styles.metaPill}>{g.faq.length} FAQs answered</span>
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })}

      {visible.length === 0 && (
        <div className="wrap" style={{ padding: 'var(--space-12) 0' }}>
          <EmptyState
            title="Guides library is updating"
            description="Our reference guides are temporarily reloading. You can still reach out via our contact page to discuss your setup questions."
          />
        </div>
      )}

      <ConversionBand
        title="Have a specific question not covered in our guides?"
        description="Speak with an international structuring specialist to get answers tailored to your exact business activity."
      />
    </HubPage>
  )
}