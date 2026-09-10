import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPricingTierBySlug, getSiteSettings } from '@/lib/directus'
import { buildMetadata } from '@/lib/seo'
import { buildHreflangAlternates } from '@/lib/seo-alternates'
import { RenderPage } from '@/puck/RenderPage'
import { extractBlocksByType } from '@/puck/extractBlocksByType'
import { FaqJsonLd } from '@/components/seo/FaqJsonLd'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { RelatedLinks } from '@/components/seo/RelatedLinks'
import { PageCta } from '@/components/PageCta'
import { staticPricingTier } from '@/components/site/content'

/** Live record first; static catalogue when the pricing table has no row for the slug. */
async function loadTier(slug: string) {
  const live = await getPricingTierBySlug(slug)
  return live ?? staticPricingTier(slug)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [tier, settings] = await Promise.all([loadTier(slug), getSiteSettings()])
  if (!tier) return {}
  const metadata = buildMetadata(tier, tier.name, settings, `/pricing/${slug}`)
  if (settings.site_url) {
    const translatedLocales = Object.keys(tier.translations ?? {})
    metadata.alternates = { ...metadata.alternates, languages: buildHreflangAlternates(settings.site_url, `/pricing/${slug}`, translatedLocales) }
  }
  return metadata
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [tier, settings] = await Promise.all([loadTier(slug), getSiteSettings()])
  if (!tier) notFound()

  const url = `${(settings.site_url || '').replace(/\/$/, '')}/pricing/${tier.slug}`
  const faqForJsonLd = extractBlocksByType(tier.blocks, 'Faq').flatMap((f) => f.faqs ?? [])

  return (
    <>
      <FaqJsonLd faq={faqForJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: settings.site_url || '/' },
          { name: 'Pricing', url: `${(settings.site_url || '').replace(/\/$/, '')}/#pricing` },
          { name: tier.name, url },
        ]}
      />
      <RenderPage data={tier.blocks ?? { content: [], root: {} }} />
      <RelatedLinks internalLinks={tier.internal_links} externalCitations={tier.external_citations} />
      <PageCta
        eyebrow={tier.tier_label || 'Get started'}
        headline={`Ready to move forward with ${tier.name}?`}
        description="Lock in this pricing — a specialist confirms next steps within 24 hours."
        source={`Pricing Page: ${tier.name}`}
        interest={tier.name}
      />
    </>
  )
}
