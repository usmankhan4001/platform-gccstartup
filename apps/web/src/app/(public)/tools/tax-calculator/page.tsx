'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Calculator, Loader2, TrendingDown, ShieldCheck, Sparkles } from 'lucide-react'
import { LeadCaptureModal } from '@/components/LeadCaptureModal'

const CURRENT_COUNTRIES = [
  { code: 'US', name: 'United States (avg 27%)', baseRate: 0.27 },
  { code: 'UK', name: 'United Kingdom (25%)', baseRate: 0.25 },
  { code: 'DE', name: 'Germany (30%)', baseRate: 0.30 },
  { code: 'FR', name: 'France (25%)', baseRate: 0.25 },
  { code: 'CA', name: 'Canada (26%)', baseRate: 0.26 },
  { code: 'AU', name: 'Australia (30%)', baseRate: 0.30 },
  { code: 'IN', name: 'India (25%)', baseRate: 0.25 },
  { code: 'ES', name: 'Spain (25%)', baseRate: 0.25 },
  { code: 'IT', name: 'Italy (24%)', baseRate: 0.24 },
]

const TARGET_JURISDICTIONS = [
  { code: 'uae', name: 'UAE Free Zone (0% - 9% QFZP)', targetRate: 0.0 },
  { code: 'ksa', name: 'Saudi Arabia RHQ (0% 30-Year)', targetRate: 0.0 },
  { code: 'qatar', name: 'Qatar QFC (10% Flat)', targetRate: 0.10 },
  { code: 'hong-kong', name: 'Hong Kong (0% Offshore / 8.25%)', targetRate: 0.0825 },
  { code: 'singapore', name: 'Singapore (17% Startup Exempt)', targetRate: 0.085 },
]

export default function TaxCalculator() {
  const [countryResidence, setCountryResidence] = useState('US')
  const [targetJurisdiction, setTargetJurisdiction] = useState('uae')
  const [annualProfit, setAnnualProfit] = useState<number | ''>(350000)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!annualProfit || annualProfit <= 0) return
    setLoading(true)

    try {
      const res = await fetch('/api/calculator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country_residence: countryResidence,
          target_jurisdiction: targetJurisdiction,
          annual_profit: Number(annualProfit),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
      } else {
        const homeRate = CURRENT_COUNTRIES.find((c) => c.code === countryResidence)?.baseRate || 0.25
        const targetRate = TARGET_JURISDICTIONS.find((j) => j.code === targetJurisdiction)?.targetRate || 0.0
        const profit = Number(annualProfit)
        const homeTax = profit * homeRate
        const targetTax = profit * targetRate
        setResult({
          home_tax_amount: homeTax,
          optimized_tax_amount: targetTax,
          net_annual_savings: homeTax - targetTax,
          optimized_tax_rate: targetRate,
        })
      }
    } catch {
      const homeRate = CURRENT_COUNTRIES.find((c) => c.code === countryResidence)?.baseRate || 0.25
      const targetRate = TARGET_JURISDICTIONS.find((j) => j.code === targetJurisdiction)?.targetRate || 0.0
      const profit = Number(annualProfit)
      const homeTax = profit * homeRate
      const targetTax = profit * targetRate
      setResult({
        home_tax_amount: homeTax,
        optimized_tax_amount: targetTax,
        net_annual_savings: homeTax - targetTax,
        optimized_tax_rate: targetRate,
      })
    } finally {
      setLoading(false)
    }
  }

  const fmtUSD = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-[#F26522] bg-[#FEF1E9] px-3 py-1 rounded-full border border-orange-200">
            2026 UAE Corporate Tax Law
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#0A142F] tracking-tight">
            Corporate Tax Savings Calculator
          </h1>
          <p className="mt-2 text-[#334155] text-sm">
            Calculate your tax reduction with 0% Qualifying Freezone Person rules &amp; Small Business Relief thresholds.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                  Current Country of Tax Residence
                </label>
                <select
                  value={countryResidence}
                  onChange={(e) => setCountryResidence(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
                >
                  {CURRENT_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                  Target Formation Jurisdiction
                </label>
                <select
                  value={targetJurisdiction}
                  onChange={(e) => setTargetJurisdiction(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
                >
                  {TARGET_JURISDICTIONS.map((j) => (
                    <option key={j.code} value={j.code}>{j.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                Estimated Annual Net Business Profit ($ USD)
              </label>
              <input
                type="number"
                value={annualProfit}
                onChange={(e) => setAnnualProfit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="350000"
                className="w-full px-3.5 py-2.5 text-sm font-bold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522] font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !annualProfit}
              className="w-full bg-[#F26522] hover:bg-[#C9511A] disabled:opacity-60 text-white font-black py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              {loading ? 'Calculating Tax Relief...' : 'Calculate Potential Savings'}
            </button>
          </form>
        </div>

        {/* Result Showcase */}
        {result && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-[#0A142F] text-white rounded-3xl p-8 shadow-xl text-center relative overflow-hidden">
              <span className="text-xs font-bold uppercase tracking-widest text-[#F26522] block mb-1">
                Estimated Annual Treasury Savings
              </span>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white my-2">
                {fmtUSD(result.net_annual_savings ?? 0)}
              </div>
              <p className="text-xs text-white/70">
                Annual retained earnings preserved in your corporate treasury through 0% Qualifying Free Zone Person substance.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-xs font-semibold">Current Home Country Tax</span>
                <span className="text-xl font-bold text-[#0F172A] mt-1 block">
                  {fmtUSD(result.home_tax_amount ?? 0)}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-xs font-semibold">Optimized Jurisdiction Tax</span>
                <span className="text-xl font-bold text-emerald-600 mt-1 block">
                  {fmtUSD(result.optimized_tax_amount ?? 0)}
                </span>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#0A142F]">Lock In 0% Corporate Tax Structure</h4>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Receive an itemized tax breakdown dossier and free consultation with our senior tax desk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-6 py-3 rounded-xl bg-[#0A142F] hover:bg-[#1039AC] text-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                Get Full Tax Dossier →
              </button>
            </div>
          </div>
        )}

        <LeadCaptureModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          toolSlug="tax-calculator"
          toolTitle="Corporate Tax Calculator"
          calculatorData={{
            countryResidence,
            targetJurisdiction,
            annualProfit,
            savings: result?.net_annual_savings,
          }}
          estimatedValue={result?.net_annual_savings ? Math.min(15000, Math.max(4800, Math.round(result.net_annual_savings * 0.05))) : 4800}
        />
      </div>
    </div>
  )
}
