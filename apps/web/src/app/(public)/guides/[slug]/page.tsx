import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCountryBySlug, getGuideBySlug, getSiteSettings } from '@/lib/directus'
import { buildMetadata } from '@/lib/seo'
import { RenderPage } from '@/puck/RenderPage'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { RelatedLinks } from '@/components/seo/RelatedLinks'
import { PageCta } from '@/components/PageCta'
import type { FaqPair, GuideItem } from '@/lib/programmatic/types'
import { deriveCostGuideRows, type DerivableJurisdiction } from '@/lib/programmatic/derive'

export const dynamic = 'force-dynamic'

const GUIDE_TYPE_LABEL: Record<GuideItem['guide_type'], string> = {
  cost: 'Cost guide',
  banking: 'Banking guide',
  glossary: 'Glossary',
  city: 'City guide',
}

function faqPairs(guide: GuideItem): FaqPair[] {
  return Array.isArray(guide.faq) ? guide.faq.filter((f) => f.q?.trim()) : []
}

async function load(slug: string) {
  const guide = (await getGuideBySlug(slug)) as unknown as GuideItem | null
  if (!guide) return null

  const country = guide.jurisdiction_slug ? await getCountryBySlug(guide.jurisdiction_slug) : null
  const derivable: DerivableJurisdiction | null = country
    ? { name: country.name, tax: country.tax, timeline: country.timeline, from_price: country.from_price, facts: country.facts }
    : null

  return { guide, country, derivable }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [data, settings] = await Promise.all([load(slug), getSiteSettings()])
  if (!data) return {}

  const { guide, country } = data
  const seoItem = { ...guide, seo_meta_description: guide.seo_meta_description || guide.intro }
  return buildMetadata(seoItem, guide.title, settings, `/guides/${slug}`)
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [data, settings] = await Promise.all([load(slug), getSiteSettings()])
  if (!data) notFound()

  const { guide, country, derivable } = data
  const faqs = faqPairs(guide)
  const url = `${(settings.site_url || '').replace(/\/$/, '')}/guides/${guide.slug}`
  const isGlossary = guide.guide_type === 'glossary'
  const showDerivedTable = !isGlossary && (guide.guide_type === 'cost' || guide.guide_type === 'banking') && derivable !== null
  const derivedRows = showDerivedTable && derivable ? deriveCostGuideRows(derivable) : []

  return (
    <>
      <FaqJsonLd faq={faqs} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: settings.site_url || '/' },
          { name: 'Guides', url: `${(settings.site_url || '').replace(/\/$/, '')}/guides` },
          { name: guide.title, url },
        ]}
      />

      <section className="section" aria-labelledby="guide-title">
        <div className="wrap-narrow">
          <span className="eyebrow">{GUIDE_TYPE_LABEL[guide.guide_type]}{country ? ` · ${country.name}` : ''}</span>
          <h1 id="guide-title">{guide.title}</h1>

          {isGlossary && guide.term && (
            <p style={{ fontSize: 20, fontWeight: 600, margin: 'var(--space-4) 0 var(--space-2)' }}>{guide.term}</p>
          )}
          {isGlossary && guide.definition && (
            <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{guide.definition}</p>
          )}

          {!isGlossary && (guide.aeo_llm_summary || guide.intro) && (
            <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              {guide.aeo_llm_summary || guide.intro}
            </p>
          )}
        </div>
      </section>

      {showDerivedTable && (
        <section className="section section-alt" aria-labelledby="guide-table-title">
          <div className="wrap-narrow">
            <h2 id="guide-table-title">
              {guide.guide_type === 'cost' ? `What setup costs in ${derivable?.name}` : `${derivable?.name} at a glance`}
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {derivedRows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" style={{ textAlign: 'left', width: '40%' }}>{row.label}</th>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className={showDerivedTable ? 'section' : 'section section-alt'} aria-labelledby="faq-title">
          <div className="wrap-narrow">
            <h2 id="faq-title">Frequently asked questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {faqs.map((entry, index) => (
                <article key={index}>
                  <h3 style={{ fontSize: 17, marginBottom: 'var(--space-2)' }}>{entry.q}</h3>
                  {entry.a && <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{entry.a}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {guide.blocks && typeof guide.blocks === 'object' && (
        <RenderPage data={guide.blocks as any} />
      )}

      <RelatedLinks internalLinks={guide.internal_links} externalCitations={guide.external_citations} />
      <PageCta
        eyebrow={country ? country.name : 'Get started'}
        headline={isGlossary ? `Still unsure about ${guide.term || 'this term'}?` : `Ready to act on this guide?`}
        description={`A specialist confirms current costs, timelines and banking details for your situation — no obligation.`}
        source={`Guide Page: ${guide.title}`}
        interest={guide.title}
      />
    </>
  )
}