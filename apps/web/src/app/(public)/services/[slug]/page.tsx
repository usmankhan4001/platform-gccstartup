import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServiceBySlug, getSiteSettings } from '@/lib/directus'
import { buildMetadata } from '@/lib/seo'
import { buildHreflangAlternates } from '@/lib/seo-alternates'
import { RenderPage } from '@/puck/RenderPage'
import { extractBlocksByType } from '@/puck/extractBlocksByType'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { ServiceJsonLd } from '@/components/seo/ServiceJsonLd'
import { RelatedLinks } from '@/components/seo/RelatedLinks'
import { PageCta } from '@/components/PageCta'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [service, settings] = await Promise.all([getServiceBySlug(slug), getSiteSettings()])
  if (!service) return {}
  const metadata = buildMetadata(service, service.name, settings, `/services/${slug}`)
  if (settings.site_url) {
    const translatedLocales = Object.keys(service.translations ?? {})
    metadata.alternates = { ...metadata.alternates, languages: buildHreflangAlternates(settings.site_url, `/services/${slug}`, translatedLocales) }
  }
  return metadata
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [service, settings] = await Promise.all([getServiceBySlug(slug), getSiteSettings()])
  if (!service) notFound()

  const url = `${(settings.site_url || '').replace(/\/$/, '')}/services/${service.slug}`
  const faqForJsonLd = extractBlocksByType(service.blocks, 'Faq').flatMap((f) => f.faqs ?? [])

  return (
    <>
      <ServiceJsonLd name={service.name} description={service.seo_meta_description || service.intro} url={url} settings={settings} />
      <FaqJsonLd faq={faqForJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: settings.site_url || '/' },
          { name: 'Services', url: `${(settings.site_url || '').replace(/\/$/, '')}/#services` },
          { name: service.name, url },
        ]}
      />
      <RenderPage data={service.blocks ?? { content: [], root: {} }} />
      <RelatedLinks internalLinks={service.internal_links} externalCitations={service.external_citations} />
      <PageCta
        eyebrow="Get started"
        headline={`Ready to get ${service.name} sorted?`}
        description={`A specialist confirms exact costs and timeline for ${service.name} based on your situation — no obligation.`}
        source={`Service Page: ${service.name}`}
        interest={service.name}
      />
    </>
  )
}
