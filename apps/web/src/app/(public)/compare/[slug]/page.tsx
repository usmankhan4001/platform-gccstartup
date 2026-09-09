import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getComparisonBySlug, getSiteSettings } from '@/lib/directus'
import { buildMetadata } from '@/lib/seo'
import { RenderPage } from '@/puck/RenderPage'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { RelatedLinks } from '@/components/seo/RelatedLinks'
import { PageCta } from '@/components/PageCta'
import { getCountriesByIds } from '@/lib/programmatic/countries'
import type { ComparisonItem, FaqPair } from '@/lib/programmatic/types'
import { deriveComparisonIntro, deriveComparisonRows, type DerivableJurisdiction } from '@/lib/programmatic/derive'

export const dynamic = 'force-dynamic'

const TYPE_LABEL: Record<ComparisonItem['comparison_type'], string> = {
  'company-formation': 'Company formation comparison',
  tax: 'Tax comparison',
  banking: 'Banking comparison',
}

const VERDICT_LABEL: Record<ComparisonItem['verdict'][number]['option'], string> = {
  a: 'Choose A',
  b: 'Choose B',
  depends: 'It depends',
}

function asFaqPairs(comparison: ComparisonItem): FaqPair[] {
  const faq = Array.isArray(comparison.faq) ? comparison.faq.filter((f) => f.q?.trim()) : []
  if (faq.length > 0) return faq
  const questions = Array.isArray(comparison.aeo_target_questions)
    ? comparison.aeo_target_questions
        .map((entry) => (typeof entry?.item === 'string' ? entry.item.trim() : ''))
        .filter(Boolean)
    : []
  return questions.map((q) => ({ q, a: '' }))
}

async function load(slug: string) {
  const comparison = (await getComparisonBySlug(slug)) as unknown as ComparisonItem | null
  if (!comparison) return null

  const countries = await getCountriesByIds([comparison.jurisdiction_a, comparison.jurisdiction_b])
  const a = countries.find((c) => c.id === comparison.jurisdiction_a) ?? null
  const b = countries.find((c) => c.id === comparison.jurisdiction_b) ?? null

  const viewA: DerivableJurisdiction = a
    ? { name: a.name, tax: a.tax, timeline: a.timeline, from_price: a.from_price, facts: a.facts }
    : { name: 'Jurisdiction A' }
  const viewB: DerivableJurisdiction = b
    ? { name: b.name, tax: b.tax, timeline: b.timeline, from_price: b.from_price, facts: b.facts }
    : { name: 'Jurisdiction B' }

  return { comparison, viewA, viewB }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [data, settings] = await Promise.all([load(slug), getSiteSettings()])
  if (!data) return {}

  const { comparison, viewA, viewB } = data
  const fallbackTitle = `${viewA.name} vs ${viewB.name} Company Formation | GCC Startup`
  const seoItem = { ...comparison, seo_meta_description: comparison.seo_meta_description || comparison.intro }
  return buildMetadata(seoItem, fallbackTitle, settings, `/compare/${slug}`)
}

export default async function CompareDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [data, settings] = await Promise.all([load(slug), getSiteSettings()])
  if (!data) notFound()

  const { comparison, viewA, viewB } = data
  const title = comparison.headline || `${viewA.name} vs ${viewB.name}`
  const intro = comparison.aeo_llm_summary || comparison.intro || deriveComparisonIntro(viewA, viewB, comparison.comparison_type)
  const rows =
    Array.isArray(comparison.compare_rows) && comparison.compare_rows.length > 0
      ? comparison.compare_rows
      : deriveComparisonRows(viewA, viewB, comparison.comparison_type)
  const faqPairs = asFaqPairs(comparison)
  const faqForJsonLd = faqPairs.filter((f) => f.a?.trim())
  const verdicts = Array.isArray(comparison.verdict) ? comparison.verdict : []
  const url = `${(settings.site_url || '').replace(/\/$/, '')}/compare/${comparison.slug}`

  return (
    <>
      <FaqJsonLd faq={faqForJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: settings.site_url || '/' },
          { name: 'Compare', url: `${(settings.site_url || '').replace(/\/$/, '')}/compare` },
          { name: title, url },
        ]}
      />

      <section className="section" aria-labelledby="comparison-title">
        <div className="wrap-narrow">
          <span className="eyebrow">{TYPE_LABEL[comparison.comparison_type]}</span>
          <h1 id="comparison-title">{title}</h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{intro}</p>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="comparison-table-title">
        <div className="wrap-narrow">
          <h2 id="comparison-table-title">{viewA.name} vs {viewB.name}: side by side</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: 'left' }}></th>
                <th scope="col" style={{ textAlign: 'left' }}>{viewA.name}</th>
                <th scope="col" style={{ textAlign: 'left' }}>{viewB.name}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" style={{ textAlign: 'left' }}>{row.label}</th>
                  <td>{row.a}</td>
                  <td>{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {verdicts.length > 0 && (
        <section className="section" aria-labelledby="verdict-title">
          <div className="wrap-narrow">
            <h2 id="verdict-title">Which one fits your situation?</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {verdicts.map((verdict, index) => (
                <article key={index} className="card" style={{ padding: 'var(--space-5)' }}>
                  <span className="badge badge-info">{VERDICT_LABEL[verdict.option]}</span>
                  <h3 style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>{verdict.condition}</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{verdict.reasoning}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {faqPairs.length > 0 && (
        <section className="section section-alt" aria-labelledby="faq-title">
          <div className="wrap-narrow">
            <h2 id="faq-title">Frequently asked questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {faqPairs.map((entry, index) => (
                <article key={index}>
                  <h3 style={{ fontSize: 17, marginBottom: 'var(--space-2)' }}>{entry.q}</h3>
                  {entry.a && <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{entry.a}</p>}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {comparison.blocks && (comparison.blocks as any).content && (
        <RenderPage data={comparison.blocks as any} />
      )}

      <RelatedLinks internalLinks={comparison.internal_links} externalCitations={comparison.external_citations} />
      <PageCta
        eyebrow={`${viewA.name} vs ${viewB.name}`}
        headline={`Not sure which jurisdiction fits?`}
        description={`A specialist compares your situation against both ${viewA.name} and ${viewB.name} and confirms exact costs and timelines.`}
        source={`Comparison Page: ${viewA.name} vs ${viewB.name}`}
        interest={`${viewA.name} vs ${viewB.name}`}
      />
    </>
  )
}