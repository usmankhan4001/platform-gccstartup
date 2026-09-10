import { seoTail, recordTail, type FaqEntry, type PuckBlocks } from './seo'

// Static pricing tier pages for the three slugs in the "Pricing" navigation dropdown
// and the footer. Without these, /pricing/self-ubo, /pricing/nominee-ubo and
// /pricing/shelf-company all 404 on a database with no pricing rows.

export type TierSeed = {
  id: string
  name: string
  slug: string
  tierLabel: string
  price: string
  priceNote: string
  description: string
  featured: boolean
  whoFor: string[]
  features: Array<{ title: string; desc: string }>
  notIncluded: string[]
  faq: FaqEntry[]
}

function tierBlocks(seed: TierSeed): PuckBlocks {
  return {
    content: [
      {
        type: 'PricingDetail',
        props: {
          id: `${seed.slug}-detail`,
          tierLabel: seed.tierLabel,
          name: seed.name,
          description: seed.description,
          price: seed.price,
          priceNote: seed.priceNote,
          featured: seed.featured,
          ctaText: 'Request this package',
          ctaLink: '/#lead-form',
          whoFor: seed.whoFor.map((item) => ({ item })),
          features: seed.features,
        },
      },
      {
        type: 'RichText',
        props: {
          id: `${seed.slug}-not-included`,
          headingLevel: 'h2',
          heading: 'What this package does not cover',
          body: `<p>Quoted separately so the headline price stays honest:</p><ul>${seed.notIncluded
            .map((item) => `<li>${item}</li>`)
            .join('')}</ul>`,
          narrow: true,
        },
      },
      {
        type: 'Faq',
        props: {
          id: `${seed.slug}-faq`,
          title: `${seed.name} pricing questions`,
          contactTitle: 'Want this priced against your exact situation?',
          contactDescription: 'Send us your activity and shareholder profile and we will confirm the all-in figure.',
          contactButtonText: 'Get a quote',
          contactButtonLink: '/#lead-form',
          faqs: seed.faq,
        },
      },
      {
        type: 'GlobalCta',
        props: {
          id: `${seed.slug}-cta`,
          headline: `Move forward with ${seed.name}`,
          subhead: 'Fixed fee, renewals disclosed up front, and a named advisor from name reservation to bank introduction.',
          primaryBtn: 'Request this package',
          primaryLink: '/#lead-form',
          secondaryBtn: 'Compare all packages',
          secondaryLink: '/pricing',
        },
      },
    ],
    root: {},
  }
}

const SEEDS: TierSeed[] = [
  {
    id: 'tier-self-ubo',
    name: 'Self as UBO',
    slug: 'self-ubo',
    tierLabel: 'Most popular',
    price: '$4,800',
    priceNote: 'All-in, first year. Renewal quoted at the same time.',
    description:
      'Standard UAE free zone formation with your own name on the register. The right package for the great majority of founders — consultants, agencies, SaaS and trading businesses that have no reason to obscure ownership.',
    featured: true,
    whoFor: [
      'Consultants, agencies and professional services firms',
      'SaaS and digital product businesses invoicing internationally',
      'Trading businesses with straightforward supply chains',
      'Founders who want UAE residency and a 0% personal tax position',
      'Anyone with no commercial reason to keep ownership private',
    ],
    features: [
      { title: 'Free zone selection and licence', desc: 'Zone chosen against your activity and banking profile, with trade name reservation, initial approval and licence issuance in 48 to 72 hours.' },
      { title: 'Registered address and establishment card', desc: 'Compliant registered address for the full licence year plus the immigration establishment card.' },
      { title: 'One investor visa allocation', desc: 'Entry permit, medical, Emirates ID biometrics and visa stamping for a single shareholder.' },
      { title: 'Corporate tax registration', desc: 'Registration with the Federal Tax Authority and a QFZP eligibility assessment before the zone is fixed.' },
      { title: 'Bank introduction to two institutions', desc: 'Compliance file prepared and placed with two shortlisted banks matched to your activity and residency.' },
      { title: 'Year-one compliance calendar', desc: 'Every filing deadline for the first twelve months, with reminders starting 45 days ahead.' },
      { title: 'Named advisor throughout', desc: 'One specialist owns your file end to end rather than a rotating support queue.' },
    ],
    notIncluded: [
      'Additional visa allocations beyond the first shareholder visa',
      'Physical office or flexi-desk beyond the registered address',
      'Attestation and legalisation of foreign documents',
      'Annual audit where the chosen zone mandates it',
      'VAT registration and quarterly return filing',
      'Tax Residency Certificate application',
    ],
    faq: [
      { q: 'Is $4,800 really the all-in figure?', a: 'For a single-shareholder free zone licence with one visa allocation in a zone such as IFZA or Meydan, yes — government fees, registered address, our work and the bank introduction are all inside it. Additional visas, physical office space and document attestation are quoted separately and disclosed before you pay.' },
      { q: 'What does renewal cost in year two?', a: 'Broadly similar to the first-year licence fee, plus registered address and any audit the zone requires. We quote the renewal figure at the same time as the formation quote so year two holds no surprises.' },
      { q: 'Can I add shareholders later?', a: 'Yes. Adding a shareholder requires an MOA amendment and free zone approval, and takes a few days. It is cheaper to include them at incorporation if you already know they are coming.' },
      { q: 'Does this package get me 0% corporate tax?', a: 'It gets you a structure assessed for QFZP eligibility before the zone is chosen. Whether you actually pay 0% depends on continuing to meet the qualifying conditions each year, which is what the compliance calendar tracks.' },
    ],
  },
  {
    id: 'tier-nominee-ubo',
    name: 'Nominee UBO',
    slug: 'nominee-ubo',
    tierLabel: 'Confidential',
    price: '$12,500',
    priceNote: 'First year including nominee appointment. Annual nominee renewal quoted separately.',
    description:
      'Free zone formation with a regulated nominee shareholder or director, so your name stays off commercially visible records while beneficial ownership and control remain entirely with you.',
    featured: false,
    whoFor: [
      'Founders with a genuine competitive-intelligence concern',
      'Public figures and individuals with personal security considerations',
      'Acquirers structuring a transaction where visible involvement would move the price',
      'Family offices separating personal identity from commercial holdings',
      'Anyone who needs commercial privacy and full regulatory disclosure at the same time',
    ],
    features: [
      { title: 'Everything in Self as UBO', desc: 'Complete free zone formation, registered address, establishment card, investor visa allocation, corporate tax registration and bank introduction.' },
      { title: 'Regulated nominee appointment', desc: 'Licensed corporate service provider appointed as nominee shareholder and/or director, carrying professional indemnity cover.' },
      { title: 'Declaration of trust', desc: 'Executed instrument confirming the nominee holds the shares solely for your benefit.' },
      { title: 'Irrevocable power of attorney', desc: 'Decision rights over the company remain with you and cannot be withdrawn by the nominee.' },
      { title: 'Pre-signed undated transfer', desc: 'Share transfer instrument held in escrow so you can remove the nominee or sell without their cooperation.' },
      { title: 'Beneficial ownership registration', desc: 'Full disclosure to the relevant authority and the registered agent, as the law requires.' },
      { title: 'Structure pack for bank diligence', desc: 'Documentation prepared so the arrangement is understood at onboarding rather than queried mid-review.' },
    ],
    notIncluded: [
      'Annual nominee renewal from year two onward',
      'Additional visa allocations beyond the first',
      'Physical office beyond the registered address',
      'Annual audit where the zone mandates it',
      'Tax advice in your country of residence',
      'Attestation and legalisation of foreign documents',
    ],
    faq: [
      { q: 'Why is this so much more than Self as UBO?', a: 'The nominee is a regulated corporate service provider taking on real legal exposure, and the arrangement requires four separate executed instruments plus enhanced due diligence on every beneficial owner. The fee reflects the professional risk and the documentation, not administrative overhead.' },
      { q: 'Will my bank still know who I am?', a: 'Yes, in full. Banks require complete beneficial ownership disclosure and we provide it. The nominee affects what is commercially visible, not what the bank or the regulator sees.' },
      { q: 'Can the nominee act against my interests?', a: 'The declaration of trust, irrevocable power of attorney, pre-signed undated transfer and non-interference undertaking are designed precisely to prevent that. You can remove them unilaterally at any time.' },
      { q: 'Does this reduce my tax anywhere?', a: 'No. Beneficial ownership is reported under the Common Reporting Standard and any controlled foreign company rules in your country of residence continue to apply. This is a commercial privacy arrangement, not a tax structure.' },
    ],
  },
  {
    id: 'tier-shelf-company',
    name: 'Shelf Company',
    slug: 'shelf-company',
    tierLabel: 'Immediate history',
    price: '$11,000',
    priceNote: 'Price varies with incorporation date. Older entities cost more.',
    description:
      'Acquisition and transfer of a pre-registered, never-traded UAE entity. For situations where a tender, contract or lender requires registration history you cannot otherwise produce.',
    featured: false,
    whoFor: [
      'Bidders on tenders requiring two or three years of registration history',
      'Suppliers facing enterprise procurement vendor-age requirements',
      'Businesses needing an operating entity in days rather than weeks',
      'Applicants where an aged clean entity shortens bank compliance review',
    ],
    features: [
      { title: 'Curated entity shortlist', desc: 'Available never-traded entities presented by incorporation date, free zone and permitted activity.' },
      { title: 'Full due diligence pack', desc: 'Certificate of incorporation, current register extract and certificate of good standing for every candidate, before you commit.' },
      { title: 'Written no-liability warranty', desc: 'Signed confirmation that the entity has never traded, holds no liabilities and has no filings in arrears.' },
      { title: 'Complete transfer handling', desc: 'Share transfer, MOA amendment, director and signatory changes, and licence activity amendment where needed.' },
      { title: 'Beneficial ownership refiling', desc: 'Register updated to reflect the incoming owners as the regulations require.' },
      { title: 'Bank introduction', desc: 'Application placed making use of the entity\'s existing incorporation history.' },
    ],
    notIncluded: [
      'Company name change, which requires free zone approval and additional fees',
      'Visa allocations, quoted per visa',
      'Audited financial statements — a shelf entity has none',
      'Physical office beyond the registered address',
      'Backdated trading history, which cannot be created',
    ],
    faq: [
      { q: 'Has the entity ever traded?', a: 'No. Every entity we transfer has been dormant since incorporation, with no trading, no bank account and no liabilities, and we warrant that in writing. We do not broker previously trading companies because the contingent liability risk is not one we will pass to a client.' },
      { q: 'How old are the entities?', a: 'Typically one to four years. Availability shifts constantly, and price scales with incorporation date, so we shortlist against the specific age your requirement needs.' },
      { q: 'Does a shelf company give me trading history?', a: 'No — only registration history. There are no filed accounts and no revenue record. If a counterparty wants audited financials, a shelf entity does not solve that.' },
      { q: 'Is it worth it over a new incorporation?', a: 'Only if registration history is genuinely required. If it is not, a new company at $4,800 is cheaper and cleaner. We will tell you when you do not need this.' },
    ],
  },
]

const BLOCKS_BY_SLUG = new Map<string, PuckBlocks>()
const BY_SLUG = new Map<string, TierSeed>()

for (const seed of SEEDS) {
  BY_SLUG.set(seed.slug, seed)
  BLOCKS_BY_SLUG.set(seed.slug, tierBlocks(seed))
}

const SLUG_ALIASES: Record<string, string> = {
  'self-as-ubo': 'self-ubo',
  standard: 'self-ubo',
  nominee: 'nominee-ubo',
  shelf: 'shelf-company',
}

/** Static pricing tier shaped like `getPricingTierBySlug()` in lib/directus. */
export function staticPricingTier(slug: string): any {
  const key = slug.trim().toLowerCase()
  const seed = BY_SLUG.get(SLUG_ALIASES[key] ?? key)
  if (!seed) return null

  return {
    ...recordTail(),
    ...seoTail({
      aeo_llm_summary: seed.description,
      seo_meta_title: `${seed.name} Package — ${seed.price} | UAE Company Formation`,
      seo_meta_description: `${seed.description.slice(0, 150)}`,
      internal_links: [
        { label: 'All formation packages', url: '/pricing' },
        { label: 'Company registration service', url: '/services/company-registration' },
        { label: 'Book a consultation', url: '/book-consultation' },
      ],
    }),
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    tier_label: seed.tierLabel,
    price: seed.price,
    price_note: seed.priceNote,
    description: seed.description,
    featured: seed.featured,
    faq: seed.faq,
    blocks: BLOCKS_BY_SLUG.get(seed.slug) ?? { content: [], root: {} },
  }
}

export function staticPricingTierSummaries() {
  return SEEDS.map((seed) => ({
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    tier_label: seed.tierLabel,
    price: seed.price,
    price_note: seed.priceNote,
    description: seed.description,
    featured: seed.featured,
  }))
}

export { SEEDS as PRICING_TIER_SEEDS }
