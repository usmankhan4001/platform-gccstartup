import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBusinessModelBySlug, getSiteSettings } from '@/lib/directus'
import { buildMetadata } from '@/lib/seo'
import { RenderPage } from '@/puck/RenderPage'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { RelatedLinks } from '@/components/seo/RelatedLinks'
import { PageCta } from '@/components/PageCta'
import { styles } from '@/components/public-hubs/PublicHub'
import { getAllCountries } from '@/lib/programmatic/countries'
import type { BusinessModelItem, FaqPair } from '@/lib/programmatic/types'
import { derivePersonaIntro } from '@/lib/programmatic/derive'
import { staticBusinessModel, staticCountrySummaries } from '@/components/site/content'

export const dynamic = 'force-dynamic'

/** Live record first, then the static catalogue. */
async function loadModel(slug: string) {
  const live = await getBusinessModelBySlug(slug)
  return live ?? staticBusinessModel(slug)
}

/** Country list for the "jurisdictions worth shortlisting" cards, falling back to the
 * static catalogue while the countries table is unpopulated. */
async function loadCountries() {
  const live = await getAllCountries()
  return live.length > 0 ? live : staticCountrySummaries()
}

function itemList(value: BusinessModelItem['pain_points']): string[] {
  return Array.isArray(value) ? value.map((entry) => (typeof entry?.item === 'string' ? entry.item : '')).filter(Boolean) : []
}

function faqPairs(model: BusinessModelItem): FaqPair[] {
  return Array.isArray(model.faq) ? model.faq.filter((f) => f.q?.trim()) : []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [model, settings] = await Promise.all([loadModel(slug), getSiteSettings()])
  if (!model) return {}

  const item = model as unknown as BusinessModelItem
  const seoItem = { ...item, seo_meta_description: item.seo_meta_description || item.intro }
  return buildMetadata(seoItem, item.name, settings, `/business/${slug}`)
}

export default async function BusinessModelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [raw, settings, countries] = await Promise.all([loadModel(slug), getSiteSettings(), loadCountries()])
  if (!raw) notFound()

  const model = raw as unknown as BusinessModelItem
  const painPoints = itemList(model.pain_points)
  const keywords = itemList(model.keywords)
  const recommended = itemList(model.recommended_jurisdictions)
  const recommendedCountries = countries.filter((c) => recommended.includes(c.slug))
  const faqs = faqPairs(model)
  const url = `${(settings.site_url || '').replace(/\/$/, '')}/business/${model.slug}`

  const intro =
    model.aeo_llm_summary ||
    model.intro ||
    (recommendedCountries[0]
      ? derivePersonaIntro({ name: model.name, intro: model.intro || '' }, recommendedCountries[0])
      : `A jurisdiction-fit guide for founders building a ${model.name}.`)

  return (
    <>
      <FaqJsonLd faq={faqs} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: settings.site_url || '/' },
          { name: 'Business Models', url: `${(settings.site_url || '').replace(/\/$/, '')}/business` },
          { name: model.name, url },
        ]}
      />

      <section className="section" aria-labelledby="model-title">
        <div className="wrap-narrow">
          {model.icon && (
            <span style={{ fontSize: 32 }} aria-hidden="true">{model.icon}</span>
          )}
          <h1 id="model-title" style={{ marginTop: model.icon ? 'var(--space-3)' : undefined }}>{model.name}</h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{intro}</p>
        </div>
      </section>

      {painPoints.length > 0 && (
        <section className="section section-alt" aria-labelledby="pain-points-title">
          <div className="wrap-narrow">
            <h2 id="pain-points-title">Where a {model.name} usually gets stuck</h2>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingLeft: 0, listStyle: 'none' }}>
              {painPoints.map((point, index) => (
                <li key={index} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <span aria-hidden="true" style={{ color: 'var(--orange)' }}>—</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {keywords.length > 0 && (
        <section className="section" aria-labelledby="keywords-title">
          <div className="wrap-narrow">
            <h2 id="keywords-title">Keywords that describe this model</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {keywords.map((keyword) => (
                <span key={keyword} className="badge badge-info">{keyword}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {recommendedCountries.length > 0 && (
        <section className="section section-alt" aria-labelledby="recommended-title">
          <div className="wrap">
            <h2 id="recommended-title">Jurisdictions worth shortlisting</h2>
            <div className={styles.grid3}>
              {recommendedCountries.map((country) => (
                <Link key={country.id} href={`/${country.slug}`} className={styles.cardLink}>
                  <div className={styles.cardTopline}>
                    <span>{country.region || 'Jurisdiction'}</span>
                    <span style={{ fontSize: 24 }} aria-hidden="true">{country.flag || '--'}</span>
                  </div>
                  <h3>{country.name}</h3>
                  <p>{country.intro || country.headline || `Review the company formation route for ${country.name}.`}</p>
                  <div className={styles.cardMeta}>
                    {country.tax && <span className={styles.metaPill}>{country.tax}</span>}
                    {country.timeline && <span className={styles.metaPill}>{country.timeline}</span>}
                    {country.from_price && <span className={styles.metaPill}>From {country.from_price}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="section" aria-labelledby="faq-title">
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

      {model.blocks && (model.blocks as any).content && (
        <RenderPage data={model.blocks as any} />
      )}

      <RelatedLinks internalLinks={model.internal_links} externalCitations={model.external_citations} />
      <PageCta
        eyebrow={model.icon || 'Get started'}
        headline={`Ready to set up your ${model.name}?`}
        description={`A specialist confirms the exact costs, timeline and banking route for a ${model.name} in your shortlisted jurisdictions.`}
        source={`Business Model Page: ${model.name}`}
        interest={model.name}
      />
    </>
  )
}