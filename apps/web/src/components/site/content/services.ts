import { seoTail, recordTail, CITATION_FTA, type FaqEntry, type PuckBlocks } from './seo'

// Static service pages for the six slugs linked from the primary navigation and the
// footer. `getServiceBySlug()` returns null on a fresh install, which would 404 every
// "Services" dropdown item — these records keep those routes rendering real content.

export type ServiceSeed = {
  id: string
  name: string
  slug: string
  tagline: string
  intro: string
  priceFrom: string
  timeline: string
  benefits: Array<{ title: string; description: string }>
  includes: string[]
  requirements: string[]
  body: string
  faq: FaqEntry[]
}

function serviceBlocks(seed: ServiceSeed): PuckBlocks {
  return {
    content: [
      {
        type: 'Subhero',
        props: {
          id: `${seed.slug}-subhero`,
          eyebrow: 'Service',
          title: seed.tagline,
          description: seed.intro,
          image: '',
          ctaText: 'Request a fixed quote',
          ctaLink: '/#lead-form',
        },
      },
      {
        type: 'RichText',
        props: {
          id: `${seed.slug}-facts`,
          headingLevel: 'none',
          heading: '',
          body: `<table style="width:100%;border-collapse:collapse"><tbody><tr><th scope="row" style="text-align:left;width:42%">Starting from</th><td>${seed.priceFrom}</td></tr><tr><th scope="row" style="text-align:left">Typical timeline</th><td>${seed.timeline}</td></tr></tbody></table>`,
          narrow: true,
        },
      },
      {
        type: 'RichText',
        props: {
          id: `${seed.slug}-body`,
          headingLevel: 'h2',
          heading: `How ${seed.name.toLowerCase()} works`,
          body: seed.body,
          narrow: true,
        },
      },
      {
        type: 'BenefitGrid',
        props: {
          id: `${seed.slug}-benefits`,
          eyebrow: 'What you get',
          title: `Why clients use us for ${seed.name.toLowerCase()}`,
          accent: 'orange',
          benefits: seed.benefits.map((b) => ({ title: b.title, description: b.description, image: '' })),
        },
      },
      {
        type: 'RichText',
        props: {
          id: `${seed.slug}-includes`,
          headingLevel: 'h2',
          heading: "What's included",
          body: `<ul>${seed.includes.map((item) => `<li>${item}</li>`).join('')}</ul>`,
          narrow: true,
        },
      },
      {
        type: 'RequirementsList',
        props: {
          id: `${seed.slug}-requirements`,
          eyebrow: "What you'll need",
          title: 'Document checklist',
          description: `Everything required to start. We confirm the exact list against your activity before you pay anything.`,
          requirements: seed.requirements.map((item) => ({ item })),
        },
      },
      {
        type: 'Faq',
        props: {
          id: `${seed.slug}-faq`,
          title: `${seed.name} questions`,
          contactTitle: 'Need something specific?',
          contactDescription: 'Send us the detail and an advisor will confirm feasibility and cost.',
          contactButtonText: 'Book a call',
          contactButtonLink: '/book-consultation',
          faqs: seed.faq,
        },
      },
      {
        type: 'GlobalCta',
        props: {
          id: `${seed.slug}-cta`,
          headline: `Get ${seed.name.toLowerCase()} handled`,
          subhead: `Fixed fees, no hidden charges, and a named advisor from start to finish. From ${seed.priceFrom}.`,
          primaryBtn: 'Request a quote',
          primaryLink: '/#lead-form',
          secondaryBtn: 'See pricing',
          secondaryLink: '/pricing',
        },
      },
    ],
    root: {},
  }
}

const SEEDS: ServiceSeed[] = [
  {
    id: 'service-company-registration',
    name: 'Company Registration',
    slug: 'company-registration',
    tagline: 'Trade licence issued in 48 to 72 hours, in the right free zone.',
    intro:
      'End-to-end incorporation across UAE free zones, UAE mainland, Saudi Arabia, Bahrain, Oman, Qatar and offshore. We select the zone against your activity and banking profile rather than against a commission table.',
    priceFrom: '$4,800',
    timeline: '48–72 hours to licence',
    benefits: [
      { title: 'Zone chosen for bankability', description: 'IFZA, Meydan, DMCC, DAFZA, RAKEZ and Shams all read differently to a compliance officer. We pick the zone your bank will accept for your activity.' },
      { title: 'Activity mapped correctly first time', description: 'The single most common cause of a rejected bank application is a licence activity that does not match actual revenue. We map it before filing, not after.' },
      { title: 'QFZP eligibility checked upfront', description: 'We confirm whether your structure can meet the Qualifying Free Zone Person conditions for 0% corporate tax before you commit to a zone.' },
      { title: 'Fixed fee, renewals quoted', description: 'One price covering government fees, registered address and our work — with year-two renewal costs disclosed in the same quote.' },
      { title: 'No travel required to incorporate', description: 'The licence is issued while you are abroad. You only enter the UAE for medical and Emirates ID biometrics if you take the visa.' },
      { title: 'One advisor throughout', description: 'A named specialist owns your file from name reservation to bank introduction.' },
    ],
    includes: [
      'Jurisdiction and free zone selection against your activity and banking profile',
      'Trade name reservation and initial approval',
      'Licence application, MOA and incorporation filings',
      'Registered address and establishment card',
      'Corporate tax registration with the Federal Tax Authority',
      'Bank introduction to two shortlisted institutions',
      'Digital document pack and originals couriered',
      'Year-one compliance calendar with every filing deadline',
    ],
    requirements: [
      'Passport copy for each shareholder and director, valid six months or more',
      'Passport photograph on a white background',
      'Proof of residential address issued within three months',
      'Three proposed trade names in order of preference',
      'Plain-English description of what the business actually does',
      'Curriculum vitae for consultancy or regulated activities',
      'Existing trade licence and board resolution for corporate shareholders',
    ],
    body:
      '<p>Company registration is the easy part. Choosing where to register, and describing the activity in a way that survives a bank\'s compliance review, is the part that determines whether the company actually functions.</p><h3>Step 1 — Structure review</h3><p>We take your activity, customer locations, expected turnover and residency plans, and shortlist two or three viable zones. Where a client is set on a zone that will not bank their activity, we say so at this stage.</p><h3>Step 2 — Name and initial approval</h3><p>Three names are submitted against Ministry of Economy and free zone naming rules. Approval typically lands the same working day.</p><h3>Step 3 — Licence issuance</h3><p>Documents are filed, the MOA is executed, and the trade licence and establishment card issue within 48 to 72 hours in the faster zones.</p><h3>Step 4 — Visa and Emirates ID</h3><p>Where an investor visa is taken: entry permit, medical, biometrics and Emirates ID. Two to three weeks in total, and the only stage requiring your physical presence.</p><h3>Step 5 — Banking and tax registration</h3><p>We prepare the compliance file, introduce you to the shortlisted banks, and complete corporate tax registration with the FTA. Accounts typically open two to four weeks after licence issuance.</p>',
    faq: [
      { q: 'Which free zone should I choose?', a: 'It depends on the activity and on which bank you need. IFZA and Meydan suit consulting, agencies and SaaS at low cost with no audit obligation. DMCC carries the most weight with banks and is effectively required for commodities. DAFZA suits logistics and regulated trade. RAKEZ handles light industrial. Shams is the cheapest credible route for media.' },
      { q: 'Can I register without visiting the UAE?', a: 'Yes. Incorporation is fully remote. You need one visit only if you take the investor visa, for the medical test and Emirates ID biometrics.' },
      { q: 'What is not included in the price?', a: 'Investor visa fees, additional visa allocations, physical office beyond the registered address, attestation of foreign documents, and audit where the zone mandates it. All are quoted separately and up front.' },
      { q: 'How long until I can invoice a client?', a: 'You can invoice as soon as the trade licence issues, typically within 72 hours. Receiving the payment requires the bank account, which takes a further two to four weeks.' },
      { q: 'Do you register mainland companies too?', a: 'Yes. Mainland (DED) licensing is the right route if you need to invoice UAE-based customers directly or hold a physical retail presence. We advise on the trade-off against free zone QFZP eligibility.' },
    ],
  },
  {
    id: 'service-bank-account',
    name: 'Bank Account Setup',
    slug: 'bank-account',
    tagline: 'Corporate accounts that open, because the file is built to pass review.',
    intro:
      'We prepare and place corporate bank applications with Emirates NBD, Mashreq NeoBiz, Wio, FAB and RAKBank. The work is in the compliance file — activity coherence, source of funds and substance evidence — not the application form.',
    priceFrom: '$1,400',
    timeline: '2–4 weeks to account opening',
    benefits: [
      { title: 'Bank matched to your activity', description: 'Each bank has an unpublished appetite by activity, nationality and residency. We place the application where it will actually clear rather than where it is quickest to submit.' },
      { title: 'Compliance file prepared properly', description: 'Business plan, expected transaction flows, counterparty detail, source of wealth and substance evidence — assembled before submission, which is where most applications fail.' },
      { title: 'Non-resident routes where they exist', description: 'Wio and Mashreq NeoBiz onboard selected non-resident shareholders. We know which activities clear and which do not.' },
      { title: 'Rejection recovery', description: 'If you have already been declined, we review the original file, identify the failure point and re-place with a different institution.' },
      { title: 'Multi-currency from day one', description: 'AED, USD, EUR and GBP accounts with international transfers, cards and online banking configured at setup.' },
    ],
    includes: [
      'Bank shortlisting against activity, nationality and residency profile',
      'Full KYC and compliance pack preparation',
      'Business plan and projected transaction flow documentation',
      'Source of funds and source of wealth narrative',
      'Application placement and relationship manager introduction',
      'Interview preparation and briefing',
      'Follow-through on compliance queries until the account is live',
      'Multi-currency, card and online banking activation',
    ],
    requirements: [
      'Trade licence, MOA and certificate of incorporation',
      'Passport and Emirates ID copies for all shareholders and signatories',
      'Six months of personal bank statements for each beneficial owner',
      'Curriculum vitae or professional profile for each beneficial owner',
      'Proof of residential address for each beneficial owner',
      'Draft contracts, invoices or a letter of intent evidencing real trade',
      'Expected annual turnover and a list of main counterparties by country',
    ],
    body:
      '<p>UAE corporate banking is not difficult because the banks are hostile. It is difficult because compliance teams are looking for a coherent story, and most applications do not tell one.</p><h3>What actually gets applications declined</h3><p>A licence activity that does not match the described business. No evidence of real trade. A source of wealth that cannot be traced. Counterparties in jurisdictions the bank has exited. A free zone the bank does not onboard for that activity. None of these are fixable after a rejection is recorded — which is why the file is built before submission.</p><h3>How we place applications</h3><p>Wio and Mashreq NeoBiz are digital-first, fastest, and workable for selected non-residents. Emirates NBD and FAB are conventional, slower, and carry more weight with international counterparties. RAKBank sits between the two. We shortlist two, prepare one file, and place in sequence rather than scattering applications — parallel applications get flagged.</p><h3>Timelines to expect</h3><p>Two to four weeks from submission with a complete file, assuming the trade licence is issued and the Emirates ID is in hand where the bank requires it. Non-resident applications run longer and the shortlist is narrower.</p>',
    faq: [
      { q: 'Can you guarantee the account will open?', a: 'No, and anyone who does is not being straight with you — the decision is the bank\'s alone. What we control is the quality of the file and the choice of institution, which is what determines the outcome in practice.' },
      { q: 'Can I open an account without UAE residency?', a: 'Yes, with a narrower shortlist. Wio and Mashreq NeoBiz onboard selected non-resident shareholders depending on activity and nationality. Conventional banks generally want the Emirates ID first.' },
      { q: 'I was already rejected. Can you help?', a: 'Usually. We review what was submitted, identify why it failed, rebuild the file and place it with a different institution. A prior rejection at one bank does not travel to another, but a weak file will fail again.' },
      { q: 'How much do I need to deposit?', a: 'It varies by bank and account tier. Digital providers often have no minimum balance requirement; conventional banks typically expect AED 25,000 to AED 50,000 as an average balance. We confirm before you apply.' },
      { q: 'Will I have to attend in person?', a: 'Usually once, for signing and identity verification. Some digital providers complete onboarding entirely remotely for lower-risk profiles.' },
    ],
  },
  {
    id: 'service-nominee-ubo',
    name: 'Nominee UBO Service',
    slug: 'nominee-ubo',
    tagline: 'Legitimate ownership privacy, with the control staying entirely with you.',
    intro:
      'A regulated nominee shareholder or director arrangement keeps your name off commercially visible records while you retain full beneficial ownership and control through enforceable documentation. Disclosed to regulators, private from competitors.',
    priceFrom: '$12,500',
    timeline: '5–7 days alongside incorporation',
    benefits: [
      { title: 'Commercial confidentiality', description: 'Your name does not appear on records that competitors, counterparties or data aggregators can reach.' },
      { title: 'Control never leaves you', description: 'A declaration of trust, power of attorney and pre-signed share transfer keep beneficial ownership and decision rights with you at all times.' },
      { title: 'Fully disclosed to authorities', description: 'Beneficial ownership is registered with the authorities and the registered agent. This is confidentiality, not concealment — anything else is a criminal exposure.' },
      { title: 'Regulated, insured nominees', description: 'Nominees are licensed corporate service providers carrying professional indemnity cover, not individuals doing a favour.' },
      { title: 'Clean exit mechanics', description: 'Pre-signed, undated transfer instruments mean you can remove the nominee or sell the company without their cooperation being a dependency.' },
    ],
    includes: [
      'Regulated nominee shareholder and/or director appointment',
      'Declaration of trust confirming your beneficial ownership',
      'Irrevocable power of attorney in your favour',
      'Pre-signed, undated share transfer instrument held in escrow',
      'Nominee indemnity and non-interference undertaking',
      'Beneficial ownership registration with the relevant authority',
      'Annual nominee renewal and register maintenance',
      'Structure documentation pack for bank and counterparty diligence',
    ],
    requirements: [
      'Certified passport copy for each beneficial owner',
      'Certified proof of residential address issued within three months',
      'Bank or professional reference letter for each beneficial owner',
      'Source of funds and source of wealth documentation',
      'Structure chart showing every beneficial owner above 10%',
      'Enhanced due diligence questionnaire, completed',
      'Confirmation of the commercial rationale for the arrangement',
    ],
    body:
      '<p>There are legitimate reasons to keep ownership off public and commercial records: a competitor mapping your holdings, a personal security concern, a negotiation where your involvement would move the price, or simply separating personal identity from commercial activity.</p><h3>What a nominee arrangement is</h3><p>A regulated corporate service provider is recorded as shareholder or director. Behind that, four documents keep everything with you: a <strong>declaration of trust</strong> confirming the nominee holds for your benefit, an <strong>irrevocable power of attorney</strong> giving you decision rights, a <strong>pre-signed undated share transfer</strong> so you can remove them unilaterally, and an <strong>indemnity and non-interference undertaking</strong>.</p><h3>What it is not</h3><p>It is not a way to hide from a tax authority, a regulator or a court. Beneficial ownership is registered with the authorities, disclosed to banks in full, and reported under the Common Reporting Standard. Anyone offering to conceal ownership from a regulator is offering you a criminal exposure, not a service.</p><h3>Banking with a nominee structure</h3><p>Banks require full beneficial ownership disclosure regardless of the nominee arrangement. The nominee affects public visibility, not the KYC file. We prepare the structure documentation so the arrangement is understood at onboarding rather than queried mid-review.</p>',
    faq: [
      { q: 'Is a nominee arrangement legal?', a: 'Yes, where beneficial ownership is properly disclosed to the authorities and to your bank. It is a recognised feature of corporate law in the UAE and most common law jurisdictions. Using one to conceal ownership from a regulator or tax authority is not legal, and we will not structure it that way.' },
      { q: 'Can the nominee take control of my company?', a: 'No. The declaration of trust, irrevocable power of attorney and pre-signed undated transfer instrument mean you can remove them at any time without their cooperation. The nominee also signs an indemnity and non-interference undertaking.' },
      { q: 'Will the bank know I am the real owner?', a: 'Yes, in full. Banks require complete beneficial ownership disclosure and we provide it. The nominee affects what is commercially visible, not what the bank sees.' },
      { q: 'Does this hide me from my home tax authority?', a: 'No. Beneficial ownership is exchanged under the Common Reporting Standard. If you are tax-resident somewhere with CFC rules, those rules still apply. This is a commercial privacy tool, not a tax tool.' },
      { q: 'What happens if I want to sell the company?', a: 'The pre-signed undated transfer instrument lets you transfer or unwind without needing the nominee to act. We handle the register updates and beneficial ownership refiling.' },
    ],
  },
  {
    id: 'service-shelf-company',
    name: 'Shelf Companies',
    slug: 'shelf-company',
    tagline: 'Pre-registered UAE entities with trading history, transferable in days.',
    intro:
      'Aged, clean, never-traded UAE entities held ready for transfer. Where a tender, a contract or a banking requirement demands a company with incorporation history, a shelf entity provides it in days rather than years.',
    priceFrom: '$11,000',
    timeline: '3–5 days to transfer',
    benefits: [
      { title: 'Incorporation date you cannot otherwise buy', description: 'Tenders and enterprise procurement frequently require two or three years of registration history. A shelf entity satisfies that immediately.' },
      { title: 'Verified clean history', description: 'Every entity we transfer has never traded, has no liabilities, no filings in arrears and no adverse register entries — confirmed in writing before transfer.' },
      { title: 'Faster banking in some cases', description: 'An aged entity with a clean file can shorten compliance review compared to a company incorporated the week before applying.' },
      { title: 'Full legal due diligence pack', description: 'Certificate of incorporation, register extracts, good standing certificate and a no-liability warranty, all provided before you commit.' },
      { title: 'Complete transfer handling', description: 'Share transfer, MOA amendment, director changes, licence amendment and beneficial ownership refiling all managed by us.' },
    ],
    includes: [
      'Shortlist of available entities by incorporation date and activity',
      'Full due diligence pack and register extracts for each candidate',
      'Certificate of good standing and written no-liability warranty',
      'Share transfer and MOA amendment filings',
      'Director and authorised signatory changes',
      'Trade licence activity amendment where required',
      'Beneficial ownership register update',
      'Bank introduction using the entity\'s existing history',
    ],
    requirements: [
      'Passport copy for each incoming shareholder and director',
      'Proof of residential address issued within three months',
      'Source of funds documentation for the purchase',
      'Confirmation of the intended business activity post-transfer',
      'Signed share purchase and transfer documentation',
      'Enhanced due diligence questionnaire, completed',
    ],
    body:
      '<p>Shelf companies solve one specific problem: a counterparty, tender or lender requires a company that has existed for longer than yours. Incorporation history is the one thing money cannot accelerate — unless you acquire an entity that already has it.</p><h3>What we actually sell</h3><p>Entities incorporated in UAE free zones, held dormant, never traded, with all filings current and no liabilities of any kind. We do not sell previously trading companies — the contingent liability risk is not something we are prepared to pass to a client.</p><h3>The due diligence you should demand</h3><p>Before any payment: certificate of incorporation showing the date, current register extract, certificate of good standing, confirmation that no filings are outstanding, and a written warranty that the entity has never traded and carries no liabilities. If a provider will not produce all six, walk away.</p><h3>Where a shelf company does not help</h3><p>It does not create trading history, revenue history or filed accounts — only registration history. If a bank or tender wants audited financials, a shelf entity does not provide them. And a newly incorporated company is cheaper and cleaner where history is not actually required.</p>',
    faq: [
      { q: 'Have these companies ever traded?', a: 'No. Every entity we transfer has been held dormant since incorporation with no trading activity, no bank account and no liabilities. We provide a written warranty to that effect and will not broker previously trading companies.' },
      { q: 'How old are the available entities?', a: 'Typically one to four years. Availability changes constantly, so we shortlist against the specific incorporation date your requirement needs.' },
      { q: 'Will a shelf company get me a bank account faster?', a: 'Sometimes. An aged entity with a clean file can shorten compliance review, but the bank still assesses the activity, the beneficial owners and the source of funds. It removes one objection, not all of them.' },
      { q: 'Can I change the company name and activity?', a: 'Yes. Name change and licence activity amendment are handled as part of the transfer, though both require free zone approval and add a few days.' },
      { q: 'Is buying a shelf company risky?', a: 'It is if the entity has traded. That is why the due diligence pack and no-liability warranty matter, and why we only handle never-traded entities.' },
    ],
  },
  {
    id: 'service-tax-residency',
    name: 'Tax Residency',
    slug: 'tax-residency',
    tagline: 'UAE Tax Residency Certificates that withstand scrutiny at home.',
    intro:
      'A Tax Residency Certificate from the Federal Tax Authority is the document that lets you claim UAE residency under a double tax treaty. Getting it requires evidence of genuine presence and substance — we build the file and file the application.',
    priceFrom: '$3,200',
    timeline: '4–6 weeks to certificate',
    benefits: [
      { title: 'Treaty access under 140+ agreements', description: 'A TRC is what activates UAE treaty benefits, reducing or eliminating withholding tax on dividends, interest, royalties and service fees from treaty partners.' },
      { title: 'Substance file built to survive challenge', description: 'Home-country authorities test residency claims. We assemble the presence, housing, banking and economic-ties evidence that holds up when they do.' },
      { title: 'Day-count tracking and advice', description: 'The 183-day threshold is the headline test, but 90-day and permanent-home routes exist. We advise on which route you actually satisfy.' },
      { title: 'Personal and corporate certificates', description: 'We handle both individual TRCs and corporate certificates for treaty claims made by the entity.' },
      { title: 'Home-country exit coordination', description: 'We flag where your departure jurisdiction applies exit taxes, deemed disposals or continuing-residence tests, so nothing surprises you later.' },
    ],
    includes: [
      'Eligibility assessment against the 183-day, 90-day and permanent-home tests',
      'Day-count reconciliation from entry and exit records',
      'Substance evidence pack: tenancy, utilities, banking, Emirates ID',
      'Salary certificate and employment or shareholding evidence',
      'FTA application filing and fee payment',
      'Liaison with the FTA through to issuance',
      'Certificate attestation for use in the treaty partner country',
      'Guidance note on maintaining residency in subsequent years',
    ],
    requirements: [
      'Passport with UAE residence visa page',
      'Emirates ID, front and back',
      'Entry and exit report from the immigration authority',
      'Registered tenancy contract or title deed for a UAE residence',
      'Six months of UAE bank statements, personal account',
      'Salary certificate or shareholding and dividend evidence',
      'DEWA, SEWA or equivalent utility bills for the residence',
    ],
    body:
      '<p>A UAE residence visa and a UAE tax residency are two different things. The visa gives you the right to live here. The Tax Residency Certificate is what a foreign tax authority will actually accept when you claim you are no longer taxable at home.</p><h3>The tests you can satisfy</h3><p>The primary route is <strong>183 days or more</strong> of physical presence in the UAE across a twelve-month period. A secondary route applies at <strong>90 days or more</strong> for UAE nationals, GCC nationals and UAE residence holders who also have a permanent home or employment or business in the UAE. A third route exists where the UAE is your usual or primary place of residence and centre of financial and personal interests.</p><h3>Why applications fail</h3><p>Insufficient day count, a tenancy contract that does not match the claimed residence, no utility bills in the applicant\'s name, and personal banking with no UAE activity. The FTA is assessing whether you genuinely live here, and each of those gaps says you do not.</p><h3>The part most advisors skip</h3><p>Your departure country has its own rules. Some apply exit taxes on unrealised gains. Some maintain residence for a period after departure. Some apply a centre-of-vital-interests test that a UAE TRC does not automatically override. We flag these before you rely on the certificate, because discovering them afterwards is expensive.</p>',
    faq: [
      { q: 'Do I need to spend 183 days in the UAE?', a: 'For the primary test, yes. There is a 90-day route for UAE and GCC nationals and UAE residence holders with a permanent home or business here, and a third route based on the UAE being your usual place of residence and centre of interests. We assess which you actually satisfy.' },
      { q: 'Is my residence visa the same as tax residency?', a: 'No, and conflating them is a common and costly error. The visa is an immigration status. The Tax Residency Certificate is a tax document issued by the Federal Tax Authority, and it is what a foreign authority will ask to see.' },
      { q: 'How long does the certificate take?', a: 'Four to six weeks from a complete application. Incomplete substance evidence is the usual cause of delay, which is why the file is assembled before filing.' },
      { q: 'Will a UAE TRC stop my home country taxing me?', a: 'It depends entirely on your home country\'s rules and the relevant treaty. A TRC supports a treaty claim; it does not automatically override a domestic residence test or a centre-of-vital-interests analysis. We flag the risks in your specific case.' },
      { q: 'Does the certificate need renewing?', a: 'Yes, annually, and each renewal is assessed on that year\'s facts. Maintaining the day count and the substance evidence year on year is part of the arrangement, not a one-off exercise.' },
    ],
  },
  {
    id: 'service-annual-renewals',
    name: 'Annual Renewals',
    slug: 'annual-renewals',
    tagline: 'Licence, visa and filing deadlines managed so nothing lapses.',
    intro:
      'Trade licence renewal, visa renewals, corporate tax filing, VAT returns, ESR notifications and audit coordination — tracked against a single calendar with reminders that start well before the penalty window opens.',
    priceFrom: '$1,900 per year',
    timeline: 'Ongoing, renewals filed 30 days early',
    benefits: [
      { title: 'Nothing lapses', description: 'Every deadline is tracked and filed ahead of time. An expired trade licence can freeze your bank account, which turns an administrative slip into an operational crisis.' },
      { title: 'Penalties avoided, not just paid', description: 'UAE late-filing penalties escalate quickly across licence, corporate tax and VAT. Filing early costs nothing extra and removes the exposure entirely.' },
      { title: 'One calendar, all obligations', description: 'Licence, establishment card, visas, corporate tax return, VAT returns, ESR notification and audit — in one place instead of six inboxes.' },
      { title: 'QFZP status maintained', description: 'The 0% rate depends on continuing to meet the qualifying conditions. We monitor the tests annually rather than assuming last year\'s answer still holds.' },
      { title: 'Audit coordinated where mandated', description: 'For DMCC, DAFZA and other audit-mandatory zones we manage the auditor relationship and the submission deadline.' },
    ],
    includes: [
      'Trade licence renewal filed 30 days ahead of expiry',
      'Establishment card and immigration file renewal',
      'Investor and employee visa renewal coordination',
      'Corporate tax return preparation and FTA submission',
      'VAT return filing where registered',
      'Economic Substance Regulations notification and report',
      'QFZP condition review ahead of each filing',
      'Registered address and agent renewal',
      'Audit coordination in audit-mandatory zones',
      'Rolling twelve-month compliance calendar with reminders',
    ],
    requirements: [
      'Current trade licence and establishment card',
      'Passport and Emirates ID copies for all visa holders',
      'Prior-year financial statements or management accounts',
      'Corporate tax registration number',
      'VAT registration certificate where applicable',
      'Tenancy contract or registered address agreement',
      'Access to prior filings and correspondence with the authorities',
    ],
    body:
      '<p>Renewals are where otherwise well-run companies get hurt. Nothing about them is difficult; the problem is that the deadlines are numerous, they sit with different authorities, and the consequence of missing one is disproportionate.</p><h3>What an expired licence actually costs</h3><p>Escalating fines, an immigration file that blocks visa renewals, and — the one that stops the business — a bank that freezes the account because the licence on file has lapsed. Recovering from that takes weeks.</p><h3>The obligations we track</h3><p>Trade licence and establishment card renewal. Visa and Emirates ID renewals per holder. Corporate tax return within nine months of the financial year end. VAT returns quarterly or monthly where registered. ESR notification and, where relevant, the ESR report. Audit submission in zones that mandate it. And the QFZP conditions, which have to be satisfied each year rather than once.</p><h3>How it runs</h3><p>You get a rolling twelve-month calendar with every deadline and the documents each one needs. We start each renewal 30 to 45 days early, chase the documents we need from you, file, and confirm. If something is genuinely at risk of slipping we tell you in writing rather than letting it pass quietly.</p>',
    faq: [
      { q: 'What happens if my trade licence expires?', a: 'Fines begin accruing immediately and escalate. Your immigration file is blocked, so visas cannot be renewed. Most seriously, banks monitor licence status and will freeze the account, which stops the business until the licence is restored.' },
      { q: 'When is the corporate tax return due?', a: 'Within nine months of the end of your financial year. Registration with the Federal Tax Authority is separate and is required regardless of whether you expect to pay tax.' },
      { q: 'Do I need an audit?', a: 'It depends on the zone. DMCC and DAFZA mandate an annual audit. IFZA and Meydan generally do not, though an audit is required to support a QFZP claim. We confirm against your specific licence.' },
      { q: 'What is an ESR notification?', a: 'Economic Substance Regulations require entities carrying on relevant activities to notify annually and, where the activity is in scope, file a substance report. Missing the notification carries its own penalty separate from any tax exposure.' },
      { q: 'Can you take over renewals from another provider?', a: 'Yes. We audit your current filing position first, identify anything outstanding, and then take the calendar forward. Discovering a lapsed obligation at handover is common and better found early.' },
    ],
  },
]

const BLOCKS_BY_SLUG = new Map<string, PuckBlocks>()
const BY_SLUG = new Map<string, ServiceSeed>()

for (const seed of SEEDS) {
  BY_SLUG.set(seed.slug, seed)
  BLOCKS_BY_SLUG.set(seed.slug, serviceBlocks(seed))
}

const SLUG_ALIASES: Record<string, string> = {
  'company-formation': 'company-registration',
  'bank-accounts': 'bank-account',
  banking: 'bank-account',
  nominee: 'nominee-ubo',
  'shelf-companies': 'shelf-company',
  renewals: 'annual-renewals',
}

/** Static service record shaped like `getServiceBySlug()` in lib/directus. */
export function staticService(slug: string): any {
  const key = slug.trim().toLowerCase()
  const seed = BY_SLUG.get(SLUG_ALIASES[key] ?? key)
  if (!seed) return null

  return {
    ...recordTail(),
    ...seoTail({
      aeo_llm_summary: seed.intro,
      seo_meta_title: `${seed.name} — UAE & GCC | From ${seed.priceFrom}`,
      seo_meta_description: `${seed.tagline} ${seed.timeline}, from ${seed.priceFrom}.`,
      internal_links: [
        { label: 'Formation pricing', url: '/pricing' },
        { label: 'Compare jurisdictions', url: '/compare' },
        { label: 'Book a consultation', url: '/book-consultation' },
      ],
      external_citations: [CITATION_FTA],
    }),
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    intro: seed.intro,
    tagline: seed.tagline,
    price_from: seed.priceFrom,
    timeline: seed.timeline,
    faq: seed.faq,
    blocks: BLOCKS_BY_SLUG.get(seed.slug) ?? { content: [], root: {} },
  }
}

export function staticServiceSummaries() {
  return SEEDS.map((seed) => ({
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    intro: seed.intro,
    tagline: seed.tagline,
    price_from: seed.priceFrom,
    timeline: seed.timeline,
  }))
}

export { SEEDS as SERVICE_SEEDS, serviceBlocks }
