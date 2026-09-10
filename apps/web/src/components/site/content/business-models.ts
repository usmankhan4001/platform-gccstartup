import { seoTail, recordTail } from './seo'

// Static business-model guides for /business and /business/[slug]. `recommended_jurisdictions`
// holds country *slugs*, which is what the detail page filters against.

type ModelSeed = {
  id: string
  slug: string
  name: string
  icon: string
  intro: string
  painPoints: string[]
  keywords: string[]
  recommended: string[]
  faq: Array<{ q: string; a: string }>
}

const SEEDS: ModelSeed[] = [
  {
    id: 'model-ecommerce',
    slug: 'ecommerce',
    name: 'E-Commerce Business',
    icon: '🛒',
    intro:
      'Cross-border ecommerce lives or dies on payment processing and customs treatment. Jurisdiction choice determines which processors will onboard you, whether goods flows attract sales tax, and how import duty lands.',
    painPoints: [
      'Stripe and PayPal declining or freezing accounts over jurisdiction and activity mismatch',
      'Chargeback ratios triggering acquirer review and reserve requirements',
      'Import duty and customs classification eroding unit economics on physical goods',
      'VAT and sales tax registration thresholds triggering across multiple markets at once',
      'Banks reading high transaction volume with low average order value as elevated risk',
      'Inventory financing needing a bankable entity that a new company cannot yet be',
    ],
    keywords: ['ecommerce company formation', 'online store business setup', 'dropshipping company', 'cross-border retail entity', 'D2C brand structure'],
    recommended: ['uae', 'hongkong', 'singapore'],
    faq: [
      { q: 'Which jurisdiction is best for ecommerce?', a: 'Hong Kong if you source from mainland China and can support an offshore profits claim — no sales tax and territorial taxation. A UAE free zone if you want 0% personal income tax and founder residency alongside strong processor acceptance. Singapore if payment processing reliability is the binding constraint.' },
      { q: 'Will Stripe accept my company?', a: 'Stripe supports UAE, Singapore and Hong Kong entities. Acceptance depends on the product category, the declared licence activity matching the actual store, and your chargeback history. Category and activity mismatch is the most common decline reason.' },
      { q: 'Do I need to register for VAT?', a: 'It depends where your customers are, not where the company is. UAE VAT registration is required above AED 375,000 of taxable turnover. EU and UK distance selling thresholds apply separately if you ship there.' },
      { q: 'How do I handle inventory across borders?', a: 'Most operators hold the trading entity in Hong Kong or the UAE and use third-party fulfilment in the destination market. The entity contracts and invoices; the goods never need to transit the jurisdiction of incorporation.' },
    ],
  },
  {
    id: 'model-saas',
    slug: 'saas',
    name: 'SaaS & Software Company',
    icon: '💻',
    intro:
      'SaaS has no physical goods, no customs and no inventory — which makes it the cleanest fit for a 0% jurisdiction. The real questions are where the intellectual property sits, how enterprise buyers will perceive the entity, and what investors expect to see.',
    painPoints: [
      'IP ownership sitting in the wrong entity, which surfaces painfully at a funding round or exit',
      'Enterprise procurement teams rejecting vendors incorporated in unfamiliar jurisdictions',
      'Investors requiring a Delaware, Singapore or UK holding company before they will wire',
      'EU and UK VAT on digital services triggering registration in multiple member states',
      'Transfer pricing exposure where developers sit in one country and revenue books in another',
      'Payment processors treating annual prepaid contracts as elevated chargeback risk',
    ],
    keywords: ['SaaS company formation', 'software company incorporation', 'IP holding structure', 'tech startup entity', 'digital services company'],
    recommended: ['uae', 'singapore', 'ireland'],
    faq: [
      { q: 'Where should my SaaS company be incorporated?', a: 'A UAE free zone if you are bootstrapped and want 0% corporate tax on qualifying income plus 0% personal income tax. Singapore if you are raising institutional capital or selling to large enterprises. Ireland if your customers are predominantly in the EU and you need an EU VAT number.' },
      { q: 'Where should the IP sit?', a: 'In the entity that will still be there at exit — usually the holding company, not an operating subsidiary. Moving IP later is a taxable event in most jurisdictions, so getting this right at formation is materially cheaper than fixing it.' },
      { q: 'Will investors accept a UAE holding company?', a: 'Regional and Gulf investors will. Most Western venture funds prefer Delaware, Singapore or a UK holding company, largely for familiarity of documentation. If institutional capital is in the plan, factor that in before you incorporate.' },
      { q: 'Do I charge VAT on digital services?', a: 'It depends on the customer\'s location and status. B2B sales into the EU generally reverse-charge; B2C sales into the EU attract VAT at the customer\'s local rate and can trigger registration. UAE VAT applies at 5% to UAE customers above the threshold.' },
    ],
  },
  {
    id: 'model-amazon-fba',
    slug: 'amazon-fba',
    name: 'Amazon FBA Seller',
    icon: '📦',
    intro:
      'Amazon FBA imposes its own constraints on top of the usual ones: which entity jurisdictions Seller Central accepts, which bank accounts it will disburse to, and how marketplace facilitator rules handle sales tax on your behalf.',
    painPoints: [
      'Seller Central verification failing on entity documents from unfamiliar jurisdictions',
      'Disbursement accounts rejected because the bank jurisdiction does not match the entity',
      'Account suspensions freezing both inventory and cash with no immediate recourse',
      'Import duty and tariff classification on China-sourced goods compressing margin',
      'Multi-marketplace expansion triggering VAT registration across several countries',
      'Inventory tied up in fulfilment centres while cash flow needs financing',
    ],
    keywords: ['Amazon FBA company', 'FBA seller incorporation', 'marketplace seller entity', 'private label company setup'],
    recommended: ['uae', 'hongkong'],
    faq: [
      { q: 'Which entity does Amazon accept?', a: 'Amazon accepts UAE, Hong Kong and Singapore entities across most marketplaces. What matters in practice is that the entity documents, the beneficial owner identity and the disbursement bank account are consistent — verification fails on mismatches far more often than on jurisdiction.' },
      { q: 'Hong Kong or UAE for FBA?', a: 'Hong Kong if you source from mainland China and can support an offshore profits claim, giving no sales tax and potentially zero effective tax on foreign-sourced profit. The UAE if you want founder residency, 0% personal income tax and easier banking.' },
      { q: 'Do I handle sales tax myself?', a: 'In the US, marketplace facilitator rules mean Amazon generally collects and remits state sales tax. In the EU and UK, your own VAT registration obligations still apply once you hold inventory or cross distance selling thresholds.' },
      { q: 'What happens to my company if Amazon suspends me?', a: 'The entity is unaffected, but cash and inventory are frozen with the marketplace. This is the main argument for not running a single-marketplace business through a single entity with a single bank relationship.' },
    ],
  },
  {
    id: 'model-consultant',
    slug: 'consultant',
    name: 'Consultant & Advisory Firm',
    icon: '🎯',
    intro:
      'Consulting is the highest-margin, lowest-complexity model to structure — no inventory, no customs, minimal capital. The considerations are client perception, professional indemnity, and whether your home country will accept that the work is genuinely performed elsewhere.',
    painPoints: [
      'Clients withholding tax on cross-border service fees where no treaty relief is claimed',
      'Home-country authorities challenging whether the work is genuinely performed abroad',
      'Permanent establishment risk created by spending too long at a client site',
      'Professional indemnity insurance being harder to place for offshore entities',
      'Enterprise clients requiring a local entity or a local VAT number before onboarding',
      'Irregular, lumpy invoicing patterns attracting bank compliance attention',
    ],
    keywords: ['consulting company formation', 'advisory firm incorporation', 'management consultant company', 'freelance consultant entity'],
    recommended: ['uae', 'bahrain', 'singapore'],
    faq: [
      { q: 'Is a UAE free zone company good for consulting?', a: 'It is one of the best fits available. Low setup cost, no audit requirement in IFZA or Meydan, 0% personal income tax, and a straightforward route to QFZP eligibility on qualifying income. Consultancy activities are well understood by the zones and by the banks.' },
      { q: 'Will my clients withhold tax on my invoices?', a: 'They may, depending on their jurisdiction and whether a treaty applies. The UAE\'s 140-plus treaty network usually provides relief, but claiming it generally requires a Tax Residency Certificate — which is a separate application from the company licence.' },
      { q: 'Can I keep living in my home country?', a: 'You can own the company, but the personal tax benefit likely will not follow. Controlled foreign company rules, place-of-management tests and residence rules mean profits are frequently attributed back to where you actually live. The 0% personal position requires genuine relocation.' },
      { q: 'Do I need professional indemnity insurance?', a: 'Many enterprise clients require it contractually. Placing cover for a UAE entity is straightforward with the regional insurers; it can be harder for pure offshore vehicles, which is one more reason to use an operating jurisdiction.' },
    ],
  },
  {
    id: 'model-digital-agency',
    slug: 'digital-agency',
    name: 'Digital & Creative Agency',
    icon: '🎨',
    intro:
      'Agencies carry the payroll of a services business and the cash-flow profile of a project business. Jurisdiction choice needs to support a distributed team, handle client-side withholding, and keep pass-through media spend from distorting the tax position.',
    painPoints: [
      'Contractors and staff spread across several countries creating payroll and PE exposure',
      'Large pass-through media spend inflating apparent revenue and VAT exposure',
      'Project-based cash flow producing irregular banking patterns that trigger review',
      'Client-side withholding on cross-border service fees reducing realised margin',
      'Retainer contracts requiring a local entity or local VAT number to be signed',
      'IP ownership of delivered creative work needing to be clean at handover',
    ],
    keywords: ['digital agency formation', 'marketing agency company', 'creative agency incorporation', 'media company setup'],
    recommended: ['uae', 'bahrain', 'ireland'],
    faq: [
      { q: 'Best jurisdiction for a digital agency?', a: 'A UAE free zone for 0% personal income tax and low overhead — Shams and IFZA are both strong for media and creative activities. Bahrain if cost is the binding constraint and Saudi clients matter. Ireland if your clients are predominantly European and need EU VAT invoices.' },
      { q: 'How do I handle a distributed team?', a: 'Most agencies contract international team members as service providers to the entity rather than employing them locally. That needs care — misclassification and permanent establishment risk both bite, and the answer depends on where each person actually sits.' },
      { q: 'Does pass-through media spend count as my revenue?', a: 'It depends on whether you contract as principal or as agent. Structured as agent, only your fee is revenue. Structured as principal, gross spend flows through your accounts, which inflates VAT exposure and can complicate a QFZP de minimis calculation.' },
      { q: 'Who owns the creative work we deliver?', a: 'Whatever your contract says, and it should say so explicitly. Ambiguity over deliverable IP is one of the most common sources of agency disputes, and it is entirely avoidable at the contracting stage.' },
    ],
  },
  {
    id: 'model-high-income-freelancer',
    slug: 'high-income-freelancer',
    name: 'High-Income Freelancer',
    icon: '⚡',
    intro:
      'Above roughly $150,000 of annual profit, the arithmetic of incorporating in a 0% jurisdiction and relocating starts to dominate every other consideration. Below that, the compliance overhead frequently outweighs the saving.',
    painPoints: [
      'Marginal personal tax rates of 40% or more consuming most of each additional dollar earned',
      'Home-country CFC rules attributing company profits back to the individual regardless',
      'Platform and client payment restrictions on newly incorporated entities',
      'Genuinely needing to relocate for the tax benefit to be real rather than theoretical',
      'Health insurance and pension continuity breaking on departure',
      'Mortgage and credit applications becoming harder without domestic salaried income',
    ],
    keywords: ['freelancer company formation', 'sole trader to limited company', 'digital nomad company', 'independent contractor entity'],
    recommended: ['uae', 'bahrain'],
    faq: [
      { q: 'At what income does incorporating make sense?', a: 'Broadly above $150,000 of annual profit, where the tax saving clearly exceeds setup, renewal, accounting and relocation costs. Below roughly $80,000 the overhead usually is not justified, and we will tell you so.' },
      { q: 'Can I stay where I am and still pay 0%?', a: 'Generally no. Controlled foreign company rules, place-of-management tests and personal residence rules mean the profits are typically taxed where you actually live. The 0% position requires a genuine change in your own tax residency, evidenced by a Tax Residency Certificate.' },
      { q: 'Which is cheapest to set up and run?', a: 'A UAE free zone entity from around $4,800 all-in for the first year, or a Bahrain WLL from around $4,200 with unconditional 0% corporate tax. The UAE has stronger banking and payment processor acceptance; Bahrain is cheaper to run.' },
      { q: 'What do I lose by leaving?', a: 'Usually state healthcare, pension accrual and easy access to domestic mortgage and credit products. Some countries also apply exit taxes on unrealised gains. These are real costs and should be priced into the decision rather than discovered afterwards.' },
    ],
  },
]

const BY_SLUG = new Map(SEEDS.map((seed) => [seed.slug, seed]))

const SLUG_ALIASES: Record<string, string> = {
  'e-commerce': 'ecommerce',
  fba: 'amazon-fba',
  agency: 'digital-agency',
  freelancer: 'high-income-freelancer',
  software: 'saas',
}

function toRecord(seed: ModelSeed): any {
  return {
    ...recordTail(),
    ...seoTail({
      aeo_llm_summary: seed.intro,
      seo_meta_title: `${seed.name} — Company Formation & Jurisdiction Fit`,
      seo_meta_description: seed.intro.slice(0, 155),
      internal_links: [
        { label: 'All business models', url: '/business' },
        { label: 'Compare jurisdictions', url: '/compare' },
        { label: 'Jurisdiction fit quiz', url: '/tools/jurisdiction-quiz' },
      ],
    }),
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    icon: seed.icon,
    intro: seed.intro,
    pain_points: seed.painPoints.map((item) => ({ item })),
    keywords: seed.keywords.map((item) => ({ item })),
    recommended_jurisdictions: seed.recommended.map((item) => ({ item })),
    faq: seed.faq,
    blocks: null,
  }
}

/** Static business model shaped like `getBusinessModelBySlug()` in lib/directus. */
export function staticBusinessModel(slug: string): any {
  const key = slug.trim().toLowerCase()
  const seed = BY_SLUG.get(SLUG_ALIASES[key] ?? key)
  return seed ? toRecord(seed) : null
}

export function staticBusinessModels(): any[] {
  return SEEDS.map(toRecord)
}
