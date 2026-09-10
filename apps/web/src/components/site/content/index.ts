// Static public-site content catalogue.
//
// Every getter in `lib/directus.ts` for the programmatic collections (countries,
// services, pricing tiers, comparisons, guides, business models) currently returns
// null or an empty array, because those tables are not populated on a fresh install.
// The route handlers under app/(public) fall back to this catalogue so the public site
// always renders real, on-brand content instead of a 404 or an empty-state shell.
//
// When the tables are populated, the database wins — every call site tries the live
// getter first and only reaches for these records when it comes back empty.

export { staticCountry, staticCountrySummaries, staticCountrySlugs } from './countries'
export { staticService, staticServiceSummaries } from './services'
export { staticPricingTier, staticPricingTierSummaries } from './pricing-tiers'
export { staticComparison, staticComparisons, staticComparisonSummaries } from './comparisons'
export { staticGuide, staticGuides, GUIDE_TYPE_LABEL } from './guides'
export { staticBusinessModel, staticBusinessModels } from './business-models'
export type { Fact, FaqEntry, PuckBlocks, SeoTail } from './seo'
