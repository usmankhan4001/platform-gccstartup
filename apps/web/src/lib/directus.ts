import { db } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { pages, posts, redirects, site_settings } from '@gccstartup/db'

export type SiteSettings = Record<string, any>
export type ContactRouteItem = Record<string, any>
export type CountryItem = Record<string, any>
export type LeadStatus = string
export type LeadPriority = 'low' | 'normal' | 'high' | 'urgent'
export type LeadItem = Record<string, any>
export type LeadActivityItem = Record<string, any>
export type LeadConsentItem = Record<string, any>
export type LeadStageHistoryItem = Record<string, any>
export type LeadTaskItem = Record<string, any>
export type DirectusUserSummary = Record<string, any>
export type EmailEventItem = Record<string, any>
export type EmailSyncJobItem = Record<string, any>
export type PuckData = { content: unknown[]; root: Record<string, unknown>; zones?: Record<string, unknown> }

export function directus() {
  return null
}

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'GCC Startup',
  site_tagline: 'UAE & Saudi Company Formation, 0% Tax Structuring & Corporate Banking',
  site_url: 'https://gccstartup.com',
  contact_email: 'consult@gccstartup.com',
  contact_phone: '+971 4 249 8555',
  whatsapp_number: '971500000000',
  hero_headline: 'Form Your UAE & Saudi Company in 72 Hours',
  hero_subhead: '0% Corporate Tax structuring, 100% foreign ownership, instant banking pre-approval, and end-to-end statutory compliance.',
}

const DEFAULT_HOME_PAGE = {
  id: 'page-home',
  title: 'GCC Startup — UAE & Saudi Company Formation',
  slug: 'home',
  theme: 'dark',
  status: 'published',
  blocks: {
    content: [
      {
        type: 'Hero',
        props: {
          eyebrow: '2026 REGULATORY COMPLIANT · DUBAI & RIYADH DESKS',
          headline: 'Form Your UAE & Saudi Company in 72 Hours',
          subhead: 'Direct government gateway for 0% Corporate Tax structuring, 100% foreign ownership, instant banking pre-approval, and annual compliance ledger.',
          ctaText: 'Start Formation Quote',
          ctaLink: '/#lead-form',
          secondaryCtaText: 'Speak on WhatsApp',
          secondaryCtaLink: 'https://wa.me/971500000000',
          stats: [
            { label: 'Capital Protected', value: '$140M+' },
            { label: 'Bank Approval Rate', value: '99.2%' },
            { label: 'License Delivery', value: '72 Hours' },
            { label: 'Corporate Tax', value: '0% QFZP' },
          ],
        },
      },
      {
        type: 'Ticker',
        props: {
          items: [
            '0% Corporate Tax (QFZP Qualified)',
            '100% Foreign Ownership Guaranteed',
            '72-Hour Express Trade License',
            'Dedicated Dubai & Riyadh Legal Desks',
            'Tier-1 UAE Corporate Banking Pre-Approved',
            'Full Nominee UBO Privacy Solutions',
          ],
        },
      },
      {
        type: 'ServicesGrid',
        props: {
          title: 'Full-Spectrum Corporate Solutions',
          subtitle: 'From single-shareholder Freezone setups to complex cross-border Nominee holdings and Regional Headquarters.',
        },
      },
      {
        type: 'JurisdictionsGrid',
        props: {
          title: 'Premier GCC Jurisdictions',
          subtitle: 'Compare authorized freezones, mainland registries, and offshore financial centers.',
        },
      },
      {
        type: 'ProcessSteps',
        props: {
          title: '4-Step Fast-Track Incorporation',
          subtitle: 'Zero physical presence required for initial security clearance and license issuance.',
        },
      },
      {
        type: 'InteractiveTools',
        props: {
          title: '10 Interactive Decision Engines',
          subtitle: 'Calculate your exact tax savings, determine Freezone suitability, and test banking odds in real-time.',
        },
      },
      {
        type: 'ComparisonTool',
        props: {
          title: 'Freezone vs. Mainland vs. Offshore',
          subtitle: 'Transparent statutory comparison across ownership, tax liability, visa quotas, and banking speed.',
        },
      },
      {
        type: 'PricingCards',
        props: {
          title: 'Transparent Formation Packages',
          subtitle: 'Fixed statutory fees with zero hidden renewal markups or surprise surcharges.',
        },
      },
      {
        type: 'Testimonials',
        props: {
          title: 'Trusted by Over 1,200+ International Founders',
          subtitle: 'Read verified incorporation case studies from global entrepreneurs.',
        },
      },
      {
        type: 'Faq',
        props: {
          title: 'Frequently Asked Questions',
          subtitle: 'Everything you need to know about UAE Corporate Tax, visas, and banking.',
        },
      },
      {
        type: 'LeadForm',
        props: {
          title: 'Receive Your Customized Formation Blueprint',
          subtitle: 'Our Dubai and Riyadh senior advisors will review your business model and dispatch a full cost breakdown within 15 minutes.',
        },
      },
      {
        type: 'GlobalCta',
        props: {
          headline: 'Ready to Launch Your GCC Entity?',
          subhead: 'Join 1,200+ international businesses structured for 0% tax efficiency in the UAE and Saudi Arabia.',
          buttonText: 'Schedule Advisor Call',
          buttonLink: '/#lead-form',
        },
      },
    ],
    root: {},
  },
}

export async function getPageBySlug(slug: string, _options?: { draft?: boolean }): Promise<any> {
  try {
    const rows = await db
      .select()
      .from(pages)
      .where(eq(pages.slug, slug))
      .limit(1)

    if (rows[0]) {
      return {
        ...rows[0],
        blocks: rows[0].blocks || { content: [], root: {} },
      }
    }
  } catch (err) {
    console.warn(`[db] getPageBySlug(${slug}) query failed, using fallback:`, err)
  }

  if (slug === 'home' || slug === '/') {
    return DEFAULT_HOME_PAGE
  }

  return null
}

export async function getPosts(): Promise<any[]> {
  try {
    const rows = await db
      .select()
      .from(posts)
      .limit(50)

    if (rows && rows.length > 0) return rows
  } catch (err) {
    console.warn('[db] getPosts() query failed:', err)
  }
  return [
    {
      id: 'post-1',
      title: 'UAE Corporate Tax Guide 2026: Qualifying Freezone Person (QFZP) Strategy',
      slug: 'uae-corporate-tax-guide-2026',
      excerpt: 'Comprehensive blueprint for navigating the 0% vs. 9% UAE corporate tax thresholds, qualifying activities, and de minimis revenue limits.',
      category: 'Tax Strategy',
      reading_time: 6,
      published_at: new Date().toISOString(),
      tags: [{ tag: 'UAE Tax' }, { tag: '0% QFZP' }, { tag: 'Freezone' }],
    },
    {
      id: 'post-2',
      title: 'Opening a UAE Corporate Bank Account in 2026: Fast-Track Compliance',
      slug: 'opening-uae-corporate-bank-account-2026',
      excerpt: 'How to secure Tier-1 digital and conventional UAE banking (Emirates NBD, Wio, Mashreq) without weeks of compliance delays.',
      category: 'Banking',
      reading_time: 8,
      published_at: new Date().toISOString(),
      tags: [{ tag: 'Corporate Banking' }, { tag: 'Wio Bank' }, { tag: 'UAE' }],
    },
    {
      id: 'post-3',
      title: 'Dubai Freezone vs. Mainland: Choosing the Optimal Trade License',
      slug: 'dubai-freezone-vs-mainland-comparison',
      excerpt: 'Detailed comparison of 100% foreign ownership, commercial tenancy, onshore trading rights, and statutory costs in Dubai.',
      category: 'Incorporation',
      reading_time: 5,
      published_at: new Date().toISOString(),
      tags: [{ tag: 'Dubai' }, { tag: 'Freezone' }, { tag: 'Mainland' }],
    },
  ]
}

export async function getPostBySlug(slug: string, _options?: { draft?: boolean }): Promise<any> {
  try {
    const rows = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1)

    if (rows[0]) return rows[0]
  } catch (err) {
    console.warn(`[db] getPostBySlug(${slug}) query failed:`, err)
  }
  const allPosts = await getPosts()
  const found = allPosts.find((p) => p.slug === slug)
  if (found) {
    return {
      ...found,
      content: `<p>Welcome to our comprehensive strategic guide on <strong>${found.title}</strong>.</p><p>For international entrepreneurs and enterprise founders looking to expand across the GCC, understanding regulatory frameworks, corporate tax rules, and local bank compliance requirements is fundamental to protecting capital and optimizing operations.</p><h3>Key Strategic Considerations</h3><p>Ensure that your trade license activity accurately mirrors your actual revenue streams, and maintain economic substance through physical or digital infrastructure within approved zones.</p>`,
      internal_links: [
        { label: 'Compare GCC Jurisdictions', url: '/compare' },
        { label: 'Calculate Tax Savings', url: '/tools/tax-calculator' },
      ],
      external_citations: [
        { title: 'UAE Federal Tax Authority (FTA)', url: 'https://tax.gov.ae' },
      ],
    }
  }
  return null
}

// No `countries` / `services` / `pricing_tiers` / `comparisons` / `business_models` /
// `guides` tables exist in @gccstartup/db yet, so these have nothing to query.
// Returning the empty value keeps the public site on the static catalogue fallbacks
// in components/site/content/* until the tables are migrated.

export async function getCountryBySlug(_slug: string): Promise<any> {
  return null
}

export async function getServiceBySlug(_slug: string): Promise<any> {
  return null
}

export async function getPricingTierBySlug(_slug: string): Promise<any> {
  return null
}

export async function getComparisonBySlug(_slug: string): Promise<any> {
  return null
}

export async function getBusinessModelBySlug(_slug: string): Promise<any> {
  return null
}

export async function getGuideBySlug(_slug: string): Promise<any> {
  return null
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await db
      .select()
      .from(site_settings)
      .where(eq(site_settings.id, 1))
      .limit(1)

    const row = rows[0]
    if (row) {
      // Live settings win, but a NULL column must not blank out a default.
      const live = Object.fromEntries(
        Object.entries(row).filter(([, value]) => value !== null && value !== undefined)
      )
      return { ...DEFAULT_SETTINGS, ...live }
    }
  } catch (err) {
    console.error('[db] getSiteSettings failed', err)
  }
  return DEFAULT_SETTINGS
}

export async function getAllComparisons(): Promise<any[]> {
  return []
}

export async function getAllBusinessModels(): Promise<any[]> {
  return []
}

export async function getAllGuides(): Promise<any[]> {
  return []
}

export async function getAllSitemapEntries(): Promise<any> {
  try {
    const [pageRows, postRows] = await Promise.all([
      db
        .select({ slug: pages.slug, seo_no_index: pages.seo_no_index, date_updated: pages.updated_at })
        .from(pages)
        .where(eq(pages.status, 'published')),
      db
        .select({ slug: posts.slug, seo_no_index: posts.seo_no_index, date_updated: posts.updated_at })
        .from(posts)
        .where(eq(posts.status, 'published')),
    ])

    // Only `pages` and `posts` have tables; the sitemap consumer treats every
    // other collection key as optional (`?.` / `?? []`).
    return { pages: pageRows, posts: postRows }
  } catch (err) {
    console.error('[db] getAllSitemapEntries failed', err)
    return {}
  }
}

// No `contact_routes` table exists yet; resolvePublicContact falls back to site settings.
export async function getPublicContactRoutes(): Promise<any[]> {
  return []
}

export async function getRedirect(slug: string): Promise<any> {
  try {
    const rows = await db
      .select()
      .from(redirects)
      .where(and(eq(redirects.source, slug), eq(redirects.enabled, true)))
      .limit(1)

    if (rows[0]) {
      // Call sites read `to_path` (Directus-era field name); the column is `destination`.
      return { ...rows[0], to_path: rows[0].destination }
    }
  } catch (err) {
    console.error('[db] getRedirect failed', err)
  }
  return null
}

export async function getPageById(id: string): Promise<any> {
  try {
    const rows = await db
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1)

    if (rows[0]) {
      return {
        ...rows[0],
        blocks: rows[0].blocks || { content: [], root: {} },
      }
    }
  } catch (err) {
    console.error('[db] getPageById failed', err)
  }
  return null
}

export function logDirectusError(error: any, context: string): void {
  console.error(`[${context}]`, error)
}

export function describeDirectusError(error: any): string {
  return error?.message || 'Unknown error'
}