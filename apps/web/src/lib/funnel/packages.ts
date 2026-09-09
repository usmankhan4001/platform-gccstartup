export type JurisdictionConfig = {
  id: string
  name: string
  slug: string
  flag: string
  basePrice: number
  currency: string
  registryFee: number
  turnaroundDays: number
  description: string
  popular?: boolean
  requiredDocuments: string[]
  complianceNotes: string[]
}

export type PackageOption = {
  id: 'self_ubo' | 'need_ubo' | 'nominee_director'
  title: string
  price: number
  subtitle: string
  description: string
  tooltip: string
  legalRequirements: string[]
  checklist: string[]
}

export type AddonOption = {
  id: string
  title: string
  price: number
  description: string
}

export const JURISDICTIONS: JurisdictionConfig[] = [
  {
    id: 'hong-kong',
    name: 'Hong Kong',
    slug: 'hong-kong',
    flag: '🇭🇰',
    basePrice: 1450,
    currency: 'USD',
    registryFee: 350,
    turnaroundDays: 2,
    popular: true,
    description: 'Premier gateway to Asia and global trade with 0% tax on foreign-sourced income and rapid 2-day e-registry incorporation.',
    requiredDocuments: [
      'Valid passport copy (high-resolution color scan)',
      'Proof of residential address (utility bill or bank statement within 3 months)',
      'Proposed company name (in English and/or Traditional Chinese)',
      'Brief 2-sentence description of planned business activity',
    ],
    complianceNotes: [
      'Requires a local Hong Kong Company Secretary and Registered Office (included in our package).',
      'Significant Controllers Register (SCR) must be maintained at the registered office.',
      'Annual return and Business Registration Certificate renewal required yearly.',
    ],
  },
  {
    id: 'uae-dubai',
    name: 'UAE (Dubai Freezone)',
    slug: 'uae',
    flag: '🇦🇪',
    basePrice: 3800,
    currency: 'USD',
    registryFee: 1200,
    turnaroundDays: 5,
    popular: true,
    description: '100% foreign ownership, 0% personal tax, access to UAE residence visas, and prestigious GCC banking options.',
    requiredDocuments: [
      'Passport copy with at least 6 months validity',
      'Passport-sized photograph with white background',
      'UAE entry stamp or visa copy (if previously visited)',
      'Proof of residential address in home country',
    ],
    complianceNotes: [
      'Corporate tax rate is 9% above AED 375,000 profit (qualifying freezone exemptions apply).',
      'Immigration establishment card and investor visa processed after trade license issuance.',
    ],
  },
  {
    id: 'singapore',
    name: 'Singapore',
    slug: 'singapore',
    flag: '🇸🇬',
    basePrice: 2200,
    currency: 'USD',
    registryFee: 450,
    turnaroundDays: 3,
    description: 'Asia-Pacific financial hub with 17% headline tax, extensive double-tax treaties, and top-tier banking credibility.',
    requiredDocuments: [
      'Passport copy of all directors and shareholders',
      'Proof of address dated within the last 3 months',
      'Detailed business plan / activity questionnaire for ACRA approval',
    ],
    complianceNotes: [
      'ACRA mandates at least one local resident director (can be supplied via our Nominee Director package).',
      'Corporate secretary required within 6 months of incorporation.',
    ],
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    slug: 'uk',
    flag: '🇬🇧',
    basePrice: 950,
    currency: 'USD',
    registryFee: 150,
    turnaroundDays: 1,
    description: 'Cost-effective global entity with same-day Companies House registration and seamless fintech payment gateway integration.',
    requiredDocuments: [
      'Passport photo page scan',
      'Proof of residential address',
      'Confirmation of standard industry SIC code',
    ],
    complianceNotes: [
      'PSC (Person with Significant Control) register publicly visible unless specific protection filed.',
      'Annual confirmation statement and statutory accounts required.',
    ],
  },
]

export const PACKAGE_OPTIONS: PackageOption[] = [
  {
    id: 'self_ubo',
    title: 'Self as UBO (Standard)',
    price: 0,
    subtitle: 'Direct ownership as the beneficial owner',
    description: 'You are registered as the 100% Ultimate Beneficial Owner and Director. Ideal for founders wanting direct control.',
    tooltip: 'You hold direct shares and full ownership. Simplest compliance, fastest e-registry clearance, and standard annual maintenance.',
    legalRequirements: [
      'Direct shareholder disclosure on the statutory registry',
      'Full economic ownership and direct bank signing authority',
      'Must pass standard automated ID verification',
    ],
    checklist: [
      'Passes standard international KYC',
      'No complex holding company layers required',
      'Fastest approval at government e-registry',
    ],
  },
  {
    id: 'need_ubo',
    title: 'Need a UBO (Nominee Shareholder)',
    price: 1200,
    subtitle: 'Confidential nominee trustee structure',
    description: 'A licensed corporate nominee holds shares on your behalf under a legally binding Declaration of Trust.',
    tooltip: 'Protects public privacy on public registers. A formal Declaration of Trust confirms you retain 100% of dividends and company value.',
    legalRequirements: [
      'Executed Declaration of Trust and Deed of Indemnity',
      'Internal compliance approval of the source of wealth',
      'Periodic compliance review of corporate activities',
    ],
    checklist: [
      'Maximum shareholder privacy on public records',
      'Legally documented ultimate economic ownership',
      'Includes notarized Declaration of Trust',
    ],
  },
  {
    id: 'nominee_director',
    title: 'Nominee Director',
    price: 1600,
    subtitle: 'Local professional resident director',
    description: 'A qualified local director appointed to satisfy local statutory residency requirements while you manage daily business via Power of Attorney.',
    tooltip: 'Mandatory in jurisdictions like Singapore without a local resident, or used for maximum governance privacy under General Power of Attorney.',
    legalRequirements: [
      'Power of Attorney (POA) granting you full operational control',
      'Director Indemnity and Hold Harmless Agreement',
      'Pre-approved business activity verification',
    ],
    checklist: [
      'Satisfies statutory local resident director requirements',
      'General Power of Attorney provided to founder',
      'High-tier privacy for public registries',
    ],
  },
]

export const ADDONS: AddonOption[] = [
  {
    id: 'bank-account-tier1',
    title: 'Corporate Bank Account Setup Assistance',
    price: 650,
    description: 'Dedicated banking specialist prepares file and directly introduces your entity to digital and premier tier-1 corporate banks.',
  },
  {
    id: 'apostille-cert',
    title: 'Government Apostille & Notarization Pack',
    price: 450,
    description: 'Official Hague Apostille certification of Certificate of Incorporation and Memorandum & Articles for international legal use.',
  },
  {
    id: 'expedited-filing',
    title: 'VIP Expedited 24-Hour E-Registry Filing',
    price: 250,
    description: 'Priority queue placement with our filing officer for immediate registrar submission within 4 hours of document receipt.',
  },
]

export function calculateOrderTotal(
  jurisdictionId: string,
  packageId: PackageOption['id'],
  selectedAddonIds: string[] = [],
) {
  const jurisdiction = JURISDICTIONS.find((j) => j.id === jurisdictionId) ?? JURISDICTIONS[0]
  const pkg = PACKAGE_OPTIONS.find((p) => p.id === packageId) ?? PACKAGE_OPTIONS[0]
  
  let addonTotal = 0
  for (const addonId of selectedAddonIds) {
    const addon = ADDONS.find((a) => a.id === addonId)
    if (addon) addonTotal += addon.price
  }

  const subtotal = jurisdiction.basePrice + pkg.price + addonTotal
  const governmentFee = jurisdiction.registryFee
  const total = subtotal + governmentFee

  return {
    jurisdiction,
    package: pkg,
    addons: selectedAddonIds.map((id) => ADDONS.find((a) => a.id === id)!).filter(Boolean),
    subtotal,
    governmentFee,
    total,
    currency: jurisdiction.currency,
  }
}
