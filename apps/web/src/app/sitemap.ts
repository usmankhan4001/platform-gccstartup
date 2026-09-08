import type { MetadataRoute } from 'next'
import { getAllSitemapEntries, getSiteSettings } from '@/lib/directus'

// Without this, Next.js treats sitemap.ts as static and tries to prerender it at
// `next build` time — which calls Directus at the build-time placeholder URL and
// crashes the whole build with ECONNREFUSED (no live Directus during an isolated
// Docker build stage). Forcing dynamic also means the sitemap always reflects
// current published content instead of a snapshot frozen at the last deploy.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, entries] = await Promise.all([getSiteSettings(), getAllSitemapEntries()])
  const base = (settings.site_url || 'https://gccstartup.com').replace(/\/$/, '')

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/services`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/jurisdictions`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/pricing`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/compare`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/business`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/guides`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/resources`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/book-consultation`, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${base}/philippines-partners`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/cookies`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const fromPages = (entries as any).pages
    ?.filter((p: any) => !p.seo_no_index && p.slug !== 'home' && !['privacy', 'cookies', 'terms'].includes(p.slug))
    ?.map((p: any) => ({ url: `${base}/${p.slug}`, lastModified: p.date_updated, changeFrequency: 'monthly' as const, priority: 0.7 })) ?? []

  const fromCountries = (entries as any).countries
    ?.filter((c: any) => !c.seo_no_index)
    ?.map((c: any) => ({ url: `${base}/${c.slug}`, lastModified: c.date_updated, changeFrequency: 'monthly' as const, priority: 0.9 })) ?? []

  const fromServices = (entries as any).services
    ?.filter((s: any) => !s.seo_no_index)
    ?.map((s: any) => ({ url: `${base}/services/${s.slug}`, lastModified: s.date_updated, changeFrequency: 'monthly' as const, priority: 0.9 })) ?? []

  const fromPricing = (entries as any).pricingTiers
    ?.filter((t: any) => !t.seo_no_index)
    ?.map((t: any) => ({ url: `${base}/pricing/${t.slug}`, lastModified: t.date_updated, changeFrequency: 'monthly' as const, priority: 0.8 })) ?? []

  const fromComparisons = (entries as any).comparisons
    ?.filter((c: any) => !c.seo_no_index)
    ?.map((c: any) => ({ url: `${base}/compare/${c.slug}`, lastModified: c.date_updated, changeFrequency: 'monthly' as const, priority: 0.8 })) ?? []

  const fromBusinessModels = (entries as any).businessModels
    ?.filter((b: any) => !b.seo_no_index)
    ?.map((b: any) => ({ url: `${base}/business/${b.slug}`, lastModified: b.date_updated, changeFrequency: 'monthly' as const, priority: 0.7 })) ?? []

  const fromGuides = (entries as any).guides
    ?.filter((g: any) => !g.seo_no_index)
    ?.map((g: any) => ({ url: `${base}/guides/${g.slug}`, lastModified: g.date_updated, changeFrequency: 'monthly' as const, priority: 0.7 })) ?? []

  const fromPosts = (entries as any).posts
    ?.filter((p: any) => !p.seo_no_index)
    ?.map((p: any) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.date_updated, changeFrequency: 'yearly' as const, priority: 0.5 })) ?? []

  return [...staticRoutes, ...fromCountries, ...fromServices, ...fromPricing, ...fromComparisons, ...fromBusinessModels, ...fromGuides, ...fromPages, ...fromPosts]
}
