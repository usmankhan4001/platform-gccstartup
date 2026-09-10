import type { Metadata } from 'next'
import { notFound, redirect, permanentRedirect } from 'next/navigation'
import { getCountryBySlug, getPageBySlug, getRedirect, getSiteSettings } from '@/lib/directus'
import { buildMetadata } from '@/lib/seo'
import { buildHreflangAlternates } from '@/lib/seo-alternates'
import { RenderPage } from '@/puck/RenderPage'
import { extractBlocksByType } from '@/puck/extractBlocksByType'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { WebPageJsonLd } from '@/components/seo/WebPageJsonLd'
import { RelatedLinks } from '@/components/seo/RelatedLinks'
import { PageCta } from '@/components/PageCta'
import { staticCountry } from '@/components/site/content'

// Single dynamic segment handling both `countries` and generic `pages` — kept as one
// route (rather than separate /[country] and /[slug] folders) because Next.js App Router
// does not allow two differently-named dynamic segments as siblings at the same level.
async function resolve(slug: string) {
  const country = await getCountryBySlug(slug)
  if (country) return { type: 'country' as const, item: country }
  const page = await getPageBySlug(slug)
  if (page) return { type: 'page' as const, item: page }
  // The `countries` table is unpopulated on a fresh install, which would 404 every
  // jurisdiction link in the header, footer and /jurisdictions hub. Fall back to the
  // static catalogue so those routes always render a real guide.
  const fallback = staticCountry(slug)
  if (fallback) return { type: 'country' as const, item: fallback }
  return null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [resolved, settings] = await Promise.all([resolve(slug), getSiteSettings()])
  if (!resolved) return {}
  const item = resolved.item
  const fallbackTitle = 'name' in item ? item.name : item.title
  const metadata = buildMetadata(item, fallbackTitle, settings, `/${slug}`)
  // Only country pages go through translate()/have per-locale content — the generic
  // Puck `pages` branch has no locale mechanism yet, so it gets no hreflang alternates.
  if (resolved.type === 'country' && settings.site_url) {
    const translatedLocales = Object.keys(resolved.item.translations ?? {})
    metadata.alternates = { ...metadata.alternates, languages: buildHreflangAlternates(settings.site_url, `/${slug}`, translatedLocales) }
  }
  return metadata
}

export default async function GenericSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [resolved, settings] = await Promise.all([resolve(slug), getSiteSettings()])
  if (!resolved) {
    // Checked only here — the fallback when nothing else matches — not on every
    // request, so a slow/unreachable Directus never blocks a normal page load.
    const redirectMatch = await getRedirect(`/${slug}`)
    if (redirectMatch) {
      if (redirectMatch.status_code === 301) permanentRedirect(redirectMatch.to_path)
      redirect(redirectMatch.to_path)
    }
    notFound()
  }

  if (resolved.type === 'country') {
    const country = resolved.item
    const url = `${(settings.site_url || '').replace(/\/$/, '')}/${country.slug}`
    const faqForJsonLd = extractBlocksByType(country.blocks, 'Faq').flatMap((f) => f.faqs ?? [])

    return (
      <>
        <FaqJsonLd faq={faqForJsonLd} />
        <BreadcrumbJsonLd
          items={[
            { name: 'Home', url: settings.site_url || '/' },
            { name: country.name, url },
          ]}
        />
        <RenderPage data={country.blocks ?? { content: [], root: {} }} />
        <RelatedLinks internalLinks={country.internal_links} externalCitations={country.external_citations} />
        <PageCta
          eyebrow={`Get started in ${country.name}`}
          headline={`Ready to register your company in ${country.name}?`}
          description={`Tell us a bit about your business — a specialist replies within 24 hours with your ${country.name} setup plan.`}
          source={`Country Page: ${country.name}`}
          interest={country.name}
        />
      </>
    )
  }

  const page = resolved.item
  const pageUrl = `${(settings.site_url || '').replace(/\/$/, '')}/${page.slug}`
  return (
    <div data-theme={page.theme}>
      <WebPageJsonLd
        title={page.title}
        description={page.aeo_llm_summary || page.seo_meta_description}
        url={pageUrl}
      />
      <BreadcrumbJsonLd items={[{ name: 'Home', url: settings.site_url || '/' }, { name: page.title, url: pageUrl }]} />
      <RenderPage data={page.blocks ?? { content: [], root: {} }} />
      <RelatedLinks internalLinks={page.internal_links} externalCitations={page.external_citations} />
    </div>
  )
}
