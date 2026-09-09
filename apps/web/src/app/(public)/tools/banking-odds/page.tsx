'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Landmark, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react'
import { COUNTRIES } from '@/lib/countries'
import { LeadCaptureModal } from '@/components/LeadCaptureModal'

interface BankResult {
  bank: string
  odds: number
  turnaround: string
  tier: string
}

function computeOdds(industry: string, turnover: number): BankResult[] {
  let baseOdds = 85
  if (['Crypto', 'Real Estate', 'Gambling'].includes(industry)) baseOdds = 45
  if (['Consulting', 'Technology', 'Marketing'].includes(industry)) baseOdds = 95
  if (turnover >= 500000) baseOdds += 5

  const clamp = (n: number) => Math.max(10, Math.min(99, n))

  return [
    { bank: 'Wio Bank Business (Digital)', odds: clamp(baseOdds), turnaround: '48 - 72 Hours', tier: 'Top Pick' },
    { bank: 'Mashreq NeoBiz (Digital)', odds: clamp(baseOdds - 5), turnaround: '3 - 5 Days', tier: 'Fast Track' },
    { bank: 'Emirates NBD (Tier 1)', odds: clamp(baseOdds - 15), turnaround: '10 - 15 Days', tier: 'Traditional' },
    { bank: 'ADCB Commercial', odds: clamp(baseOdds - 20), turnaround: '15 - 20 Days', tier: 'Traditional' },
  ]
}

export default function BankingOddsMatcher() {
  const [nationality, setNationality] = useState('')
  const [industry, setIndustry] = useState('')
  const [turnover, setTurnover] = useState<number | ''>(250000)
  const [results, setResults] = useState<BankResult[] | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!industry || !turnover) return
    setResults(computeOdds(industry, Number(turnover)))
  }

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-[#1B4FD8] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200">
            Banking Risk Model
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#0A142F] tracking-tight">
            UAE Bank Account Approval Predictor
          </h1>
          <p className="mt-2 text-[#334155] text-sm">
            Predict your corporate account approval odds across Wio, NeoBiz, ENBD, and ADCB before filing.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <form onSubmit={handleCalculate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                Shareholder / Signatory Nationality
              </label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
              >
                <option value="">Select Nationality</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                Business Activity / Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
              >
                <option value="">Select Activity</option>
                <option value="Technology">Software / SaaS / AI / Tech</option>
                <option value="Consulting">Management Consulting &amp; Agency</option>
                <option value="E-commerce">Cross-Border E-Commerce &amp; Retail</option>
                <option value="Marketing">Digital Media &amp; Advertising</option>
                <option value="Real Estate">Property &amp; Real Estate Brokerage</option>
                <option value="Crypto">Web3 / Blockchain / Digital Assets</option>
                <option value="Trading">General Trading &amp; Commodities</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                Expected Annual Turnover ($ USD)
              </label>
              <input
                type="number"
                value={turnover}
                onChange={(e) => setTurnover(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="250000"
                required
                className="w-full px-3.5 py-2.5 text-sm font-bold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522] font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#1B4FD8] hover:bg-[#1039AC] text-white font-black py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md cursor-pointer"
            >
              <Landmark className="h-4 w-4" />
              Analyze Approval Probability
            </button>
          </form>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-sm font-black text-[#0A142F] uppercase tracking-wider">
              Bank Approval Odds Breakdown
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((res) => (
                <div
                  key={res.bank}
                  className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex items-center justify-between"
                >
                  <div>
                    <span className="text-[9px] font-extrabold uppercase bg-[#EFF6FF] text-[#1B4FD8] px-2 py-0.5 rounded">
                      {res.tier}
                    </span>
                    <h3 className="font-bold text-sm text-[#0F172A] mt-1.5">{res.bank}</h3>
                    <p className="text-[11px] text-[#64748B]">Est. Speed: {res.turnaround}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#0A142F]">
                      {res.odds}<span className="text-xs font-semibold text-[#64748B]">%</span>
                    </div>
                    <span className={`text-[10px] font-extrabold ${res.odds >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {res.odds >= 80 ? 'High Likelihood' : 'Dossier Review'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Concierge Box */}
            <div className="bg-[#0A142F] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div>
                <h4 className="text-base font-bold text-white">Need Guaranteed Bank Account Filing?</h4>
                <p className="text-xs text-white/70 mt-1 max-w-md">
                  Our compliance team prepares your business profile, invoice proofs, and arranges direct relationship manager submission.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-6 py-3 rounded-xl bg-[#F26522] hover:bg-[#C9511A] text-white font-bold text-xs uppercase tracking-wider shrink-0 transition-colors cursor-pointer shadow-md"
              >
                Inquire Banking Concierge →
              </button>
            </div>
          </div>
        )}

        <LeadCaptureModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          toolSlug="banking-odds"
          toolTitle="Banking Odds Matcher"
          calculatorData={{
            nationality,
            industry,
            turnover,
            oddsResult: results,
          }}
          estimatedValue={6500}
        />
      </div>
    </div>
  )
}
