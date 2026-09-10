import { seoTail, recordTail, CITATION_FTA, CITATION_MOE, CITATION_MISA, type Fact, type FaqEntry, type PuckBlocks } from './seo'

// Static jurisdiction guides for the eight+ country slugs linked from the primary
// navigation, the footer and the /jurisdictions hub. These render whenever the
// `countries` table has no row for the slug, which is the state of a fresh install —
// without them every "Jurisdictions" dropdown item resolves to a 404.

export type SiteCountry = {
  id: string
  name: string
  slug: string
  flag: string
  region: string
  tax: string
  timeline: string
  from_price: string
  headline: string
  intro: string
  facts: Fact[]
  faq: FaqEntry[]
  blocks: PuckBlocks
}

type CountrySeed = Omit<SiteCountry, 'blocks'> & {
  /** Bulleted "why founders pick this" cards. */
  benefits: Array<{ title: string; description: string }>
  /** Document / eligibility checklist for the jurisdiction. */
  requirements: string[]
  /** Long-form body copy, rendered as a RichText block. */
  body: string
}

/** Renders the jurisdiction fact list as an HTML table for a RichText block. Kept as
 * markup rather than a dedicated Puck block because the stat blocks in the config all
 * expect numeric values, and these facts are qualitative strings. */
function factsTable(facts: Fact[]): string {
  const rows = facts
    .map((fact) => `<tr><th scope="row" style="text-align:left;width:42%">${fact.label}</th><td>${fact.value}</td></tr>`)
    .join('')
  return `<table style="width:100%;border-collapse:collapse"><tbody>${rows}</tbody></table>`
}

/** Builds the Puck block tree for a jurisdiction guide. Every country shares the same
 * section rhythm (subhero → context → benefits → requirements → FAQ → CTA) so the
 * pages read as one family rather than nine unrelated templates. */
function countryBlocks(seed: CountrySeed): PuckBlocks {
  return {
    content: [
      {
        type: 'Subhero',
        props: {
          id: `${seed.slug}-subhero`,
          eyebrow: `${seed.region} · Company formation`,
          title: seed.headline,
          description: seed.intro,
          image: '',
          ctaText: 'Get a formation quote',
          ctaLink: '/#lead-form',
        },
      },
      {
        type: 'RichText',
        props: {
          id: `${seed.slug}-facts`,
          headingLevel: 'h2',
          heading: `${seed.name} at a glance`,
          body: factsTable(seed.facts),
          narrow: true,
        },
      },
      {
        type: 'RichText',
        props: {
          id: `${seed.slug}-body`,
          headingLevel: 'h2',
          heading: `Setting up in ${seed.name}`,
          body: seed.body,
          narrow: true,
        },
      },
      {
        type: 'BenefitGrid',
        props: {
          id: `${seed.slug}-benefits`,
          eyebrow: 'Why founders choose it',
          title: `What ${seed.name} does well`,
          accent: 'orange',
          benefits: seed.benefits.map((b) => ({ title: b.title, description: b.description, image: '' })),
        },
      },
      {
        type: 'RequirementsList',
        props: {
          id: `${seed.slug}-requirements`,
          eyebrow: "What you'll need",
          title: `${seed.name} document checklist`,
          description: `Standard onboarding pack for a ${seed.name} incorporation. Additional documents may apply to regulated activities.`,
          requirements: seed.requirements.map((item) => ({ item })),
        },
      },
      {
        type: 'Faq',
        props: {
          id: `${seed.slug}-faq`,
          title: `${seed.name} formation questions`,
          contactTitle: 'Still have questions?',
          contactDescription: `Speak to an advisor who forms ${seed.name} entities every week.`,
          contactButtonText: 'Book a call',
          contactButtonLink: '/book-consultation',
          faqs: seed.faq,
        },
      },
      {
        type: 'GlobalCta',
        props: {
          id: `${seed.slug}-cta`,
          headline: `Start your ${seed.name} company`,
          subhead: `Fixed-fee formation with banking introductions and first-year compliance included. Packages from ${seed.from_price}.`,
          primaryBtn: 'Get a quote',
          primaryLink: '/#lead-form',
          secondaryBtn: 'Compare jurisdictions',
          secondaryLink: '/compare',
        },
      },
    ],
    root: {},
  }
}

const SEEDS: CountrySeed[] = [
  {
    id: 'country-uae',
    name: 'United Arab Emirates',
    slug: 'uae',
    flag: '🇦🇪',
    region: 'Middle East',
    tax: '0% QFZP / 9% above AED 375k',
    timeline: '48–72 hours',
    from_price: '$4,800',
    headline: 'The default choice for 0% tax structuring and 100% foreign ownership.',
    intro:
      'UAE free zones give founders full foreign ownership, no personal income tax, unrestricted profit repatriation and — where the Qualifying Free Zone Person conditions are met — a 0% corporate tax rate on qualifying income.',
    facts: [
      { label: 'Foreign ownership', value: '100% in all free zones' },
      { label: 'Corporate tax', value: '0% QFZP, otherwise 9% above AED 375,000' },
      { label: 'Personal income tax', value: '0%' },
      { label: 'VAT', value: '5% (registration from AED 375,000 turnover)' },
      { label: 'Minimum share capital', value: 'None in IFZA, Meydan, RAKEZ and Shams' },
      { label: 'Visa quota', value: '1–6 visas per licence, scalable with office size' },
      { label: 'Audit requirement', value: 'Mandatory in DMCC and DAFZA; optional in IFZA and Meydan' },
      { label: 'Banking timeline', value: '2–4 weeks after licence issuance' },
      { label: 'Residency', value: '2-year investor visa, 10-year Golden Visa available' },
      { label: 'Currency', value: 'AED, pegged to USD at 3.6725' },
    ],
    benefits: [
      { title: '0% corporate tax on qualifying income', description: 'Free zone entities meeting the QFZP substance, qualifying-income and de minimis tests pay 0% on qualifying income instead of the 9% headline rate.' },
      { title: 'Six credible free zone routes', description: 'IFZA and Meydan for cost-efficient consulting and trading, DMCC and DAFZA for regulated and commodities work, RAKEZ for light industrial, Shams for media and creative.' },
      { title: 'Tier-1 corporate banking', description: 'Emirates NBD, Mashreq NeoBiz, Wio and FAB all onboard free zone entities — with the right activity and substance file, accounts open in two to four weeks.' },
      { title: 'Residency that actually works', description: 'A licence carries investor visa quota, which brings Emirates ID, local banking, schooling and a route to a tax residency certificate.' },
      { title: 'Double tax treaty network', description: 'Over 140 treaties in force, which matters for founders drawing dividends or royalties out of higher-tax home jurisdictions.' },
      { title: 'No exchange controls', description: 'Capital and profits move out of the UAE without withholding tax or repatriation limits.' },
    ],
    requirements: [
      'Passport copy for every shareholder and director, valid at least six months',
      'Recent passport-size photograph on a white background',
      'Proof of residential address issued within the last three months',
      'Three proposed trade names, checked against Ministry of Economy rules',
      'Business activity description mapped to the free zone activity list',
      'Curriculum vitae or professional profile for regulated and consultancy activities',
      'Bank reference or six months of statements where a corporate account is required',
      'Existing trade licence and board resolution if a corporate shareholder is involved',
    ],
    body:
      '<p>The UAE is the most-used jurisdiction on our desk, and for a specific reason: it is the only place in the region where a founder can hold 100% of a company, pay 0% personal income tax, and — subject to the Qualifying Free Zone Person rules — 0% corporate tax on qualifying income, while still holding a bank account that international counterparties accept.</p><h3>Free zone, mainland or offshore</h3><p>A <strong>free zone</strong> licence is the right answer for most founders serving clients outside the UAE: full ownership, no local partner, minimal capital, and QFZP eligibility. A <strong>mainland</strong> licence (DED) is required if you intend to invoice UAE-based customers directly, or need a physical retail presence. An <strong>offshore</strong> vehicle (RAK ICC, JAFZA Offshore) holds assets and shares but cannot obtain visas or trade locally.</p><h3>Choosing between the free zones</h3><p>IFZA and Meydan are the cost leaders and carry no audit obligation, which suits consultants, agencies and SaaS founders. DMCC is the premium option — it carries real reputational weight with banks and is effectively required for commodities trading, but it costs more and mandates an annual audit. DAFZA suits aviation, logistics and regulated trade. RAKEZ is the practical choice where light manufacturing or warehousing is involved. Shams remains the cheapest credible route for media, content and creative work.</p><h3>What the 9% actually applies to</h3><p>Corporate tax at 9% applies to taxable income above AED 375,000. A free zone company that satisfies the QFZP conditions — adequate substance in the zone, qualifying income, non-qualifying revenue below the de minimis threshold, audited financials and no election out — pays 0% on its qualifying income instead. The conditions are testable and they are checked, so structuring the activity correctly at formation matters more than the headline rate.</p>',
    faq: [
      { q: 'How long does UAE company formation actually take?', a: 'Licence issuance in IFZA or Meydan is typically 48 to 72 hours once the name is approved and the document pack is complete. Add roughly two to three weeks for the investor visa and Emirates ID, and a further two to four weeks for the corporate bank account.' },
      { q: 'Do I need to fly to Dubai?', a: 'Not for incorporation — the licence can be issued while you are abroad. You do need to enter the UAE once for the medical test and Emirates ID biometrics if you are taking the investor visa.' },
      { q: 'Which free zone is cheapest?', a: 'Shams and IFZA are the lowest-cost credible routes, starting around $4,800 all-in for a single-shareholder licence with one visa allocation. The cheapest option is not always the right one — banks read the zone as a signal, and some zones are effectively unbankable for certain activities.' },
      { q: 'Will my free zone company definitely pay 0% corporate tax?', a: 'No — 0% is conditional. You must meet the Qualifying Free Zone Person tests: adequate substance in the zone, income that falls within the qualifying categories, non-qualifying revenue under the de minimis threshold, and audited financial statements. We check eligibility before you incorporate rather than after.' },
      { q: 'Can I open a UAE bank account as a non-resident?', a: 'Yes, but the shortlist narrows. Wio and Mashreq NeoBiz onboard non-resident shareholders on selected activities; the conventional banks generally want the Emirates ID first. We sequence the application around whichever bank fits your activity and residency position.' },
      { q: 'What are the ongoing annual costs?', a: 'Budget for licence renewal (broadly similar to the first-year licence fee), registered agent and address, corporate tax registration and filing, and audit where the zone mandates it. We quote renewals up front so the second year holds no surprises.' },
    ],
  },
  {
    id: 'country-saudi-arabia',
    name: 'Saudi Arabia',
    slug: 'saudi-arabia',
    flag: '🇸🇦',
    region: 'Middle East',
    tax: '20% corporate / 0% personal',
    timeline: '5–7 days',
    from_price: '$8,500',
    headline: 'The largest GCC economy, and the only route into government procurement.',
    intro:
      'A MISA investment licence gives 100% foreign ownership of a Saudi LLC, access to Vision 2030 contract flow, and — under the Regional Headquarters programme — a 30-year exemption from corporate income tax and withholding tax.',
    facts: [
      { label: 'Foreign ownership', value: '100% under a MISA investment licence' },
      { label: 'Corporate tax', value: '20% standard; 0% for 30 years under the RHQ programme' },
      { label: 'Personal income tax', value: '0%' },
      { label: 'VAT', value: '15%' },
      { label: 'Minimum share capital', value: 'SAR 500,000 for most commercial activities' },
      { label: 'Saudisation', value: 'Nitaqat quotas apply from the first local hire' },
      { label: 'Audit requirement', value: 'Mandatory, annually' },
      { label: 'Banking timeline', value: '4–8 weeks' },
      { label: 'Government tenders', value: 'RHQ status required for most central contracts' },
      { label: 'Currency', value: 'SAR, pegged to USD at 3.75' },
    ],
    benefits: [
      { title: 'RHQ tax holiday', description: 'Regional Headquarters licence holders get 30 years at 0% corporate income tax and 0% withholding on qualifying activities.' },
      { title: 'Access to public procurement', description: 'Since 2024 most central government and Aramco-linked contracts require a Saudi RHQ presence — there is no offshore workaround.' },
      { title: 'The region\'s deepest domestic market', description: 'Over 32 million residents and the largest consumer spend in the GCC, versus roughly 10 million in the UAE.' },
      { title: '100% foreign ownership', description: 'A MISA licence removes the historic local-partner requirement across most sectors.' },
      { title: 'Premium Residency', description: 'A direct residency route for investors that decouples status from a single employer sponsor.' },
    ],
    requirements: [
      'Commercial registration and audited financials of the foreign parent company',
      'Board resolution approving the Saudi subsidiary, notarised and attested',
      'Articles of association of the parent, legalised to the Saudi embassy',
      'Passport copies for the general manager and all authorised signatories',
      'Proposed Saudi trade name reservation',
      'Detailed business plan and three-year financial projection for MISA',
      'Proof of SAR 500,000 share capital availability where the activity requires it',
      'Attested degree certificate for the nominated general manager',
    ],
    body:
      '<p>Saudi Arabia is no longer an optional GCC market. If your revenue depends on government or semi-government contracts, on Aramco\'s supply chain, or on serving Saudi consumers at scale, a local entity is now the price of entry — the Regional Headquarters rules deliberately closed the "sell in from Dubai" route.</p><h3>MISA licence versus RHQ licence</h3><p>A standard <strong>MISA</strong> investment licence lets a foreign parent own a Saudi LLC outright and trade commercially. An <strong>RHQ</strong> licence sits on top: it requires the entity to perform genuine regional management functions and to hire into Saudi Arabia, and in exchange it grants a 30-year exemption from corporate income tax and withholding tax, plus eligibility for central government tenders.</p><h3>What founders underestimate</h3><p>Two things: Saudisation and timelines. Nitaqat quotas begin applying as soon as you hire, and the compliant hiring plan needs to exist before the entity is operational rather than after. Bank account opening also runs longer than the UAE — four to eight weeks is normal, and the general manager\'s residency status is usually on the critical path.</p><h3>How we sequence it</h3><p>Most clients hold a UAE free zone entity as the regional holding company and a Saudi LLC as the operating subsidiary. That keeps IP and treasury in a 0% environment while putting a compliant, tender-eligible presence on the ground in Riyadh. Our Riyadh desk handles the MISA filing, the attestation chain and the Nitaqat plan.</p>',
    faq: [
      { q: 'Do I need an RHQ licence, or is a MISA licence enough?', a: 'If you are selling to private-sector customers, a standard MISA licence is enough. If you want central government or Aramco-linked contracts, you need RHQ status — and the 30-year 0% tax exemption makes it worth having even when tenders are not the primary driver.' },
      { q: 'How much share capital do I actually have to deposit?', a: 'SAR 500,000 is the standard requirement for commercial activities. It is a subscription requirement rather than a permanently locked deposit — it can be deployed as working capital once the entity is operational.' },
      { q: 'What does Saudisation mean in practice?', a: 'Nitaqat sets a minimum ratio of Saudi nationals to expatriate employees, banded by sector and headcount. Falling below the band restricts your ability to issue new work visas, so the hiring plan has to be built into the launch plan.' },
      { q: 'Can I run Saudi operations from Dubai?', a: 'For private-sector sales in some sectors, yes. For government procurement, no — the RHQ rules exist specifically to end that arrangement.' },
      { q: 'Is personal income tax really zero?', a: 'Yes. Saudi Arabia levies no personal income tax on salaries. The 20% rate applies to corporate profits, and RHQ holders are exempt from that for 30 years.' },
    ],
  },
  {
    id: 'country-bahrain',
    name: 'Bahrain',
    slug: 'bahrain',
    flag: '🇧🇭',
    region: 'Middle East',
    tax: '0% corporate',
    timeline: '3–5 days',
    from_price: '$4,200',
    headline: 'Genuine 0% corporate tax with a causeway into Saudi Arabia.',
    intro:
      'Bahrain levies no corporate income tax on most activities, allows 100% foreign ownership across the majority of sectors, and sits 25 kilometres from the Saudi Eastern Province by road — which makes it the low-overhead base for founders serving the Saudi market.',
    facts: [
      { label: 'Foreign ownership', value: '100% in most commercial activities' },
      { label: 'Corporate tax', value: '0% (oil and gas excepted)' },
      { label: 'Personal income tax', value: '0%' },
      { label: 'VAT', value: '10%' },
      { label: 'Minimum share capital', value: 'BHD 1,000 for a WLL, no deposit required' },
      { label: 'Audit requirement', value: 'Mandatory, annually' },
      { label: 'Banking timeline', value: '3–5 weeks' },
      { label: 'Saudi access', value: 'King Fahd Causeway, roughly one hour to Dammam' },
      { label: 'Operating cost', value: 'Roughly 30–40% below comparable Dubai overhead' },
      { label: 'Currency', value: 'BHD, pegged to USD at 0.376' },
    ],
    benefits: [
      { title: 'No corporate income tax at all', description: 'Unlike the UAE\'s conditional 0%, Bahrain simply does not levy corporate income tax on most activities — there is no qualifying-income test to satisfy.' },
      { title: 'Lowest overhead in the GCC', description: 'Office space, salaries and licensing all run materially below Dubai, which extends runway for early-stage operations.' },
      { title: 'Saudi market on a day trip', description: 'The King Fahd Causeway makes Dammam and Al Khobar same-day destinations, without a Saudi entity.' },
      { title: 'Mature financial regulator', description: 'The Central Bank of Bahrain is the region\'s oldest financial regulator and runs a well-regarded fintech regulatory sandbox.' },
      { title: 'No restriction on hiring foreign staff', description: 'Localisation requirements are lighter than Saudi Nitaqat, which suits small international teams.' },
    ],
    requirements: [
      'Passport copies for all shareholders and the nominated director',
      'Proof of residential address for each shareholder',
      'Proposed company name for Ministry of Industry and Commerce reservation',
      'Memorandum and articles of association',
      'Registered office lease or virtual office agreement in Bahrain',
      'Curriculum vitae for the general manager',
      'Parent company registration documents where a corporate shareholder applies',
    ],
    body:
      '<p>Bahrain is the GCC\'s quiet value play. It offers something the UAE cannot: a flat, unconditional 0% corporate income tax on most activities, with no qualifying-income test, no de minimis threshold and no substance regime to fail.</p><h3>Who it suits</h3><p>Founders whose economics are sensitive to overhead, and businesses whose real customer is Saudi Arabia. A Bahrain WLL costs less to establish and less to run than a comparable Dubai structure, and the causeway means a Riyadh or Dammam client meeting is a drive rather than a flight.</p><h3>The trade-offs to price in</h3><p>Bahrain\'s brand recognition with international banks and payment processors is narrower than the UAE\'s — expect to explain the jurisdiction more often. VAT is 10% rather than 5%. And an annual audit is mandatory regardless of size, so build that into the running cost from year one.</p><h3>How it is usually combined</h3><p>A common pattern is a Bahrain WLL as the operating company for Saudi-facing delivery, paired with a UAE free zone entity where international banking or a recognised holding vehicle is needed.</p>',
    faq: [
      { q: 'Is Bahrain\'s 0% corporate tax conditional like the UAE\'s QFZP regime?', a: 'No. Bahrain does not levy corporate income tax on most commercial activities at all, so there is no qualifying-income or substance test to satisfy. Oil, gas and hydrocarbon extraction are the exception.' },
      { q: 'Do I need a local Bahraini partner?', a: 'Not for most commercial activities — 100% foreign ownership is permitted. A small number of reserved sectors still require local participation, which we check against your activity before filing.' },
      { q: 'Can I use a Bahrain company to serve Saudi clients?', a: 'For private-sector work, yes, and the causeway makes delivery practical. Saudi government procurement still requires a Saudi entity with RHQ status.' },
      { q: 'How does Bahrain banking compare to the UAE?', a: 'The Central Bank of Bahrain is well regarded and account opening takes three to five weeks. The bank shortlist is smaller than the UAE\'s and international counterparties recognise Bahrain less readily, which occasionally adds friction with payment processors.' },
      { q: 'What are the annual obligations?', a: 'Commercial registration renewal, a mandatory annual audit, VAT filing where you are registered, and maintenance of the registered office. There is no corporate tax return for exempt activities.' },
    ],
  },
  {
    id: 'country-oman',
    name: 'Oman',
    slug: 'oman',
    flag: '🇴🇲',
    region: 'Middle East',
    tax: '15% mainland / 0% in free zones',
    timeline: '4–6 days',
    from_price: '$4,900',
    headline: 'Maritime logistics, industrial licensing and a US free trade agreement.',
    intro:
      'Oman combines Indian Ocean port access at Duqm, Sohar and Salalah with special economic zones offering long corporate tax holidays — and it is the only GCC state with a bilateral free trade agreement with the United States.',
    facts: [
      { label: 'Foreign ownership', value: '100% in most activities since the 2020 FID Law' },
      { label: 'Corporate tax', value: '15% mainland; 0% for up to 30 years in Duqm and Sohar' },
      { label: 'Personal income tax', value: '0%' },
      { label: 'VAT', value: '5%' },
      { label: 'Minimum share capital', value: 'None for most LLC activities' },
      { label: 'Audit requirement', value: 'Mandatory, annually' },
      { label: 'Banking timeline', value: '3–6 weeks' },
      { label: 'Omanisation', value: 'Sector-banded local hiring quotas apply' },
      { label: 'US market access', value: 'US–Oman FTA, duty-free on qualifying goods' },
      { label: 'Currency', value: 'OMR, pegged to USD at 0.3845' },
    ],
    benefits: [
      { title: 'Free zone tax holidays up to 30 years', description: 'Duqm, Sohar and Salalah grant extended corporate tax exemptions plus customs duty relief on imported plant and raw materials.' },
      { title: 'The only GCC–US free trade agreement', description: 'Qualifying goods manufactured in Oman enter the United States duty-free, which no other GCC jurisdiction offers.' },
      { title: 'Deep-water port infrastructure', description: 'Duqm and Salalah sit outside the Strait of Hormuz, which materially de-risks shipping routes versus Gulf-side ports.' },
      { title: '100% foreign ownership', description: 'The Foreign Investment Law removed the local-partner requirement across the great majority of activities.' },
      { title: 'Genuine industrial licensing', description: 'Manufacturing, processing and warehousing licences are straightforward here in a way they are not in most UAE free zones.' },
    ],
    requirements: [
      'Passport copies for all shareholders and the appointed manager',
      'Proof of residential address for each shareholder',
      'Three proposed trade names for Ministry of Commerce reservation',
      'Constitutive contract and articles of association',
      'Registered office lease in Oman or within the chosen economic zone',
      'Business plan where a free zone or industrial licence is sought',
      'Attested parent company documents where a corporate shareholder applies',
    ],
    body:
      '<p>Oman is a specialist choice rather than a default one. It wins on two specific axes: physical logistics and manufacturing economics.</p><h3>Ports outside the Strait of Hormuz</h3><p>Duqm and Salalah face the Indian Ocean directly, which means cargo does not transit the Strait of Hormuz. For shipping, energy services and anything with a real supply chain, that is a tangible risk reduction rather than a marketing line.</p><h3>The free trade agreement nobody uses</h3><p>Oman holds the only bilateral free trade agreement between a GCC state and the United States. Goods that satisfy the rules of origin enter the US duty-free. For a manufacturer or assembler selling into North America, that advantage can outweigh the 15% mainland corporate tax rate outright.</p><h3>Where it is weaker</h3><p>Mainland Oman levies 15% corporate tax, so it is not the jurisdiction for a pure holding or IP structure — that belongs in a UAE free zone. Omanisation quotas apply and tighten by sector. Banking is functional but slower and narrower than the UAE.</p>',
    faq: [
      { q: 'Why choose Oman over the UAE?', a: 'Three reasons: deep-water ports outside the Strait of Hormuz, the US free trade agreement for manufactured goods, and genuinely workable industrial and warehousing licences. For consulting, SaaS or holding structures, a UAE free zone is the better answer.' },
      { q: 'Is the 0% free zone rate automatic?', a: 'It is granted by zone and by activity, typically for a defined period of up to 30 years in Duqm and Sohar. Mainland companies pay the 15% standard rate, so the zone choice determines the outcome.' },
      { q: 'Do I need an Omani partner?', a: 'No. The 2020 Foreign Investment Law permits 100% foreign ownership across most activities. A small reserved list remains, which we verify against your specific activity.' },
      { q: 'How strict is Omanisation?', a: 'Quotas are set by sector and headcount band and are enforced through the work visa system — non-compliance blocks new visa issuance. For small international teams the burden is manageable, but it needs planning before hiring starts.' },
    ],
  },
  {
    id: 'country-qatar',
    name: 'Qatar',
    slug: 'qatar',
    flag: '🇶🇦',
    region: 'Middle East',
    tax: '10% mainland / 0% QFC concessions',
    timeline: '5–7 days',
    from_price: '$6,800',
    headline: 'English common law, the highest GDP per capita in the region.',
    intro:
      'The Qatar Financial Centre operates its own English-common-law legal system, its own courts and its own tax regime — which gives financial, professional and advisory firms a familiar contractual environment inside the wealthiest consumer market in the GCC.',
    facts: [
      { label: 'Foreign ownership', value: '100% in the QFC and most mainland activities' },
      { label: 'Corporate tax', value: '10% on local-source profits; QFC concessions available' },
      { label: 'Personal income tax', value: '0%' },
      { label: 'VAT', value: 'Not yet implemented' },
      { label: 'Legal system', value: 'English common law within the QFC' },
      { label: 'Minimum share capital', value: 'None for most QFC licences' },
      { label: 'Audit requirement', value: 'Mandatory, annually' },
      { label: 'Banking timeline', value: '4–6 weeks' },
      { label: 'GDP per capita', value: 'Highest in the GCC' },
      { label: 'Currency', value: 'QAR, pegged to USD at 3.64' },
    ],
    benefits: [
      { title: 'English common law inside the QFC', description: 'Contracts, shareholder agreements and dispute resolution run on principles international counsel already understands, with an independent QFC civil and commercial court.' },
      { title: 'No VAT yet', description: 'Qatar has not implemented VAT, which is a real working-capital advantage over the UAE at 5%, Bahrain at 10% and Saudi Arabia at 15%.' },
      { title: 'Exceptional purchasing power', description: 'The highest GDP per capita in the region, which supports premium pricing in professional services and consumer segments.' },
      { title: '100% foreign ownership with full repatriation', description: 'QFC entities hold full foreign ownership and repatriate profits without restriction.' },
      { title: 'Sustained infrastructure spend', description: 'Post-2022 diversification and North Field LNG expansion continue to drive advisory, engineering and technology demand.' },
    ],
    requirements: [
      'Passport copies for all shareholders, directors and the senior executive function',
      'Proof of residential address for each individual',
      'Proposed name for QFC or Ministry of Commerce reservation',
      'Business plan and financial projections for the QFC application',
      'Professional curriculum vitae for each controlled-function holder',
      'Parent company certificate of incorporation and audited accounts where applicable',
      'Registered office arrangement in Doha or within the QFC',
    ],
    body:
      '<p>Qatar\'s appeal is structural rather than purely fiscal. The Qatar Financial Centre is a separate jurisdiction inside the country, running English common law, its own courts and its own tax rules — comparable in design to the DIFC or ADGM, but attached to the highest per-capita income in the region.</p><h3>QFC versus mainland</h3><p>A <strong>QFC</strong> licence suits financial services, professional services, advisory, holding and treasury functions: common law, familiar documentation, 100% ownership and no local partner. A <strong>mainland</strong> licence is needed for retail, construction, contracting and anything requiring direct government contracting outside the QFC perimeter.</p><h3>The VAT point is real</h3><p>Qatar has not implemented VAT. Against 5% in the UAE, 10% in Bahrain and 15% in Saudi Arabia, that is a genuine cash-flow difference for a services business invoicing locally — though it is a matter of policy timing rather than a permanent guarantee.</p><h3>What to watch</h3><p>Corporate tax at 10% applies to local-source profits, so Qatar is not a substitute for a 0% holding jurisdiction. Bank onboarding takes four to six weeks and the compliance file is examined closely. Most clients hold Qatar as an operating entity beneath a UAE free zone holding company.</p>',
    faq: [
      { q: 'What is the difference between the QFC and mainland Qatar?', a: 'The QFC is a separate legal jurisdiction inside Qatar running English common law, with its own courts, its own registrar and its own tax regime. Mainland companies operate under Qatari civil law through the Ministry of Commerce and Industry. Financial and professional firms almost always want the QFC.' },
      { q: 'Does Qatar have VAT?', a: 'Not currently. Qatar has not implemented a VAT regime, unlike the rest of the GCC. Treat that as a timing advantage rather than a permanent feature.' },
      { q: 'Can I own 100% of a Qatari company?', a: 'Yes in the QFC, and in most mainland activities following the 2019 foreign investment reforms. Some sectors retain local participation requirements.' },
      { q: 'Is Qatar a good holding jurisdiction?', a: 'Generally no. The 10% rate on local-source profits means a UAE free zone entity is the better holding vehicle. Qatar works best as the operating company where the customers are.' },
    ],
  },
  {
    id: 'country-singapore',
    name: 'Singapore',
    slug: 'singapore',
    flag: '🇸🇬',
    region: 'Asia Pacific',
    tax: '17% headline, effective 4–8% for startups',
    timeline: '1–2 days',
    from_price: '$3,800',
    headline: 'The most bankable jurisdiction in Asia, and the widest treaty network.',
    intro:
      'Singapore incorporates in a day, carries over 90 double tax treaties, and holds a reputation with banks, investors and payment processors that no GCC jurisdiction matches — at the cost of a 17% headline corporate rate and a resident director requirement.',
    facts: [
      { label: 'Foreign ownership', value: '100%' },
      { label: 'Corporate tax', value: '17% headline; start-up exemption cuts the effective rate to 4–8%' },
      { label: 'Personal income tax', value: 'Progressive, 0–24%' },
      { label: 'GST', value: '9% (registration from SGD 1m turnover)' },
      { label: 'Minimum share capital', value: 'SGD 1' },
      { label: 'Resident director', value: 'At least one required' },
      { label: 'Audit requirement', value: 'Exempt if small-company criteria are met' },
      { label: 'Banking timeline', value: '1–3 weeks' },
      { label: 'Tax treaties', value: 'Over 90 in force' },
      { label: 'Currency', value: 'SGD, free floating' },
    ],
    benefits: [
      { title: 'Start-up tax exemption', description: 'Qualifying new companies receive substantial exemptions on their first SGD 200,000 of chargeable income for three years, pulling the effective rate to roughly 4–8%.' },
      { title: 'Unmatched banking credibility', description: 'DBS, OCBC and UOB accounts are accepted everywhere, and Stripe, PayPal and the major processors treat Singapore entities as tier-one.' },
      { title: 'The widest treaty network in Asia', description: 'Over 90 double tax treaties, which materially reduces withholding tax on cross-border royalties, dividends and service fees.' },
      { title: 'Investor-ready by default', description: 'Venture capital and private equity are comfortable with Singapore holding structures, ACRA filings and standard SAFE documentation.' },
      { title: 'One-day incorporation', description: 'ACRA registration completes within 24 hours once the name is approved and KYC clears.' },
    ],
    requirements: [
      'Passport copy and proof of address for every shareholder and director',
      'At least one Singapore-resident director (nominee director service available)',
      'Proposed company name for ACRA approval',
      'Registered Singapore office address',
      'Company constitution',
      'Appointment of a qualified company secretary within six months',
      'Description of the intended business activity mapped to an SSIC code',
    ],
    body:
      '<p>Singapore is the jurisdiction to pick when credibility matters more than the headline tax rate. If you are raising institutional capital, selling enterprise software to Fortune 500 buyers, or need payment rails that never get questioned, Singapore removes friction that a GCC entity sometimes introduces.</p><h3>The rate is not really 17%</h3><p>The 17% headline figure overstates the real burden for early-stage companies. The start-up exemption scheme substantially exempts the first tranche of chargeable income for the first three years, and the partial exemption continues afterwards. Effective rates of 4–8% are normal for a company under roughly SGD 200,000 of profit.</p><h3>What the GCC does better</h3><p>Two things. Personal tax: Singapore taxes individual income progressively up to 24%, whereas the UAE, Bahrain, Qatar, Oman and Saudi Arabia levy none. And residency cost: an Employment Pass is harder to obtain and more expensive to maintain than a UAE investor visa. For a founder who wants to draw income personally at 0%, the UAE wins outright.</p><h3>The resident director requirement</h3><p>Every Singapore company needs at least one director ordinarily resident in Singapore. Non-resident founders use a nominee director service, which is routine, regulated and priced as an annual fee.</p>',
    faq: [
      { q: 'Do I really pay 17%?', a: 'Rarely, early on. The start-up exemption substantially exempts the first SGD 200,000 of chargeable income for three years, and partial exemption applies afterwards. Effective rates of 4–8% are typical below roughly SGD 200,000 of profit.' },
      { q: 'Do I need a Singapore resident director?', a: 'Yes — at least one director must be ordinarily resident in Singapore. Non-resident founders use a regulated nominee director service, charged annually.' },
      { q: 'Singapore or a UAE free zone?', a: 'Singapore if you are raising institutional capital, selling to enterprise buyers, or need frictionless payment processing. A UAE free zone if your priority is 0% personal income tax, 0% corporate tax on qualifying income, and low-cost residency.' },
      { q: 'Can I open a Singapore bank account remotely?', a: 'Increasingly yes, particularly with the digital-first providers. The traditional banks may request one in-person meeting depending on the activity and ownership profile.' },
    ],
  },
  {
    id: 'country-hongkong',
    name: 'Hong Kong',
    slug: 'hongkong',
    flag: '🇭🇰',
    region: 'Asia Pacific',
    tax: '8.25% / 16.5%, offshore profits exempt',
    timeline: '2–3 days',
    from_price: '$3,200',
    headline: 'Territorial taxation — profits earned outside Hong Kong can be exempt entirely.',
    intro:
      'Hong Kong taxes only profits sourced in Hong Kong. For a trading, ecommerce or sourcing business whose customers and suppliers sit elsewhere, a successful offshore profits claim can bring the effective rate to zero.',
    facts: [
      { label: 'Foreign ownership', value: '100%' },
      { label: 'Corporate tax', value: '8.25% on the first HKD 2m, 16.5% thereafter' },
      { label: 'Offshore profits', value: 'Exempt where an offshore claim is accepted' },
      { label: 'Personal income tax', value: 'Progressive, capped at 15%' },
      { label: 'VAT / GST', value: 'None' },
      { label: 'Minimum share capital', value: 'HKD 1' },
      { label: 'Audit requirement', value: 'Mandatory, annually' },
      { label: 'Banking timeline', value: '4–8 weeks' },
      { label: 'China access', value: 'Direct mainland trade and CEPA preferences' },
      { label: 'Currency', value: 'HKD, pegged to USD at 7.8' },
    ],
    benefits: [
      { title: 'Territorial tax system', description: 'Only Hong Kong-sourced profits are chargeable. Where an offshore claim is properly substantiated and accepted, the effective rate on foreign-sourced profit is zero.' },
      { title: 'No sales tax at all', description: 'No VAT, no GST, no sales tax — a structural advantage for high-volume goods trading.' },
      { title: 'The natural China sourcing vehicle', description: 'Unmatched for founders manufacturing or sourcing in mainland China, with CEPA preferences and direct RMB settlement.' },
      { title: 'Two-tier profits tax', description: 'The first HKD 2 million of assessable profits is taxed at 8.25%, half the standard rate.' },
      { title: 'Free flow of capital', description: 'No exchange controls and no restriction on moving funds in or out.' },
    ],
    requirements: [
      'Passport copy and proof of residential address for every shareholder and director',
      'Proposed English and optional Chinese company name',
      'Registered Hong Kong office address',
      'Appointment of a Hong Kong company secretary',
      'Articles of association',
      'Significant Controllers Register maintained at the registered office',
      'Business description and expected trade flows for the bank application',
    ],
    body:
      '<p>Hong Kong runs a territorial tax system, and that single feature is why founders use it. Profits sourced outside Hong Kong are not chargeable to Hong Kong profits tax. For a business buying in Shenzhen and selling in Europe, none of the profit-generating activity happens in Hong Kong — and an offshore claim, properly filed and evidenced, can bring the rate to zero.</p><h3>Offshore claims need real evidence</h3><p>The Inland Revenue Department scrutinises offshore claims. You need contracts, correspondence, shipping documentation and a coherent account of where negotiation and conclusion actually occurred. This is a documentation discipline maintained from day one, not a box ticked at year end. Done properly it holds; done casually it fails on review.</p><h3>Banking is the hard part</h3><p>Hong Kong company formation takes two to three days. Bank account opening takes four to eight weeks and is where most applications stall — the traditional banks apply heavy scrutiny to non-resident ownership and to any mainland China nexus. Neobank providers have improved the picture considerably.</p><h3>Compared with a UAE free zone</h3><p>Hong Kong is stronger for physical goods trading with a China supply chain. A UAE free zone is stronger for services, personal residency and 0% personal income tax. Trading businesses commonly run both: Hong Kong for the goods flow, UAE for residency and treasury.</p>',
    faq: [
      { q: 'Is Hong Kong genuinely a 0% jurisdiction?', a: 'Only on foreign-sourced profits, and only where an offshore claim is accepted by the Inland Revenue Department. Hong Kong-sourced profits are taxed at 8.25% up to HKD 2 million and 16.5% above that. The claim requires contemporaneous evidence.' },
      { q: 'How hard is Hong Kong bank account opening?', a: 'It is the main constraint. Expect four to eight weeks, and expect close scrutiny of non-resident shareholders. Digital providers have made this substantially easier than it was five years ago.' },
      { q: 'Does Hong Kong have VAT?', a: 'No. There is no VAT, GST or sales tax, which is a real advantage for high-volume goods trading.' },
      { q: 'Hong Kong or a UAE free zone for ecommerce?', a: 'Hong Kong if your supply chain runs through mainland China and you can support an offshore profits claim. A UAE free zone if you want personal residency, 0% personal income tax and simpler banking. Many sellers use both.' },
    ],
  },
  {
    id: 'country-ireland',
    name: 'Ireland',
    slug: 'ireland',
    flag: '🇮🇪',
    region: 'Europe',
    tax: '12.5% trading rate',
    timeline: '5–10 days',
    from_price: '$3,900',
    headline: 'EU market access at 12.5%, with an English-speaking common law system.',
    intro:
      'Ireland is the lowest-tax route into the European single market for a trading company: a 12.5% rate on trading profits, EU VAT registration, common law contracts in English, and full access to the EU’s treaty and directive network.',
    facts: [
      { label: 'Foreign ownership', value: '100%' },
      { label: 'Corporate tax', value: '12.5% on trading profits, 25% on passive income' },
      { label: 'Personal income tax', value: 'Progressive, up to 40% plus USC and PRSI' },
      { label: 'VAT', value: '23% standard, EU VAT number available' },
      { label: 'Minimum share capital', value: 'EUR 1' },
      { label: 'EEA-resident director', value: 'Required, or a EUR 25,000 non-resident bond' },
      { label: 'Audit requirement', value: 'Exempt if small-company criteria are met' },
      { label: 'Banking timeline', value: '3–6 weeks' },
      { label: 'Legal system', value: 'Common law, English language' },
      { label: 'Currency', value: 'EUR' },
    ],
    benefits: [
      { title: 'Lowest trading rate in Western Europe', description: '12.5% on trading profits, versus 25% in the UK, 25% in France and roughly 30% in Germany.' },
      { title: 'Full EU single market access', description: 'An Irish company sells across all 27 member states without customs friction, with an EU VAT number and access to the EU directives.' },
      { title: 'Common law in English', description: 'Contracts, corporate documentation and dispute resolution follow common law principles in English — unusual for an EU jurisdiction and valuable for US and UK founders.' },
      { title: 'Research and development credit', description: 'A 30% refundable credit on qualifying R&D expenditure, claimable even in a loss-making year.' },
      { title: 'Extensive treaty network', description: 'Over 70 double tax treaties, including a favourable position with the United States.' },
    ],
    requirements: [
      'Passport copy and proof of address for every shareholder and director',
      'At least one EEA-resident director, or a EUR 25,000 Section 137 bond',
      'Proposed company name for CRO approval',
      'Registered office address in Ireland',
      'Company constitution',
      'Form A1 with the declared business activity and NACE code',
      'Details of beneficial owners for the RBO register',
    ],
    body:
      '<p>Ireland is the answer when you need to be inside the European Union. Post-Brexit, a UK company no longer provides frictionless single-market access, and Ireland is the lowest-tax, English-speaking, common-law route in.</p><h3>12.5% applies to trading profits only</h3><p>The 12.5% rate covers active trading income. Passive income — rents, most royalties, investment returns — is charged at 25%. Ireland is therefore a strong operating jurisdiction and a weak pure holding jurisdiction, which is the reverse of a UAE free zone.</p><h3>The director requirement</h3><p>An Irish company needs at least one director resident in the EEA. Founders outside the EEA either appoint an EEA-resident director or post a EUR 25,000 Section 137 bond. The bond is a standard, priced product rather than an obstacle.</p><h3>Where the GCC is better</h3><p>Personal taxation. Irish personal income tax reaches 40% before USC and PRSI, against 0% in the UAE, Bahrain and Qatar. Ireland suits founders whose customers are European and who need EU VAT and EU credibility — not founders optimising personal take-home.</p>',
    faq: [
      { q: 'Does the 12.5% rate apply to all income?', a: 'No. It applies to trading profits. Passive income such as rents and most royalties is taxed at 25%, which is why Ireland works better as an operating company than as a holding vehicle.' },
      { q: 'Do I need an Irish or EEA director?', a: 'At least one director must be EEA-resident. Non-EEA founders can instead post a EUR 25,000 Section 137 bond, which is a standard annual product.' },
      { q: 'Why Ireland rather than the UK after Brexit?', a: 'EU membership. An Irish company trades across all 27 member states without customs friction and holds an EU VAT number. A UK company no longer does, and the UK rate is 25% against Ireland\'s 12.5%.' },
      { q: 'Can I combine Ireland with a UAE structure?', a: 'Yes, and it is common: an Irish operating company for EU customers and VAT, with a UAE free zone entity for residency and regional treasury. The interaction needs transfer pricing and substance advice in both jurisdictions.' },
    ],
  },
  {
    id: 'country-bvi-cayman',
    name: 'BVI & Cayman',
    slug: 'bvi-cayman',
    flag: '🇻🇬',
    region: 'Caribbean',
    tax: '0% — no corporate income tax',
    timeline: '3–5 days',
    from_price: '$2,900',
    headline: 'Tax-neutral holding and fund vehicles that investors already understand.',
    intro:
      'The British Virgin Islands and the Cayman Islands levy no corporate income tax, no capital gains tax and no withholding tax. They are not trading jurisdictions — they are the standard vehicles for holding companies, joint ventures, funds and token structures.',
    facts: [
      { label: 'Foreign ownership', value: '100%' },
      { label: 'Corporate tax', value: '0% — none levied' },
      { label: 'Capital gains tax', value: '0%' },
      { label: 'Withholding tax', value: '0%' },
      { label: 'Minimum share capital', value: 'USD 1' },
      { label: 'Public shareholder register', value: 'No — not publicly searchable' },
      { label: 'Audit requirement', value: 'None for a standard BVI business company' },
      { label: 'Economic substance', value: 'Reporting applies to relevant activities' },
      { label: 'Banking', value: 'Opened outside the jurisdiction, usually UAE or Singapore' },
      { label: 'Currency', value: 'USD' },
    ],
    benefits: [
      { title: 'True tax neutrality', description: 'No corporate income tax, no capital gains tax and no withholding tax, so the vehicle adds no tax layer between an asset and its owners.' },
      { title: 'The market standard for holding structures', description: 'Investors, funds and acquirers recognise BVI and Cayman documentation immediately, which shortens diligence on a raise or an exit.' },
      { title: 'Confidential ownership', description: 'Shareholder registers are not publicly searchable, though beneficial ownership is disclosed to the authorities and exchanged under CRS.' },
      { title: 'Cayman for funds', description: 'The Cayman exempted company and segregated portfolio company are the default structures for hedge funds, venture funds and token issuance.' },
      { title: 'Fast, low-maintenance formation', description: 'Incorporation in three to five days, no audit obligation for a standard BVI business company, and minimal annual filings.' },
    ],
    requirements: [
      'Certified passport copy for each beneficial owner and director',
      'Certified proof of residential address issued within three months',
      'Bank or professional reference letter for each beneficial owner',
      'Source of funds and source of wealth declaration',
      'Proposed company name for registry check',
      'Structure chart identifying all beneficial owners above 10%',
      'Registered agent appointment in the jurisdiction',
    ],
    body:
      '<p>BVI and Cayman companies do one job extremely well: they hold things without adding a tax layer. They are not trading jurisdictions, they do not provide residency, and they cannot open a local bank account in any meaningful sense.</p><h3>What they are actually used for</h3><p>Holding shares in operating subsidiaries. Housing intellectual property. Structuring joint ventures where the partners sit in different countries and want neutral ground. Cayman specifically dominates fund formation — the exempted company and the segregated portfolio company are what institutional investors expect to see.</p><h3>Where founders get it wrong</h3><p>Treating an offshore company as a way to avoid tax where they live. It does not work that way. Controlled foreign company rules, place-of-management tests and economic substance reporting all bite, and a BVI company managed from London or New York is generally taxable where it is managed. These vehicles are neutral wrappers, not exemptions.</p><h3>How they pair with the GCC</h3><p>The durable structure is a BVI or Cayman holding company owning a UAE free zone operating entity, with the founder tax-resident in the UAE. Then the neutrality is real, because there is no higher-tax home jurisdiction reaching through. Offshore alone, with the founder resident in a high-tax country, mostly buys complexity.</p>',
    faq: [
      { q: 'Can a BVI or Cayman company trade?', a: 'It can contract, but it has no local market, no residency and no local banking. It is designed to hold assets and shares. Trading belongs in an operating jurisdiction such as a UAE free zone.' },
      { q: 'Is ownership genuinely private?', a: 'The shareholder register is not publicly searchable. Beneficial ownership is disclosed to the registered agent and the authorities, and is exchanged with tax authorities under the Common Reporting Standard. It is confidentiality, not secrecy.' },
      { q: 'Where does an offshore company bank?', a: 'Outside the jurisdiction — typically the UAE, Singapore or Switzerland, depending on the activity and the beneficial owners\' residency. We arrange the account alongside the incorporation.' },
      { q: 'Does economic substance apply to me?', a: 'It applies to companies carrying on relevant activities — holding, financing, IP, shipping, headquarters, distribution and service centres. A pure equity holding company faces a reduced test, but reporting is still required annually.' },
      { q: 'Will an offshore company reduce my personal tax?', a: 'Not by itself. If you are tax-resident in a country with controlled foreign company rules, the profits are likely attributed to you regardless. The structure works when it is paired with a genuine change in your own tax residency.' },
    ],
  },
]

const BLOCKS_BY_SLUG = new Map<string, PuckBlocks>()
const BY_SLUG = new Map<string, CountrySeed>()

for (const seed of SEEDS) {
  BY_SLUG.set(seed.slug, seed)
  BLOCKS_BY_SLUG.set(seed.slug, countryBlocks(seed))
}

/** Aliases so historic and shorthand URLs resolve instead of 404ing. */
const SLUG_ALIASES: Record<string, string> = {
  ksa: 'saudi-arabia',
  saudi: 'saudi-arabia',
  'united-arab-emirates': 'uae',
  dubai: 'uae',
  'hong-kong': 'hongkong',
}

function resolveSlug(slug: string): string {
  const key = slug.trim().toLowerCase()
  return SLUG_ALIASES[key] ?? key
}

/** Full static country record in the shape the `[slug]` route expects. Returns `any`
 * to mirror `getCountryBySlug()` in lib/directus, so the route needs no cast. */
export function staticCountry(slug: string): any {
  const seed = BY_SLUG.get(resolveSlug(slug))
  if (!seed) return null

  return {
    ...recordTail(),
    ...seoTail({
      aeo_llm_summary: seed.intro,
      seo_meta_title: `${seed.name} Company Formation — Cost, Timeline & Tax`,
      seo_meta_description: `${seed.headline} Corporate tax ${seed.tax}, setup in ${seed.timeline}, packages from ${seed.from_price}.`,
      internal_links: [
        { label: 'Compare jurisdictions', url: '/compare' },
        { label: 'Formation pricing', url: '/pricing' },
        { label: 'Corporate tax calculator', url: '/tools/tax-calculator' },
      ],
      external_citations:
        seed.slug === 'saudi-arabia' ? [CITATION_MISA] : seed.slug === 'uae' ? [CITATION_FTA, CITATION_MOE] : [CITATION_FTA],
    }),
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    flag: seed.flag,
    region: seed.region,
    tax: seed.tax,
    timeline: seed.timeline,
    from_price: seed.from_price,
    headline: seed.headline,
    intro: seed.intro,
    facts: seed.facts,
    faq: seed.faq,
    blocks: BLOCKS_BY_SLUG.get(seed.slug) ?? { content: [], root: {} },
  }
}

/** Lightweight summaries for hub pages, comparison tables and cost guides. */
export function staticCountrySummaries(): Array<{
  id: string
  name: string
  slug: string
  flag: string
  region: string
  tax: string
  timeline: string
  from_price: string
  headline: string
  intro: string
  facts: Fact[]
}> {
  return SEEDS.map((seed) => ({
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    flag: seed.flag,
    region: seed.region,
    tax: seed.tax,
    timeline: seed.timeline,
    from_price: seed.from_price,
    headline: seed.headline,
    intro: seed.intro,
    facts: seed.facts,
  }))
}

export function staticCountrySlugs(): string[] {
  return SEEDS.map((seed) => seed.slug)
}

export { SEEDS as COUNTRY_SEEDS, countryBlocks, type CountrySeed }
