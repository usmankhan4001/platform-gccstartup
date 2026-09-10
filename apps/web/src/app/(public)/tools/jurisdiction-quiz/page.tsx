'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Loader2, Sparkles, Scale, Building2 } from 'lucide-react'
import { LeadCaptureModal } from '@/components/LeadCaptureModal'

const GOALS = [
  { value: 'tax_optimization', label: 'Tax Optimization (0% – 9% Corporate Tax)' },
  { value: 'global_banking', label: 'Tier-1 International & UAE Multi-Currency Banking' },
  { value: 'relocation', label: 'Physical Relocation & 10-Year Golden Visas' },
  { value: 'privacy', label: 'Maximum Privacy & Asset Protection (Nominee UBO)' },
]

const BUDGETS = [
  { value: 'under_50k', label: 'Under $100,000 / year' },
  { value: '50k_150k', label: '$100,000 – $500,000 / year' },
  { value: '150k_500k', label: '$500,000 – $2,000,000 / year' },
  { value: 'over_500k', label: 'Over $2,000,000 / year' },
]

const TIMELINES = [
  { value: 'asap', label: 'Immediately (Within 3–5 days)' },
  { value: '1_3_months', label: 'In the next 1–3 months' },
  { value: '3_6_months', label: 'In 3–6 months' },
]

interface Recommendation {
  jurisdiction: string
  name: string
  matchScore: number
  whyFit: string
  corporateTaxRate: string
  timelineDays: string
  priceAED: string
}

export default function JurisdictionQuiz() {
  const [goal, setGoal] = useState(GOALS[0].value)
  const [budgetBand, setBudgetBand] = useState(BUDGETS[0].value)
  const [timeline, setTimeline] = useState(TIMELINES[0].value)
  const [wantsRelocation, setWantsRelocation] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, budget_band: budgetBand, timeline, wants_relocation: wantsRelocation }),
      })
      const data = await res.json()
      if (res.ok && data.recommendations) {
        setRecommendations(data.recommendations)
      } else {
        setRecommendations([
          {
            jurisdiction: 'ifza',
            name: 'IFZA Dubai (Silicon Oasis Freezone)',
            matchScore: 98,
            whyFit: '0% personal income tax, 0% QFZP tax rules, 100% remote digital setup in 3 days with digital bank account pre-clearance.',
            corporateTaxRate: '0% - 9%',
            timelineDays: '3 - 5 days',
            priceAED: 'From AED 12,900',
          },
          {
            jurisdiction: 'meydan',
            name: 'Meydan Free Zone Dubai',
            matchScore: 94,
            whyFit: 'Prestigious Downtown Dubai business address, instant MOA issuance, and direct access to top UAE tier-1 banks.',
            corporateTaxRate: '0% - 9%',
            timelineDays: '3 - 4 days',
            priceAED: 'From AED 14,500',
          },
        ])
      }
    } catch {
      setRecommendations([
        {
          jurisdiction: 'ifza',
          name: 'IFZA Dubai (Silicon Oasis Freezone)',
          matchScore: 98,
          whyFit: '0% personal income tax, 0% QFZP tax rules, 100% remote digital setup in 3 days with digital bank account pre-clearance.',
          corporateTaxRate: '0% - 9%',
          timelineDays: '3 - 5 days',
          priceAED: 'From AED 12,900',
        },
        {
          jurisdiction: 'meydan',
          name: 'Meydan Free Zone Dubai',
          matchScore: 94,
          whyFit: 'Prestigious Downtown Dubai business address, instant MOA issuance, and direct access to top UAE tier-1 banks.',
          corporateTaxRate: '0% - 9%',
          timelineDays: '3 - 4 days',
          priceAED: 'From AED 14,500',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-[#F26522] bg-[#FEF1E9] px-3 py-1 rounded-full border border-orange-200">
            Interactive Decision Engine
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#0A142F] tracking-tight">
            Jurisdiction Fit Quiz
          </h1>
          <p className="mt-2 text-[#334155] text-sm">
            Answer 4 quick questions to identify your optimal UAE or GCC company formation structure.
          </p>
        </div>

        {/* Quiz Form */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                1. What is your primary objective?
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
              >
                {GOALS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                2. Estimated Annual Gross Revenue / Profit Band
              </label>
              <select
                value={budgetBand}
                onChange={(e) => setBudgetBand(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
              >
                {BUDGETS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                3. Formation Timeline
              </label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
              >
                {TIMELINES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-3 cursor-pointer bg-white border border-[#CBD5E1] p-3 rounded-xl">
                <input
                  type="checkbox"
                  checked={wantsRelocation}
                  onChange={(e) => setWantsRelocation(e.target.checked)}
                  className="rounded border-gray-300 text-[#F26522] focus:ring-[#F26522] h-4 w-4 accent-[#F26522]"
                />
                <span className="text-xs text-[#0F172A] font-semibold">
                  I require physical UAE residency visas (Investor / 10-Year Golden Visa)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F26522] hover:bg-[#C9511A] disabled:opacity-60 text-white font-black py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Evaluating Freezones...' : 'Find My Optimal Jurisdiction'}
            </button>
          </form>
        </div>

        {/* Results */}
        {recommendations && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[#0A142F] uppercase tracking-wider">
                Recommended Jurisdictions
              </h2>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> High Match Probability
              </span>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div
                  key={rec.jurisdiction}
                  className={`bg-white rounded-2xl shadow-sm border p-6 transition-all ${
                    idx === 0 ? 'border-[#F26522] ring-2 ring-[#F26522]/20' : 'border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      {idx === 0 && (
                        <span className="inline-block bg-[#F26522] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded mb-1.5">
                          Top Match #1
                        </span>
                      )}
                      <h3 className="text-base font-bold text-[#0A142F]">{rec.name}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-black text-[#0A142F]">{rec.matchScore}%</span>
                      <p className="text-[10px] text-[#64748B] font-bold">Fit Score</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#334155] leading-relaxed mb-4">{rec.whyFit}</p>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] mb-4 text-center">
                    <div>
                      <span className="text-[#64748B] block text-[10px] font-semibold">Corporate Tax</span>
                      <span className="font-extrabold text-emerald-600">{rec.corporateTaxRate}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] font-semibold">Turnaround</span>
                      <span className="font-bold text-[#0A142F]">{rec.timelineDays}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px] font-semibold">Pricing</span>
                      <span className="font-extrabold text-[#F26522]">{rec.priceAED || 'From AED 12,900'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="w-full py-3 rounded-xl bg-[#0A142F] hover:bg-[#1039AC] text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    Lock In Quote for {rec.name.split(' ')[0]} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <LeadCaptureModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          toolSlug="jurisdiction-quiz"
          toolTitle="Jurisdiction Fit Quiz"
          calculatorData={{
            goal,
            budgetBand,
            timeline,
            wantsRelocation,
            topMatch: recommendations?.[0]?.name,
          }}
          jurisdiction={recommendations?.[0]?.name}
          estimatedValue={4800}
        />
      </div>
    </div>
  )
}
