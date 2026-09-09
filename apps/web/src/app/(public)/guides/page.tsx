import React from 'react'
import Link from 'next/link'
import { BookOpen, FileText, ArrowRight, ShieldCheck, Download, Sparkles } from 'lucide-react'
import { ButtonLink } from '@/components/ui'

const GUIDES = [
  {
    title: 'The Ultimate 2026 Dubai Incorporation Playbook',
    pages: '38 Pages PDF',
    category: 'Company Formation',
    description: 'Comprehensive manual on selecting between 40+ freezones, lease agreements, license activities, and shareholder MOA drafting.',
    topics: ['Freezone Comparison Matrix', 'E-Channel Immigration Steps', 'Cost Breakdown Tables'],
  },
  {
    title: 'UAE Corporate Tax & QFZP Compliance Manual',
    pages: '24 Pages PDF',
    category: 'Corporate Tax',
    description: 'Technical guidance for CFOs and founders on satisfying Qualifying Free Zone Person substance criteria and maintaining 0% corporate tax.',
    topics: ['Cabinet Decision 55 Analysis', 'Audited Financial Requirements', 'De Minimis Rule Calculation'],
  },
  {
    title: 'Corporate Bank Account Opening Blueprint',
    pages: '18 Pages PDF',
    category: 'Banking',
    description: 'How to prepare acceptable business plans, customer invoice proofs, website KYC, and origin of wealth dossiers for UAE tier-1 banks.',
    topics: ['Wio & NeoBiz Fast Track', 'Emirates NBD Dossier Checklist', 'Red Flag Prevention'],
  },
  {
    title: 'Nominee UBO & Institutional Privacy Framework',
    pages: '15 Pages PDF',
    category: 'Fiduciary',
    description: 'Legal handbook on using Declarations of Trust, nominee directors, and holding structures to shield founder privacy legally.',
    topics: ['Declaration of Trust Terms', 'Power of Attorney Limits', 'Banking Signatory Control'],
  },
]

export default function GuidesPage() {
  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-wider text-[#1B4FD8] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200">
            Playbooks &amp; Handbooks
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black text-[#0A142F] tracking-tight">
            Founder Guides &amp; Regulatory Playbooks
          </h1>
          <p className="mt-3 text-[#334155] text-base">
            In-depth operational playbooks curated by senior corporate finance directors and UAE registered agents.
          </p>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {GUIDES.map((guide) => (
            <div
              key={guide.title}
              className="bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1B4FD8] rounded-3xl p-8 shadow-xs hover:shadow-2xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-[#FEF1E9] text-[#F26522]">
                    {guide.category}
                  </span>
                  <span className="text-xs font-bold text-[#64748B] flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {guide.pages}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#0A142F] leading-snug">
                  {guide.title}
                </h3>

                <p className="mt-3 text-xs text-[#334155] leading-relaxed">
                  {guide.description}
                </p>

                <div className="mt-6 pt-4 border-t border-[#E2E8F0] space-y-1.5">
                  <span className="text-[11px] font-bold text-[#0A142F] block">What is covered:</span>
                  {guide.topics.map((t) => (
                    <div key={t} className="flex items-center gap-2 text-xs text-[#64748B]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1B4FD8]" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E2E8F0]">
                <Link
                  href="/#lead-form"
                  className="w-full py-3.5 rounded-xl bg-[#0A142F] hover:bg-[#1039AC] text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4 text-[#F26522]" />
                  Download Free Playbook
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
