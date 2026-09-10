import { seoTail, recordTail } from './seo'

// Static head-to-head comparisons for the /compare hub and its detail routes.
// `jurisdiction_a` / `jurisdiction_b` reference the static country ids in
// ./countries.ts so the detail page can resolve real names via staticCountrySummaries().
// `compare_rows` are supplied explicitly rather than derived, so the table renders
// correctly even when the country lookup returns nothing.

type ComparisonSeed = {
  id: string
  slug: string
  jurisdiction_a: string
  jurisdiction_b: string
  /** Column headings. Set explicitly because a comparison is not always between two
   * different countries — free zone vs mainland compares two routes inside the UAE, so
   * deriving both headings from the country record would print the same name twice. */
  label_a: string
  label_b: string
  comparison_type: 'company-formation' | 'tax' | 'banking'
  headline: string
  intro: string
  compare_rows: Array<{ label: string; a: string; b: string }>
  verdict: Array<{ option: 'a' | 'b' | 'depends'; condition: string; reasoning: string }>
  faq: Array<{ q: string; a: string }>
}

const SEEDS: ComparisonSeed[] = [
  {
    id: 'compare-uae-freezone-vs-mainland',
    slug: 'uae-freezone-vs-mainland',
    jurisdiction_a: 'country-uae',
    jurisdiction_b: 'country-uae',
    label_a: 'UAE Free Zone',
    label_b: 'UAE Mainland',
    comparison_type: 'company-formation',
    headline: 'UAE Free Zone vs Mainland Incorporation',
    intro:
      'Both give you a UAE trade licence and 100% foreign ownership. The difference is who you are allowed to invoice, what it costs to run, and whether the 0% corporate tax rate is available to you at all.',
    compare_rows: [
      { label: 'Foreign ownership', a: '100%, guaranteed by the zone', b: '100% in most activities since 2021' },
      { label: 'Corporate tax', a: '0% if QFZP conditions are met, otherwise 9%', b: '9% above AED 375,000 — no 0% route' },
      { label: 'Invoice UAE customers', a: 'Restricted — needs a distributor or a mainland branch', b: 'Unrestricted across the UAE' },
      { label: 'Physical office', a: 'Registered address or flexi-desk is sufficient', b: 'Ejari-registered premises usually required' },
      { label: 'Setup cost, year one', a: 'From $4,800', b: 'From $6,500' },
      { label: 'Setup timeline', a: '48–72 hours', b: '5–10 working days' },
      { label: 'Visa quota', a: '1–6, scaling with office size', b: 'Scales with office square footage' },
      { label: 'Audit requirement', a: 'Zone-dependent — DMCC and DAFZA yes, IFZA and Meydan no', b: 'Generally required' },
      { label: 'Government tenders', a: 'Largely excluded', b: 'Eligible' },
    ],
    verdict: [
      {
        option: 'a',
        condition: 'Your customers are outside the UAE',
        reasoning:
          'A free zone licence is cheaper, faster, needs no physical premises, and is the only route to the 0% QFZP rate. For consultants, agencies, SaaS and international trading businesses this is almost always the correct answer.',
      },
      {
        option: 'b',
        condition: 'You need to invoice UAE-based customers directly',
        reasoning:
          'Free zone entities face real restrictions on onshore trade. If UAE companies and consumers are your market, mainland licensing avoids a distributor arrangement that erodes margin and control.',
      },
      {
        option: 'depends',
        condition: 'Your revenue is split between UAE and international customers',
        reasoning:
          'The usual answer is a free zone entity for international revenue plus a mainland branch or subsidiary for onshore trade. That preserves QFZP eligibility on qualifying income while keeping onshore access — but it needs care to avoid breaching the de minimis threshold.',
      },
    ],
    faq: [
      { q: 'Can a free zone company invoice a UAE customer at all?', a: 'In limited circumstances, and it counts as non-qualifying revenue for QFZP purposes. Sustained onshore trade needs a distributor, a mainland branch or a mainland subsidiary.' },
      { q: 'Does a mainland company ever get 0% corporate tax?', a: 'No. The 0% Qualifying Free Zone Person rate is only available to free zone entities. Mainland companies pay 9% above AED 375,000, though Small Business Relief may apply below the revenue threshold.' },
      { q: 'Do I still need a local sponsor for a mainland company?', a: 'Not for most activities. The 2021 reforms permit 100% foreign ownership across the large majority of mainland commercial activities. A reserved list remains.' },
      { q: 'Which is better for opening a bank account?', a: 'Neither is inherently better. Banks care about the activity, the beneficial owners and the coherence of the file. A DMCC free zone entity often reads better than an obscure mainland licence, and vice versa.' },
    ],
  },
  {
    id: 'compare-uae-vs-saudi-arabia',
    slug: 'uae-vs-saudi-arabia',
    jurisdiction_a: 'country-uae',
    jurisdiction_b: 'country-saudi-arabia',
    label_a: 'UAE',
    label_b: 'Saudi Arabia',
    comparison_type: 'tax',
    headline: 'UAE vs Saudi Arabia for regional expansion',
    intro:
      'The UAE is the better holding and treasury jurisdiction. Saudi Arabia is the bigger market and the only route to government procurement. Most serious regional operators end up holding both, not choosing between them.',
    compare_rows: [
      { label: 'Corporate tax', a: '0% QFZP, otherwise 9% above AED 375,000', b: '20%, or 0% for 30 years under RHQ' },
      { label: 'Personal income tax', a: '0%', b: '0%' },
      { label: 'VAT', a: '5%', b: '15%' },
      { label: 'Minimum share capital', a: 'None in most free zones', b: 'SAR 500,000 for most commercial activities' },
      { label: 'Setup timeline', a: '48–72 hours', b: '5–7 days after MISA approval' },
      { label: 'Setup cost, year one', a: 'From $4,800', b: 'From $8,500' },
      { label: 'Local hiring quotas', a: 'None', b: 'Nitaqat quotas by sector and headcount' },
      { label: 'Government tenders', a: 'Not accessible', b: 'Accessible with RHQ status' },
      { label: 'Domestic market', a: 'Approximately 10 million residents', b: 'Over 32 million residents' },
      { label: 'Banking timeline', a: '2–4 weeks', b: '4–8 weeks' },
    ],
    verdict: [
      {
        option: 'a',
        condition: 'You are optimising tax, speed and cost',
        reasoning:
          'A UAE free zone entity sets up in days, costs half as much, requires no share capital deposit, imposes no local hiring quota, and can reach 0% corporate tax on qualifying income. For holding, IP, treasury and international services it is the clear answer.',
      },
      {
        option: 'b',
        condition: 'Your revenue depends on Saudi government or Aramco contracts',
        reasoning:
          'Since 2024 most central government and Aramco-linked procurement requires a Saudi Regional Headquarters presence. There is no offshore workaround — the rules were written specifically to close it. The 30-year RHQ tax exemption softens the cost considerably.',
      },
      {
        option: 'depends',
        condition: 'You want the Saudi market without the full compliance burden',
        reasoning:
          'For private-sector Saudi sales in many sectors you can serve clients from a UAE entity. The moment public procurement, large-scale local hiring or a physical Saudi presence enters the plan, a MISA or RHQ licence becomes necessary.',
      },
    ],
    faq: [
      { q: 'Can I sell into Saudi Arabia from a UAE company?', a: 'For private-sector customers in many sectors, yes. For central government and most Aramco-linked contracts, no — those require a Saudi entity with RHQ status.' },
      { q: 'Is the Saudi RHQ tax exemption genuinely 0% for 30 years?', a: 'Yes, for qualifying regional headquarters activities: 0% corporate income tax and 0% withholding tax for 30 years. It requires real regional management functions and Saudi hiring, so it is not a paper structure.' },
      { q: 'Which should I set up first?', a: 'Almost always the UAE entity. It is faster and cheaper, it can act as the regional holding company, and it gives you a bankable base while the Saudi MISA application and attestation chain run.' },
      { q: 'How burdensome is Saudisation?', a: 'Nitaqat sets minimum Saudi-to-expatriate hiring ratios banded by sector and headcount, enforced through the work visa system. It requires a deliberate hiring plan from launch rather than a retrofit.' },
    ],
  },
  {
    id: 'compare-uae-vs-singapore',
    slug: 'uae-vs-singapore',
    jurisdiction_a: 'country-uae',
    jurisdiction_b: 'country-singapore',
    label_a: 'UAE',
    label_b: 'Singapore',
    comparison_type: 'banking',
    headline: 'UAE vs Singapore for founders and holding structures',
    intro:
      'Singapore wins on banking credibility, investor familiarity and treaty coverage. The UAE wins decisively on personal taxation and residency cost. The right answer depends on whether you are optimising the company or your own take-home.',
    compare_rows: [
      { label: 'Corporate tax', a: '0% QFZP, otherwise 9% above AED 375,000', b: '17% headline, 4–8% effective for startups' },
      { label: 'Personal income tax', a: '0%', b: 'Progressive, 0–24%' },
      { label: 'VAT / GST', a: '5%', b: '9%' },
      { label: 'Setup timeline', a: '48–72 hours', b: '1–2 days' },
      { label: 'Setup cost, year one', a: 'From $4,800', b: 'From $3,800 plus nominee director fees' },
      { label: 'Resident director required', a: 'No', b: 'Yes — at least one' },
      { label: 'Tax treaties', a: 'Over 140', b: 'Over 90' },
      { label: 'Banking timeline', a: '2–4 weeks', b: '1–3 weeks' },
      { label: 'Payment processor acceptance', a: 'Good, occasional friction', b: 'Excellent, effectively frictionless' },
      { label: 'Residency for the founder', a: 'Investor visa, low cost, straightforward', b: 'Employment Pass, harder and more expensive' },
    ],
    verdict: [
      {
        option: 'a',
        condition: 'You want to draw income personally at 0%',
        reasoning:
          'This is the decisive difference. Singapore taxes individual income progressively to 24%; the UAE levies none. A founder taking meaningful personal income who is willing to relocate is materially better off in the UAE, and the investor visa is cheaper and easier than an Employment Pass.',
      },
      {
        option: 'b',
        condition: 'You are raising institutional capital or selling to enterprise buyers',
        reasoning:
          'Singapore removes friction the UAE sometimes introduces. Venture funds are comfortable with ACRA filings and Singapore holding structures, and Stripe, PayPal and enterprise procurement treat Singapore entities as tier-one without question.',
      },
      {
        option: 'depends',
        condition: 'You need both credibility and a 0% personal position',
        reasoning:
          'A Singapore operating company beneath a UAE holding entity, with the founder tax-resident in the UAE, gets both. It costs more to run and requires transfer pricing and substance discipline in both jurisdictions, so it is worth it above a certain scale and not below it.',
      },
    ],
    faq: [
      { q: 'Is Singapore really taxed at 17%?', a: 'Rarely, early on. The start-up exemption substantially exempts the first SGD 200,000 of chargeable income for three years, giving effective rates of roughly 4–8% for smaller companies.' },
      { q: 'Which is better for a SaaS business?', a: 'Singapore if you are raising venture capital or selling to large enterprises. A UAE free zone if you are bootstrapped, want 0% personal tax and prefer lower running costs. Both bank and process payments perfectly well for SaaS.' },
      { q: 'Do I have to move to the UAE to benefit?', a: 'To benefit from 0% personal income tax, yes — you need genuine UAE tax residency, which means satisfying the day-count and substance tests and holding a Tax Residency Certificate. The company alone does not change your personal position.' },
      { q: 'Is the Singapore resident director requirement a problem?', a: 'Not in practice. Non-resident founders appoint a regulated nominee director for an annual fee. It is a standard, priced service rather than an obstacle.' },
    ],
  },
  {
    id: 'compare-hong-kong-vs-singapore',
    slug: 'hong-kong-vs-singapore',
    jurisdiction_a: 'country-hongkong',
    jurisdiction_b: 'country-singapore',
    label_a: 'Hong Kong',
    label_b: 'Singapore',
    comparison_type: 'company-formation',
    headline: 'Hong Kong vs Singapore for trading and ecommerce',
    intro:
      'Hong Kong can reach an effective 0% on foreign-sourced profits and charges no sales tax at all — but banking is the hard part. Singapore banks easily and carries broader credibility, at the cost of a real tax rate and a resident director requirement.',
    compare_rows: [
      { label: 'Corporate tax', a: '8.25% to HKD 2m, then 16.5%; offshore profits exempt', b: '17% headline, 4–8% effective for startups' },
      { label: 'Sales tax', a: 'None', b: 'GST at 9%' },
      { label: 'Personal income tax', a: 'Progressive, capped at 15%', b: 'Progressive, 0–24%' },
      { label: 'Setup timeline', a: '2–3 days', b: '1–2 days' },
      { label: 'Setup cost, year one', a: 'From $3,200', b: 'From $3,800 plus nominee director fees' },
      { label: 'Resident director required', a: 'No', b: 'Yes — at least one' },
      { label: 'Audit requirement', a: 'Mandatory every year, no exemption', b: 'Exempt if small-company criteria are met' },
      { label: 'Banking timeline', a: '4–8 weeks, applications frequently stall', b: '1–3 weeks, generally straightforward' },
      { label: 'China supply chain access', a: 'Excellent — CEPA and direct RMB settlement', b: 'Good, but indirect' },
      { label: 'Tax treaties', a: 'Approximately 45', b: 'Over 90' },
    ],
    verdict: [
      {
        option: 'a',
        condition: 'You source or manufacture in mainland China',
        reasoning:
          'Hong Kong is purpose-built for this. CEPA preferences, direct RMB settlement, proximity to Shenzhen and no sales tax on goods flows. Combined with a properly evidenced offshore profits claim, the effective tax rate on foreign-sourced trading profit can be zero.',
      },
      {
        option: 'b',
        condition: 'Banking reliability matters more than the tax rate',
        reasoning:
          'Singapore accounts open in one to three weeks and are accepted everywhere. Hong Kong applications take four to eight weeks and frequently stall on non-resident ownership or a mainland China nexus. If a stalled account would stop your business, pay the tax.',
      },
      {
        option: 'depends',
        condition: 'You are running a high-volume ecommerce operation',
        reasoning:
          'Hong Kong if the supply chain is Chinese and you can maintain the documentation an offshore claim requires. Singapore if your marketplaces and processors are the binding constraint. A UAE free zone is worth considering as a third option where founder residency and 0% personal tax matter.',
      },
    ],
    faq: [
      { q: 'How reliable is a Hong Kong offshore profits claim?', a: 'Reliable when properly evidenced — contracts, correspondence and shipping documentation showing negotiation and conclusion occurred outside Hong Kong. It is a documentation discipline maintained from day one. Filed casually, it fails on review.' },
      { q: 'Why is Hong Kong banking so difficult?', a: 'Traditional banks apply heavy scrutiny to non-resident shareholders and to any mainland China nexus, and de-risking has narrowed appetite over the past decade. Digital providers have improved the position considerably but the shortlist remains narrow.' },
      { q: 'Which has lower total running costs?', a: 'Singapore, usually, despite the higher tax rate — Hong Kong mandates an annual audit with no small-company exemption, while Singapore exempts small companies. Hong Kong wins on the tax line and loses on the compliance line.' },
      { q: 'Should I consider the UAE instead?', a: 'Yes, if founder residency is part of the plan. A UAE free zone offers 0% personal income tax, low-cost residency and 0% corporate tax on qualifying income, which neither Hong Kong nor Singapore matches on the personal side.' },
    ],
  },
]

const TYPE_LABEL: Record<ComparisonSeed['comparison_type'], string> = {
  'company-formation': 'Company formation',
  tax: 'Tax & Compliance',
  banking: 'Corporate Banking',
}

const BY_SLUG = new Map(SEEDS.map((seed) => [seed.slug, seed]))

const SLUG_ALIASES: Record<string, string> = {
  'uae-vs-ksa': 'uae-vs-saudi-arabia',
  'singapore-vs-hong-kong': 'hong-kong-vs-singapore',
  'freezone-vs-mainland': 'uae-freezone-vs-mainland',
}

function toRecord(seed: ComparisonSeed): any {
  return {
    ...recordTail(),
    ...seoTail({
      aeo_llm_summary: seed.intro,
      seo_meta_title: `${seed.headline} — Cost, Tax & Timeline Compared`,
      seo_meta_description: seed.intro.slice(0, 155),
      internal_links: [
        { label: 'All comparisons', url: '/compare' },
        { label: 'Jurisdiction guides', url: '/jurisdictions' },
        { label: 'Jurisdiction fit quiz', url: '/tools/jurisdiction-quiz' },
      ],
    }),
    id: seed.id,
    slug: seed.slug,
    jurisdiction_a: seed.jurisdiction_a,
    jurisdiction_b: seed.jurisdiction_b,
    label_a: seed.label_a,
    label_b: seed.label_b,
    comparison_type: seed.comparison_type,
    headline: seed.headline,
    intro: seed.intro,
    compare_rows: seed.compare_rows,
    verdict: seed.verdict,
    faq: seed.faq,
    priority: 'index' as const,
    blocks: null,
  }
}

/** Static comparison shaped like `getComparisonBySlug()` in lib/directus. */
export function staticComparison(slug: string): any {
  const key = slug.trim().toLowerCase()
  const seed = BY_SLUG.get(SLUG_ALIASES[key] ?? key)
  return seed ? toRecord(seed) : null
}

export function staticComparisons(): any[] {
  return SEEDS.map(toRecord)
}

/** Hub-card summaries, including the type label the /compare hub renders. */
export function staticComparisonSummaries() {
  return SEEDS.map((seed) => ({
    id: seed.id,
    slug: seed.slug,
    headline: seed.headline,
    intro: seed.intro,
    comparison_type: seed.comparison_type,
    typeLabel: TYPE_LABEL[seed.comparison_type],
    rowCount: seed.compare_rows.length,
  }))
}
