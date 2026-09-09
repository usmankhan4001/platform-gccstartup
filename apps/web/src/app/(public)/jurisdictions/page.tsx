'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Globe,
  ArrowRight,
  ShieldCheck,
  Landmark,
  Scale,
  Users,
  CheckCircle2,
} from 'lucide-react'
import { ButtonLink, Flag } from '@/components/ui'
import { COUNTRY_FLAG_CODE } from '@/lib/flag-codes'

const JURISDICTIONS = [
  {
    slug: 'uae',
    name: 'United Arab Emirates (UAE)',
    flag: COUNTRY_FLAG_CODE.uae,
    region: 'GCC',
    capital: 'Abu Dhabi / Dubai',
    taxRate: '0% - 9%',
    personalTax: '0%',
    timeline: '3 - 5 Days',
    minCapital: 'No paid-up capital required',
    ownership: '100% Foreign Ownership',
    description: 'The premier global destination for tech founders, e-commerce, digital nomads, and scaleups. Benefit from 0% personal income tax and Qualifying Free Zone corporate tax regimes.',
    authorities: ['IFZA Dubai', 'Meydan Free Zone', 'RAKEZ', 'DAFZA', 'DMCC', 'Dubai DED Mainland'],
    recommended: true,
  },
  {
    slug: 'ksa',
    name: 'Kingdom of Saudi Arabia (KSA)',
    flag: COUNTRY_FLAG_CODE.bahrain,
    region: 'GCC',
    capital: 'Riyadh',
    taxRate: '20% (0% for RHQ 30y)',
    personalTax: '0%',
    timeline: '10 - 15 Days',
    minCapital: 'SAR 500,000 (standard LLC)',
    ownership: '100% via MISA License',
    description: 'The largest economy in the MENA region. Vision 2030 initiatives offer 30-year 0% corporate tax exemptions for Regional Headquarters (RHQ) and massive government procurement access.',
    authorities: ['Ministry of Investment (MISA)', 'Ministry of Commerce (MC)', 'ZATCA Tax Authority'],
    recommended: true,
  },
  {
    slug: 'qatar',
    name: 'Qatar Financial Centre (QFC)',
    flag: COUNTRY_FLAG_CODE.qatar,
    region: 'GCC',
    capital: 'Doha',
    taxRate: '10% Flat',
    personalTax: '0%',
    timeline: '7 - 10 Days',
    minCapital: 'USD 0 (services)',
    ownership: '100% Foreign Ownership',
    description: 'A world-class commercial and financial hub offering 100% foreign equity, full profit repatriation, and direct access to Qatar’s high-liquidity sovereign wealth ecosystem.',
    authorities: ['QFC Authority', 'Qatar Central Bank', 'Ministry of Commerce & Industry'],
    recommended: false,
  },
  {
    slug: 'oman',
    name: 'Sultanate of Oman',
    flag: COUNTRY_FLAG_CODE.oman,
    region: 'GCC',
    capital: 'Muscat',
    taxRate: '15% Flat',
    personalTax: '0%',
    timeline: '5 - 7 Days',
    minCapital: 'OMR 0 (Foreign Capital Investment Law)',
    ownership: '100% Foreign Ownership',
    description: 'Strategic Indian Ocean trade gateway with progressive 100% foreign ownership laws and zero personal income tax.',
    authorities: ['Sohar Freezone', 'Salalah Freezone', 'MOCIIP Oman'],
    recommended: false,
  },
  {
    slug: 'singapore',
    name: 'Singapore (ACRA)',
    flag: COUNTRY_FLAG_CODE.singapore,
    region: 'APAC',
    capital: 'Singapore',
    taxRate: '17% (Startup Exemptions)',
    personalTax: '0% - 24%',
    timeline: '3 - 5 Days',
    minCapital: 'SGD 1',
    ownership: '100% (Requires Local Nominee Director)',
    description: 'The institutional venture capital and holding capital of Asia. High reputation, rigorous common law legal framework, and 90+ double taxation treaties.',
    authorities: ['ACRA', 'Inland Revenue Authority (IRAS)', 'MAS'],
    recommended: false,
  },
  {
    slug: 'hongkong',
    name: 'Hong Kong (Offshore)',
    flag: COUNTRY_FLAG_CODE.hongkong,
    region: 'APAC',
    capital: 'Hong Kong',
    taxRate: '8.25% - 16.5% (0% Foreign)',
    personalTax: '15% Flat',
    timeline: '5 - 7 Days',
    minCapital: 'HKD 1',
    ownership: '100% Foreign Ownership',
    description: 'Territorial tax system where foreign-sourced profits are taxed at 0%. Immediate gateway to Greater Bay Area manufacturing and multi-currency global banking.',
    authorities: ['Companies Registry', 'Inland Revenue Department (IRD)'],
    recommended: false,
  },
]

export default function JurisdictionsPage() {
  const [selectedRegion, setSelectedRegion] = useState<'ALL' | 'GCC' | 'APAC'>('ALL')

  const filtered = JURISDICTIONS.filter(
    (j) => selectedRegion === 'ALL' || j.region === selectedRegion
  )

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-wider text-[#1B4FD8] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200">
            Global Jurisdictions
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black text-[#0A142F] tracking-tight">
            GCC &amp; International Formation Guides
          </h1>
          <p className="mt-3 text-[#334155] text-base">
            Detailed regulatory requirements, corporate tax rates, paid-up capital rules, and authorized registry procedures.
          </p>

          {/* Region Tabs */}
          <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0]">
            {(['ALL', 'GCC', 'APAC'] as const).map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setSelectedRegion(reg)}
                className={`px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  selectedRegion === reg
                    ? 'bg-white text-[#0A142F] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0A142F]'
                }`}
              >
                {reg === 'ALL' ? 'All Jurisdictions' : reg}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {filtered.map((j) => (
            <div
              key={j.slug}
              className="bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#F26522] rounded-3xl p-8 shadow-xs hover:shadow-2xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Flag code={j.flag} size="md" />
                    <div>
                      <h3 className="text-xl font-bold text-[#0A142F]">{j.name}</h3>
                      <span className="text-xs font-semibold text-[#64748B]">{j.capital}</span>
                    </div>
                  </div>
                  {j.recommended && (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-[#FEF1E9] text-[#F26522]">
                      Recommended
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#334155] leading-relaxed mb-6">
                  {j.description}
                </p>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-white p-4 rounded-2xl border border-[#E2E8F0] mb-6">
                  <div>
                    <span className="text-[10px] font-semibold text-[#64748B] block">Corporate Tax</span>
                    <span className="font-extrabold text-emerald-600">{j.taxRate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#64748B] block">Personal Tax</span>
                    <span className="font-extrabold text-[#0A142F]">{j.personalTax}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#64748B] block">Turnaround</span>
                    <span className="font-bold text-[#0A142F]">{j.timeline}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#64748B] block">Ownership</span>
                    <span className="font-bold text-[#1B4FD8]">100% Foreign</span>
                  </div>
                </div>

                {/* Authorities */}
                <div>
                  <span className="text-[11px] font-bold text-[#64748B] block mb-2">
                    Key Licensing Authorities &amp; Registries:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {j.authorities.map((auth) => (
                      <span
                        key={auth}
                        className="px-2 py-1 rounded-md bg-white border border-[#E2E8F0] text-[11px] font-medium text-[#334155]"
                      >
                        {auth}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex items-center justify-between">
                <Link
                  href={`/tools/tax-calculator`}
                  className="text-xs font-bold text-[#1B4FD8] hover:underline flex items-center gap-1"
                >
                  Calculate Tax in {j.name.split(' ')[0]} →
                </Link>
                <Link
                  href="/#lead-form"
                  className="px-4 py-2 rounded-xl bg-[#0A142F] hover:bg-[#1039AC] text-white text-xs font-bold transition-colors"
                >
                  Inquire Setup
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
