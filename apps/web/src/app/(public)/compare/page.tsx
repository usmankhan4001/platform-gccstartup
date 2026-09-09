'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Scale,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Globe,
  Calculator,
  Send,
  Loader2,
} from 'lucide-react'
import { ButtonLink, Flag } from '@/components/ui'
import { COUNTRY_FLAG_CODE } from '@/lib/flag-codes'

const COMPARISONS = [
  {
    parameter: '100% Foreign Ownership',
    freezone: '100% Foreign Equity Allowed across all 40+ freezones',
    mainland: '100% Foreign Equity on 1,000+ commercial activities (since 2021)',
    winner: 'Tie',
  },
  {
    parameter: 'Corporate Tax Rate (2026)',
    freezone: '0% on Qualifying Income (QFZP) / 0% under AED 3M revenue',
    mainland: '9% on taxable profit exceeding AED 375,000 (0% under AED 3M)',
    winner: 'Freezone',
  },
  {
    parameter: 'Local UAE B2C Commercial Trading',
    freezone: 'Restricted without local distributor or dual license',
    mainland: 'Unrestricted direct contracting across all 7 emirates',
    winner: 'Mainland',
  },
  {
    parameter: 'Physical Office Requirement',
    freezone: 'Virtual / Flexi-desk lease included with package',
    mainland: 'Physical commercial office space or Ejari usually mandatory',
    winner: 'Freezone',
  },
  {
    parameter: 'Incorporation Speed',
    freezone: '3 to 5 business days 100% remotely',
    mainland: '5 to 10 business days (requires initial DED approvals)',
    winner: 'Freezone',
  },
  {
    parameter: 'Corporate Bank Approval Speed',
    freezone: '2 to 5 days for Wio/NeoBiz, 2-3 weeks for Tier-1',
    mainland: '1 to 3 weeks for Tier-1 traditional accounts',
    winner: 'Tie',
  },
  {
    parameter: 'Government Tender Access',
    freezone: 'Limited to freezone zone tenders or dual license',
    mainland: 'Full eligibility for federal UAE & municipal tenders',
    winner: 'Mainland',
  },
  {
    parameter: 'Customs Duties on Imports',
    freezone: '0% customs duties within the designated free zone',
    mainland: '5% standard UAE customs duty on imported commercial goods',
    winner: 'Freezone',
  },
]

const GLOBAL_JURISDICTIONS = [
  {
    name: 'UAE Free Zone',
    flag: COUNTRY_FLAG_CODE.uae,
    corpTax: '0% - 9%',
    personalTax: '0%',
    remoteSetup: '100% Remote',
    timeline: '3 - 5 Days',
    bankEase: 'High (Wio/ENBD)',
    privacy: 'High (Nominee)',
    bestFor: 'Global SaaS, Consultants, Crypto, E-commerce, Scaleups',
  },
  {
    name: 'Saudi Arabia (MISA)',
    flag: COUNTRY_FLAG_CODE.bahrain,
    corpTax: '20% (0% for RHQ 30y)',
    personalTax: '0%',
    remoteSetup: 'Digital Submission',
    timeline: '10 - 15 Days',
    bankEase: 'Medium (SNB/Riyad)',
    privacy: 'Standard',
    bestFor: 'GCC Enterprise, B2G Contracting, Manufacturing',
  },
  {
    name: 'Qatar (QFC)',
    flag: COUNTRY_FLAG_CODE.qatar,
    corpTax: '10% Flat',
    personalTax: '0%',
    remoteSetup: 'Remote Available',
    timeline: '7 - 10 Days',
    bankEase: 'Medium (QNB)',
    privacy: 'High',
    bestFor: 'Fintech, Professional Services, Sports & Media',
  },
  {
    name: 'Hong Kong Offshore',
    flag: COUNTRY_FLAG_CODE.hongkong,
    corpTax: '8.25% - 16.5% (0% Off)',
    personalTax: '15% Flat',
    remoteSetup: '100% Remote',
    timeline: '5 - 7 Days',
    bankEase: 'Medium (Airwallex/HSBC)',
    privacy: 'Medium',
    bestFor: 'Asian Cross-Border Trade, Holding Companies',
  },
  {
    name: 'Singapore',
    flag: COUNTRY_FLAG_CODE.singapore,
    corpTax: '17% (Startup Exempt)',
    personalTax: '0% - 24%',
    remoteSetup: 'Nominee Required',
    timeline: '3 - 5 Days',
    bankEase: 'High (DBS/OCBC)',
    privacy: 'High',
    bestFor: 'Institutional Venture Backed Startups, APAC HQ',
  },
]

export default function ComparePage() {
  const [activeTab, setActiveTab] = useState<'freezone_vs_mainland' | 'global_matrix'>('freezone_vs_mainland')

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-wider text-[#F26522] bg-[#FEF1E9] px-3 py-1 rounded-full border border-orange-200">
            Decision Matrix
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black text-[#0A142F] tracking-tight">
            Jurisdiction Comparison Matrix
          </h1>
          <p className="mt-3 text-[#334155] text-base">
            Make an informed structural decision with empirical data on tax rates, banking speed, physical presence, and operational licensing.
          </p>

          {/* Switcher Tabs */}
          <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setActiveTab('freezone_vs_mainland')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'freezone_vs_mainland'
                  ? 'bg-white text-[#0A142F] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0A142F]'
              }`}
            >
              UAE Freezone vs Mainland
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('global_matrix')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'global_matrix'
                  ? 'bg-white text-[#0A142F] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0A142F]'
              }`}
            >
              GCC &amp; Global Cross-Comparison
            </button>
          </div>
        </div>

        {/* Tab 1: Freezone vs Mainland */}
        {activeTab === 'freezone_vs_mainland' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-6">
                <div className="flex items-center gap-2 font-black text-[#1B4FD8] text-sm uppercase">
                  <Building2 className="h-5 w-5" />
                  <span>Choose UAE Freezone If:</span>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-[#1E3A8A]">
                  <li>• You sell digital goods, SaaS, consulting, or international services.</li>
                  <li>• You want 0% Qualifying Free Zone corporate tax structure.</li>
                  <li>• You want fast remote formation with zero office lease costs.</li>
                </ul>
              </div>

              <div className="bg-[#FEF1E9] border border-[#FED7AA] rounded-2xl p-6">
                <div className="flex items-center gap-2 font-black text-[#F26522] text-sm uppercase">
                  <Globe className="h-5 w-5" />
                  <span>Choose UAE Mainland If:</span>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-[#7C2D12]">
                  <li>• You operate a retail store, clinic, restaurant, or local trade shop.</li>
                  <li>• You bid on UAE government and municipality contracts.</li>
                  <li>• You need direct physical retail presence anywhere in Dubai or Abu Dhabi.</li>
                </ul>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A142F] text-white">
                  <tr>
                    <th className="p-4 sm:p-5 font-black uppercase tracking-wider w-1/4">Criteria</th>
                    <th className="p-4 sm:p-5 font-black uppercase tracking-wider w-3/8 text-[#60A5FA]">
                      UAE Freezone
                    </th>
                    <th className="p-4 sm:p-5 font-black uppercase tracking-wider w-3/8 text-[#FDBA74]">
                      UAE Mainland (DED)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {COMPARISONS.map((row, idx) => (
                    <tr key={row.parameter} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                      <td className="p-4 sm:p-5 font-bold text-[#0F172A]">{row.parameter}</td>
                      <td className="p-4 sm:p-5 text-[#334155] leading-relaxed">{row.freezone}</td>
                      <td className="p-4 sm:p-5 text-[#334155] leading-relaxed">{row.mainland}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Global Cross-Comparison */}
        {activeTab === 'global_matrix' && (
          <div className="border border-[#E2E8F0] rounded-3xl overflow-x-auto shadow-xs animate-in fade-in duration-200">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#0A142F] text-white">
                <tr>
                  <th className="p-4 sm:p-5 font-black uppercase tracking-wider">Jurisdiction</th>
                  <th className="p-4 sm:p-5 font-black uppercase tracking-wider">Corporate Tax</th>
                  <th className="p-4 sm:p-5 font-black uppercase tracking-wider">Personal Tax</th>
                  <th className="p-4 sm:p-5 font-black uppercase tracking-wider">Turnaround</th>
                  <th className="p-4 sm:p-5 font-black uppercase tracking-wider">Banking Odds</th>
                  <th className="p-4 sm:p-5 font-black uppercase tracking-wider">Ideal Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {GLOBAL_JURISDICTIONS.map((j, idx) => (
                  <tr key={j.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                    <td className="p-4 sm:p-5 font-bold text-[#0F172A] flex items-center gap-2">
                      <Flag code={j.flag} size="sm" />
                      <span>{j.name}</span>
                    </td>
                    <td className="p-4 sm:p-5 font-extrabold text-emerald-600">{j.corpTax}</td>
                    <td className="p-4 sm:p-5 font-extrabold text-[#0A142F]">{j.personalTax}</td>
                    <td className="p-4 sm:p-5 text-[#334155]">{j.timeline}</td>
                    <td className="p-4 sm:p-5 font-semibold text-[#1B4FD8]">{j.bankEase}</td>
                    <td className="p-4 sm:p-5 text-[#64748B] max-w-xs truncate">{j.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Tool Link */}
        <div className="mt-16 bg-[#0A142F] text-white rounded-3xl p-8 sm:p-12 text-center">
          <h3 className="text-2xl sm:text-3xl font-black">Still Unsure Which Structure Fits Your Revenue?</h3>
          <p className="mt-2 text-xs text-white/70 max-w-xl mx-auto">
            Answer 4 questions in our interactive Jurisdiction Fit Quiz to receive an automated match score and instant fee breakdown.
          </p>
          <div className="mt-6">
            <ButtonLink
              href="/tools/jurisdiction-quiz"
              className="bg-[#F26522] hover:bg-[#C9511A] text-white font-black text-xs uppercase tracking-wider px-8 py-3.5 shadow-lg"
            >
              Launch 2-Min Fit Quiz →
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  )
}
