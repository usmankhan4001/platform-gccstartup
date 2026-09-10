// Shared shape helpers for the static public-site content catalogue.
//
// Every programmatic content record (country / service / pricing tier / comparison /
// guide / business model) carries the same SEO + AEO tail. The static fallback records
// in this folder have to expose that whole tail because `buildMetadata()` and the
// JSON-LD helpers read the fields positionally — a missing key would render an empty
// <title> rather than fail loudly, so the defaults are centralised here instead of
// being repeated across six data files.

export type SeoTail = {
  aeo_llm_summary: string | null
  aeo_target_questions: Array<{ item: string }> | null
  internal_links: Array<{ label: string; url: string }>
  external_citations: Array<{ title: string; url: string }>
  seo_meta_title: string | null
  seo_meta_description: string | null
  seo_canonical_url: string | null
  seo_no_index: boolean
  seo_og_image: string | null
  seo_og_title: string | null
  seo_og_description: string | null
}

export type Fact = { label: string; value: string }
export type FaqEntry = { q: string; a: string }
export type PuckBlocks = { content: Array<{ type: string; props: Record<string, unknown> }>; root: Record<string, unknown> }

export function seoTail(overrides: Partial<SeoTail> = {}): SeoTail {
  return {
    aeo_llm_summary: null,
    aeo_target_questions: null,
    internal_links: [],
    external_citations: [],
    seo_meta_title: null,
    seo_meta_description: null,
    seo_canonical_url: null,
    seo_no_index: false,
    seo_og_image: null,
    seo_og_title: null,
    seo_og_description: null,
    ...overrides,
  }
}

/** Status/audit columns the rendering layer reads but static content has no real
 * value for. Frozen date so static pages don't churn their `date_updated` on
 * every request (which would make output non-deterministic between renders). */
const STATIC_TIMESTAMP = '2026-01-01T00:00:00.000Z'

export function recordTail() {
  return {
    date_created: STATIC_TIMESTAMP,
    date_updated: STATIC_TIMESTAMP,
    status: 'published' as const,
    translations: {},
  }
}

/** The FTA / authority citations most GCC pages share. */
export const CITATION_FTA = { title: 'UAE Federal Tax Authority (FTA)', url: 'https://tax.gov.ae' }
export const CITATION_MOE = { title: 'UAE Ministry of Economy', url: 'https://www.moec.gov.ae' }
export const CITATION_MISA = { title: 'Saudi Ministry of Investment (MISA)', url: 'https://misa.gov.sa' }
