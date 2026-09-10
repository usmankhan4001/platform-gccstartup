import { publicPublicationFilter } from '@/lib/publication'

// These stubs preserve the original function signatures and types. There is no
// `countries` table in @gccstartup/db yet, so there is nothing to query — call
// sites fall back to the static catalogue in components/site/content/countries.ts
// while these return []. Replace the bodies with Drizzle queries once the table
// is migrated.

export type CountrySummary = {
  id: string
  name: string
  slug: string
  flag: string | null
  region: string | null
  tax: string | null
  timeline: string | null
  from_price: string | null
  headline: string | null
  intro: string | null
  facts: Array<{ label: string; value: string }> | null
}

/** Resolves a list of country UUIDs (published only) into full country records. */
export async function getCountriesByIds(_ids: (string | null | undefined)[]): Promise<CountrySummary[]> {
  return []
}

/** All published countries with the fields the programmatic pages need, sorted by name. */
export async function getAllCountries(): Promise<CountrySummary[]> {
  return []
}

/** Convenience maps for name/slug lookups over a country list. */
export function countryNameById(countries: CountrySummary[], id: string | null | undefined): string | null {
  if (!id) return null
  return countries.find((c) => c.id === id)?.name ?? null
}

export function countryBySlug(countries: CountrySummary[], slug: string | null | undefined): CountrySummary | null {
  if (!slug) return null
  return countries.find((c) => c.slug === slug) ?? null
}
