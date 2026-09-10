import { seoTail, recordTail, CITATION_FTA } from './seo'

// Static guide library for /guides and /guides/[slug]. The hub groups by `guide_type`
// into cost / banking / glossary / city sections, so the seed set covers all four —
// otherwise the hub renders its "library is updating" empty state.

type GuideSeed = {
  id: string
  slug: string
  guide_type: 'cost' | 'banking' | 'glossary' | 'city'
  title: string
  jurisdiction_slug: string | null
  term: string | null
  definition: string | null
  intro: string | null
  faq: Array<{ q: string; a: string }>
}

const SEEDS: GuideSeed[] = [
  {
    id: 'guide-uae-formation-cost',
    slug: 'uae-company-formation-cost',
    guide_type: 'cost',
    title: 'UAE company formation cost, itemised',
    jurisdiction_slug: 'uae',
    term: null,
    definition: null,
    intro:
      'A single-shareholder UAE free zone company runs from roughly $4,800 all-in for the first year. This breaks down where that figure goes, what sits outside it, and what year two actually costs.',
    faq: [
      { q: 'What is the cheapest UAE free zone?', a: 'Shams and IFZA are the lowest-cost credible routes, starting around $4,800 for a single-shareholder licence with one visa allocation. The cheapest zone is not always the right one — banks read the zone as a signal of the activity behind it.' },
      { q: 'What does the investor visa add?', a: 'Budget roughly $1,100 to $1,800 per visa, covering the entry permit, medical test, Emirates ID and visa stamping. Additional visa allocations may require a larger office package.' },
      { q: 'How much is renewal in year two?', a: 'Broadly similar to the first-year licence fee, plus registered address, corporate tax filing, and audit where the zone mandates it. Expect $4,000 to $5,500 for a simple free zone entity.' },
      { q: 'Are there hidden costs?', a: 'The usual ones are document attestation for foreign corporate shareholders, audit fees in DMCC and DAFZA, VAT registration and filing once you cross AED 375,000 of turnover, and office upgrades needed to unlock extra visa quota. We disclose all of these in the initial quote.' },
    ],
  },
  {
    id: 'guide-saudi-formation-cost',
    slug: 'saudi-arabia-company-formation-cost',
    guide_type: 'cost',
    title: 'Saudi Arabia company formation cost and capital requirements',
    jurisdiction_slug: 'saudi-arabia',
    term: null,
    definition: null,
    intro:
      'A Saudi LLC under a MISA investment licence starts around $8,500 in professional and government fees, before the SAR 500,000 share capital subscription that most commercial activities require.',
    faq: [
      { q: 'Do I have to deposit SAR 500,000?', a: 'It is a subscription requirement for most commercial activities rather than a permanently locked deposit. Once the entity is operational the capital can be deployed as working capital.' },
      { q: 'What drives the cost above the UAE?', a: 'Document attestation and legalisation through the Saudi embassy chain, MISA application fees, mandatory annual audit, and a longer professional engagement because the process runs five to seven days after approval rather than 72 hours.' },
      { q: 'Is the RHQ licence more expensive?', a: 'Yes, and it carries substantive obligations — genuine regional management functions and Saudi hiring. The 30-year exemption from corporate income tax and withholding tax generally outweighs the additional setup cost for anyone tendering for government work.' },
    ],
  },
  {
    id: 'guide-uae-corporate-banking',
    slug: 'uae-corporate-bank-account-guide',
    guide_type: 'banking',
    title: 'Opening a UAE corporate bank account: what banks actually assess',
    jurisdiction_slug: 'uae',
    term: null,
    definition: null,
    intro:
      'UAE corporate account applications are declined for a small, predictable set of reasons. This covers what each bank onboards, what the compliance file needs to contain, and how to sequence the application.',
    faq: [
      { q: 'Which UAE bank is easiest for a new company?', a: 'Wio and Mashreq NeoBiz are digital-first and fastest, and they onboard selected non-resident shareholders. Emirates NBD and FAB are slower and more conservative but carry more weight with international counterparties. The right choice depends on your activity and residency.' },
      { q: 'Why do applications get declined?', a: 'A licence activity that does not match the described business, no evidence of real trade, an untraceable source of wealth, counterparties in jurisdictions the bank has exited, or a free zone the bank does not onboard for that activity.' },
      { q: 'Can I apply to several banks at once?', a: 'It is counterproductive. Parallel applications get flagged between institutions and read as shopping for the weakest control environment. Place one well-prepared file, in sequence.' },
      { q: 'How long does it take?', a: 'Two to four weeks from submission with a complete file, assuming the trade licence is issued and the Emirates ID is in hand where the bank requires it. Non-resident applications run longer.' },
    ],
  },
  {
    id: 'guide-hong-kong-banking',
    slug: 'hong-kong-corporate-banking-guide',
    guide_type: 'banking',
    title: 'Hong Kong corporate banking for non-resident owners',
    jurisdiction_slug: 'hongkong',
    term: null,
    definition: null,
    intro:
      'Hong Kong company formation takes three days. The bank account takes four to eight weeks and is where most applications stall. This covers what the traditional banks want, and where the digital providers have changed the picture.',
    faq: [
      { q: 'Can a non-resident open a Hong Kong corporate account?', a: 'Yes, but the traditional banks apply heavy scrutiny to non-resident ownership. Digital providers have substantially improved access for lower-risk activities and ownership profiles.' },
      { q: 'Does a mainland China nexus hurt the application?', a: 'It attracts additional scrutiny rather than an automatic decline. Clear documentation of suppliers, contracts and trade flows is what carries the application through.' },
      { q: 'How does this compare with Singapore?', a: 'Singapore accounts open in one to three weeks and rarely stall. Hong Kong takes four to eight weeks with a meaningful failure rate. If a delayed account would stop your business, Singapore is the safer choice.' },
    ],
  },
  {
    id: 'guide-glossary-qfzp',
    slug: 'what-is-a-qualifying-free-zone-person',
    guide_type: 'glossary',
    title: 'Qualifying Free Zone Person (QFZP)',
    jurisdiction_slug: 'uae',
    term: 'Qualifying Free Zone Person',
    definition:
      'A UAE free zone entity that meets the conditions set out in the Corporate Tax Law to be taxed at 0% on its qualifying income instead of the 9% standard rate. The conditions are cumulative: adequate substance in the free zone, income falling within the qualifying categories, non-qualifying revenue below the de minimis threshold, audited financial statements, compliance with transfer pricing requirements, and no election to be taxed at the standard rate.',
    intro: null,
    faq: [
      { q: 'Is QFZP status automatic for a free zone company?', a: 'No. Every condition must be met, and they are tested annually. A free zone licence makes you eligible to qualify; it does not make you qualified.' },
      { q: 'What is the de minimis threshold?', a: 'A cap on non-qualifying revenue, expressed as the lower of a percentage of total revenue or a fixed AED amount. Breaching it costs QFZP status for that tax period and the following four, which makes it the condition to watch most closely.' },
      { q: 'What counts as adequate substance?', a: 'Core income-generating activities carried out in the free zone, with adequate assets, adequate qualified employees and adequate operating expenditure. Outsourcing within the zone is permitted where supervision is genuine.' },
      { q: 'Do I need an audit to claim QFZP?', a: 'Yes. Audited financial statements are one of the mandatory conditions, which means free zones that do not otherwise require an audit still need one if you are claiming 0%.' },
    ],
  },
  {
    id: 'guide-glossary-ubo',
    slug: 'what-is-an-ultimate-beneficial-owner',
    guide_type: 'glossary',
    title: 'Ultimate Beneficial Owner (UBO)',
    jurisdiction_slug: null,
    term: 'Ultimate Beneficial Owner',
    definition:
      'The natural person who ultimately owns or controls a company, whether directly or through a chain of intermediate entities, nominees or other arrangements. UAE regulations generally treat ownership or control of 25% or more as the trigger, and where no person meets that test the senior managing official is recorded instead. UBO details must be filed with the registered agent and the relevant authority, and are exchanged with foreign tax authorities under the Common Reporting Standard.',
    intro: null,
    faq: [
      { q: 'Does a nominee shareholder change who the UBO is?', a: 'No. The nominee is the registered holder; the UBO remains the natural person for whose benefit the shares are held. Beneficial ownership must still be disclosed to the authorities and to your bank in full.' },
      { q: 'Is the UBO register public in the UAE?', a: 'No. It is filed with the registered agent and the relevant authority and is not publicly searchable, but it is available to regulators, law enforcement and — under CRS — to foreign tax authorities.' },
      { q: 'What if ownership is spread so no one holds 25%?', a: 'Where no natural person meets the ownership or control threshold, the senior managing official is recorded as the UBO.' },
    ],
  },
  {
    id: 'guide-glossary-economic-substance',
    slug: 'what-are-economic-substance-regulations',
    guide_type: 'glossary',
    title: 'Economic Substance Regulations (ESR)',
    jurisdiction_slug: 'uae',
    term: 'Economic Substance Regulations',
    definition:
      'Rules requiring entities carrying on defined "relevant activities" to demonstrate genuine economic substance in the jurisdiction — meaning core income-generating activities performed locally, with adequate people, premises and expenditure, and directed and managed from within. Relevant activities typically include banking, insurance, fund management, finance and leasing, headquarters, shipping, holding company, intellectual property and distribution and service centre business. In-scope entities must file an annual notification and, where the activity is in scope, a substance report.',
    intro: null,
    faq: [
      { q: 'Does ESR apply to a small consulting company?', a: 'Only if the activity is a listed relevant activity. Generic consulting usually is not, but headquarters, distribution and service centre and IP business frequently are. The notification obligation is assessed against the activity, not the size.' },
      { q: 'What is the penalty for missing the notification?', a: 'A financial penalty separate from any tax exposure, escalating for repeat failures. Because the notification is cheap to file and the penalty is not, filing on time is always the right call.' },
      { q: 'How does ESR interact with QFZP status?', a: 'They are separate regimes with overlapping substance concepts. Satisfying ESR does not automatically satisfy the QFZP adequate substance condition, and vice versa. Both need to be assessed.' },
    ],
  },
  {
    id: 'guide-city-dubai',
    slug: 'setting-up-in-dubai',
    guide_type: 'city',
    title: 'Setting up in Dubai: zones, costs and living notes',
    jurisdiction_slug: 'uae',
    term: null,
    definition: null,
    intro:
      'Dubai holds more free zones than any other emirate, and they are not interchangeable. This covers which zone suits which activity, what the city costs to live in, and the practical sequence from licence to Emirates ID.',
    faq: [
      { q: 'Which Dubai free zone should I pick?', a: 'IFZA and Meydan for consulting, agencies and SaaS at low cost with no audit obligation. DMCC where reputational weight matters or commodities are involved. DAFZA for aviation, logistics and regulated trade. Shams, in neighbouring Sharjah, for media and creative work at the lowest cost.' },
      { q: 'What does living in Dubai cost?', a: 'Housing dominates. A one-bedroom apartment in a central area runs roughly AED 70,000 to 120,000 annually, typically payable in one to four cheques. Schooling is the other major line for families. There is no personal income tax, which changes the net picture considerably.' },
      { q: 'How long from licence to Emirates ID?', a: 'Licence in 48 to 72 hours, then two to three weeks for entry permit, medical, biometrics and Emirates ID issuance. The bank account generally follows two to four weeks after that.' },
    ],
  },
  {
    id: 'guide-city-riyadh',
    slug: 'setting-up-in-riyadh',
    guide_type: 'city',
    title: 'Setting up in Riyadh: MISA, RHQ and Saudisation in practice',
    jurisdiction_slug: 'saudi-arabia',
    term: null,
    definition: null,
    intro:
      'Riyadh is where the Regional Headquarters programme concentrates. This covers the MISA licence route, what RHQ status requires and delivers, and how Nitaqat shapes the hiring plan from day one.',
    faq: [
      { q: 'Do I need an office in Riyadh specifically?', a: 'For RHQ status, yes — the programme requires a genuine regional headquarters presence with real management functions performed in the Kingdom. A standard MISA licence has more flexibility on location.' },
      { q: 'How long does the MISA process take?', a: 'Five to seven days after MISA approval for the commercial registration itself. The attestation and legalisation chain for the parent company documents is usually the longer part and should be started first.' },
      { q: 'What does Nitaqat require at launch?', a: 'Quotas are banded by sector and headcount and are enforced through the work visa system. Below a low headcount threshold the burden is light, but the compliant hiring plan needs to exist before you start issuing visas.' },
    ],
  },
]

const GUIDE_TYPE_LABEL: Record<GuideSeed['guide_type'], string> = {
  cost: 'Cost',
  banking: 'Banking',
  glossary: 'Glossary',
  city: 'City',
}

const BY_SLUG = new Map(SEEDS.map((seed) => [seed.slug, seed]))

function toRecord(seed: GuideSeed): any {
  const summary = seed.intro || seed.definition
  return {
    ...recordTail(),
    ...seoTail({
      aeo_llm_summary: summary,
      seo_meta_title: `${seed.title} | GCC Startup`,
      seo_meta_description: summary ? summary.slice(0, 155) : null,
      internal_links: [
        { label: 'All guides', url: '/guides' },
        { label: 'Jurisdiction guides', url: '/jurisdictions' },
        { label: 'Corporate tax calculator', url: '/tools/tax-calculator' },
      ],
      external_citations: seed.jurisdiction_slug === 'uae' ? [CITATION_FTA] : [],
    }),
    id: seed.id,
    slug: seed.slug,
    guide_type: seed.guide_type,
    title: seed.title,
    jurisdiction_slug: seed.jurisdiction_slug,
    term: seed.term,
    definition: seed.definition,
    intro: seed.intro,
    faq: seed.faq,
    priority: 'index' as const,
    blocks: null,
  }
}

/** Static guide shaped like `getGuideBySlug()` in lib/directus. */
export function staticGuide(slug: string): any {
  const seed = BY_SLUG.get(slug.trim().toLowerCase())
  return seed ? toRecord(seed) : null
}

export function staticGuides(): any[] {
  return SEEDS.map(toRecord)
}

export { GUIDE_TYPE_LABEL }
