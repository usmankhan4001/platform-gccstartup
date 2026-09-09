'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Calculator,
  Landmark,
  Scale,
  Users,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  Lock,
  Clock,
  Receipt,
  ArrowRight,
  Search,
} from 'lucide-react'

const ALL_TOOLS = [
  {
    title: 'UAE Corporate Tax Calculator',
    slug: 'tax-calculator',
    category: 'Tax & Finance',
    description: 'Calculate your exact tax liability with Small Business Relief (AED 3M) & 0% Qualifying Freezone Person rules.',
    badge: '2026 Tax Law',
    icon: Calculator,
    color: '#F26522',
  },
  {
    title: 'Bank Account Odds Predictor',
    slug: 'banking-odds',
    category: 'Banking',
    description: 'Evaluate your corporate bank approval probability across Wio, Mashreq NeoBiz, ENBD & FAB before applying.',
    badge: 'High Impact',
    icon: Landmark,
    color: '#1B4FD8',
  },
  {
    title: 'Jurisdiction Fit Quiz',
    slug: 'jurisdiction-quiz',
    category: 'Formation',
    description: 'Answer 4 questions to identify the exact UAE freezone or mainland structure that minimizes cost and fits your business.',
    badge: 'Interactive',
    icon: Scale,
    color: '#0A142F',
  },
  {
    title: 'QFZP 0% Tax Eligibility Checker',
    slug: 'qfzp-eligibility',
    category: 'Tax & Finance',
    description: 'Verify qualifying income requirements, adequate substance rules, and de minimis non-qualifying thresholds.',
    badge: '0% Tax',
    icon: Sparkles,
    color: '#16A34A',
  },
  {
    title: 'Visa & Emirates ID Estimator',
    slug: 'visa-estimator',
    category: 'Immigration',
    description: 'Estimate investor, partner, and employee visa costs including VIP medical biometrics and Emirates ID fees.',
    badge: 'Transparent',
    icon: Users,
    color: '#D97706',
  },
  {
    title: 'Company Name Eligibility Checker',
    slug: 'name-checker',
    category: 'Formation',
    description: 'Check your proposed business trade name against UAE Ministry of Economy and DED reservation guidelines.',
    badge: 'Instant',
    icon: FileCheck2,
    color: '#1B4FD8',
  },
  {
    title: 'UBO Privacy Matrix',
    slug: 'ubo-privacy',
    category: 'Fiduciary',
    description: 'Review public register disclosure risks and evaluate nominee director / fiduciary trust protection options.',
    badge: 'Confidential',
    icon: Lock,
    color: '#0A142F',
  },
  {
    title: 'VAT Readiness Scorer',
    slug: 'vat-scorer',
    category: 'Tax & Finance',
    description: 'Determine whether mandatory (AED 375k) or voluntary (AED 187.5k) 5% UAE VAT registration applies to your turnover.',
    badge: 'Compliance',
    icon: Receipt,
    color: '#DC2626',
  },
  {
    title: 'Annual Compliance Calendar',
    slug: 'compliance-calendar',
    category: 'Compliance',
    description: 'Calculate exact statutory filing deadlines for trade license renewals, ESR notifications, and Corporate Tax returns.',
    badge: 'Essential',
    icon: Clock,
    color: '#16A34A',
  },
  {
    title: 'Instant NDA Generator',
    slug: 'generate-nda',
    category: 'Legal',
    description: 'Generate bilateral, DIFC/ADGM compliant non-disclosure agreements with standard GCC governing law clauses.',
    badge: 'Legal Tool',
    icon: ShieldCheck,
    color: '#F26522',
  },
]

export default function ToolsDirectoryPage() {
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('ALL')

  const categories = ['ALL', 'Tax & Finance', 'Formation', 'Banking', 'Immigration', 'Compliance', 'Legal']

  const filtered = ALL_TOOLS.filter((tool) => {
    const matchesCat = selectedCat === 'ALL' || tool.category === selectedCat
    const matchesSearch =
      tool.title.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-wider text-[#F26522] bg-[#FEF1E9] px-3 py-1 rounded-full border border-orange-200">
            Decision Engines &amp; Calculators
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black text-[#0A142F] tracking-tight">
            10 Proprietary GCC Formation Tools
          </h1>
          <p className="mt-3 text-[#334155] text-base">
            Engineered with real 2026 UAE Corporate Tax rules, banking risk matrices, and immigration fee tables.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="max-w-4xl mx-auto mb-12 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search tools & calculators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs focus:outline-none focus:border-[#F26522] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCat === cat
                    ? 'bg-[#0A142F] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0A142F]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {filtered.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group bg-[#F8FAFC] hover:bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#F26522] p-6 shadow-xs hover:shadow-2xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-white border border-[#E2E8F0] text-[#0A142F] group-hover:bg-[#0A142F] group-hover:text-white flex items-center justify-center transition-colors">
                    <tool.icon className="h-5 w-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-[#FEF1E9] text-[#F26522]">
                    {tool.badge}
                  </span>
                </div>

                <span className="text-[10px] font-black uppercase text-[#1B4FD8] tracking-wider block mb-1">
                  {tool.category}
                </span>
                <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#F26522] transition-colors">
                  {tool.title}
                </h3>
                <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#1B4FD8]">
                <span>Launch Tool</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
