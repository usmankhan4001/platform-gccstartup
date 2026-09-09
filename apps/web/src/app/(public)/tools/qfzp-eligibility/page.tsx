'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { LeadCaptureModal } from '@/components/LeadCaptureModal'

export default function QFZPEligibilityChecker() {
  const [activity, setActivity] = useState('Tech')
  const [visas, setVisas] = useState('1-2')
  const [hasSubstance, setHasSubstance] = useState(true)
  const [isForeignClients, setIsForeignClients] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const isLikelyEligible =
    activity !== 'Excluded' &&
    hasSubstance &&
    (activity === 'Tech' || activity === 'Trading' || activity === 'Consulting' || activity === 'Holding')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-[#16A34A] bg-[#DCFCE7] px-3 py-1 rounded-full border border-green-200">
            0% Corporate Tax
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#0A142F] tracking-tight">
            Qualifying Free Zone Person (QFZP) Checker
          </h1>
          <p className="mt-2 text-[#334155] text-sm">
            Evaluate qualifying income rules under UAE Cabinet Decision No. 55/2023 for 0% Corporate Tax eligibility.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                1. Core Business Activity
              </label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
              >
                <option value="Tech">Software Development, Cloud &amp; AI Services (Qualifying)</option>
                <option value="Trading">Qualifying Commodity &amp; Physical Goods Trading</option>
                <option value="Holding">Holding Company &amp; Treasury Operations</option>
                <option value="Consulting">Headquarter &amp; Management Services</option>
                <option value="Logistics">Logistics &amp; Ship Operation</option>
                <option value="Excluded">Mainland UAE Direct B2C Retail (Non-Qualifying)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                2. Adequate Substance &amp; Staffing
              </label>
              <select
                value={visas}
                onChange={(e) => setVisas(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
              >
                <option value="1-2">1 – 2 Visas (Founder / Director Substance)</option>
                <option value="3-5">3 – 5 Visas (Core Operational Team)</option>
                <option value="6+">6+ Visas (Physical Corporate Office)</option>
              </select>
            </div>

            <div className="space-y-2.5 pt-2">
              <label className="flex items-center gap-3 cursor-pointer bg-white border border-[#CBD5E1] p-3 rounded-xl">
                <input
                  type="checkbox"
                  checked={hasSubstance}
                  onChange={(e) => setHasSubstance(e.target.checked)}
                  className="rounded border-gray-300 text-[#16A34A] focus:ring-[#16A34A] h-4 w-4 accent-[#16A34A]"
                />
                <span className="text-xs text-[#0F172A] font-semibold">
                  Maintains a registered office / lease in a designated UAE Free Zone
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer bg-white border border-[#CBD5E1] p-3 rounded-xl">
                <input
                  type="checkbox"
                  checked={isForeignClients}
                  onChange={(e) => setIsForeignClients(e.target.checked)}
                  className="rounded border-gray-300 text-[#16A34A] focus:ring-[#16A34A] h-4 w-4 accent-[#16A34A]"
                />
                <span className="text-xs text-[#0F172A] font-semibold">
                  Revenue is derived from foreign clients or other Free Zone entities (not local mainland individuals)
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0A142F] hover:bg-[#1039AC] text-white font-black py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-[#F26522]" />
              Evaluate 0% QFZP Status
            </button>
          </form>
        </div>

        {/* Result */}
        {submitted && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div
              className={`rounded-2xl p-6 border shadow-xs ${
                isLikelyEligible
                  ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-amber-50/50 border-amber-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {isLikelyEligible ? (
                  <ShieldCheck className="h-8 w-8 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">
                    {isLikelyEligible
                      ? 'High Confidence: Eligible for 0% UAE Corporate Tax'
                      : 'Standard 9% Rate Applies (Small Business Relief May Apply)'}
                  </h3>
                  <p className="text-xs text-[#334155] mt-1 leading-relaxed">
                    {isLikelyEligible
                      ? 'Your business structure satisfies Qualifying Free Zone Person substance criteria. As long as non-qualifying revenue stays under de minimis thresholds (5% or AED 5M), your taxable rate is 0%.'
                      : 'Activities involving direct mainland consumers or lacking adequate local substance are subject to 9% Corporate Tax on profit exceeding AED 375,000 (unless revenue is below AED 3M for Small Business Relief).'}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-[#64748B]">Need an official QFZP tax structure audit?</span>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#0A142F] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1039AC] transition-colors cursor-pointer"
                >
                  Request Tax Advisory →
                </button>
              </div>
            </div>
          </div>
        )}

        <LeadCaptureModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          toolSlug="qfzp-eligibility"
          toolTitle="QFZP 0% Tax Checker"
          calculatorData={{
            activity,
            visas,
            hasSubstance,
            isForeignClients,
            isLikelyEligible,
          }}
          estimatedValue={5500}
        />
      </div>
    </div>
  )
}
