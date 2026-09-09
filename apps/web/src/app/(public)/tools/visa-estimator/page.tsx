'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Users, ShieldCheck, ArrowRight, CheckCircle2, Calculator } from 'lucide-react'
import { LeadCaptureModal } from '@/components/LeadCaptureModal'

export default function VisaEstimator() {
  const [investorVisas, setInvestorVisas] = useState(1)
  const [employeeVisas, setEmployeeVisas] = useState(0)
  const [dependentVisas, setDependentVisas] = useState(0)
  const [vipMedical, setVipMedical] = useState(true)
  const [goldenVisa, setGoldenVisa] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const investorCost = investorVisas * 4500
  const employeeCost = employeeVisas * 5200
  const dependentCost = dependentVisas * 3800
  const vipCost = vipMedical ? (investorVisas + employeeVisas + dependentVisas) * 750 : 0
  const goldenCost = goldenVisa ? 9500 : 0

  const totalCostAED = investorCost + employeeCost + dependentCost + vipCost + goldenCost
  const totalCostUSD = Math.round(totalCostAED / 3.6725)

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-[#D97706] bg-[#FEF3C7] px-3 py-1 rounded-full border border-amber-200">
            Immigration &amp; GDRFA
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#0A142F] tracking-tight">
            UAE Visa &amp; Emirates ID Cost Estimator
          </h1>
          <p className="mt-2 text-[#334155] text-sm">
            Calculate exact government immigration fees, establishment card, 2-year Emirates ID biometrics, and VIP medical.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs mb-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1">
                Investor / Partner Visas
              </label>
              <select
                value={investorVisas}
                onChange={(e) => setInvestorVisas(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
              >
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} Visa{n !== 1 ? 's' : ''}</option>
                ))}
              </select>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">AED 4,500 / visa</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1">
                Employee Staff Visas
              </label>
              <select
                value={employeeVisas}
                onChange={(e) => setEmployeeVisas(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
              >
                {[0, 1, 2, 3, 4, 5, 10].map((n) => (
                  <option key={n} value={n}>{n} Visa{n !== 1 ? 's' : ''}</option>
                ))}
              </select>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">AED 5,200 / visa (MOHRE)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1">
                Family Dependents
              </label>
              <select
                value={dependentVisas}
                onChange={(e) => setDependentVisas(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
              >
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} Visa{n !== 1 ? 's' : ''}</option>
                ))}
              </select>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">AED 3,800 / dependent</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <label className="flex items-center gap-3 cursor-pointer bg-white border border-[#CBD5E1] p-3 rounded-xl">
              <input
                type="checkbox"
                checked={vipMedical}
                onChange={(e) => setVipMedical(e.target.checked)}
                className="rounded border-gray-300 text-[#F26522] focus:ring-[#F26522] h-4 w-4 accent-[#F26522]"
              />
              <span className="text-xs text-[#0F172A] font-semibold">
                VIP 2-Hour Express Medical &amp; Biometrics Concierge (+AED 750 / person)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer bg-white border border-[#CBD5E1] p-3 rounded-xl">
              <input
                type="checkbox"
                checked={goldenVisa}
                onChange={(e) => setGoldenVisa(e.target.checked)}
                className="rounded border-gray-300 text-[#F26522] focus:ring-[#F26522] h-4 w-4 accent-[#F26522]"
              />
              <span className="text-xs text-[#0F172A] font-semibold">
                Upgrade to 10-Year UAE Golden Visa Fast-Track Nomination (+AED 9,500)
              </span>
            </label>
          </div>
        </div>

        {/* Total Box */}
        <div className="bg-[#0A142F] text-white rounded-3xl p-8 shadow-xl text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F26522] block mb-1">
            Total Immigration &amp; Visa Fee
          </span>
          <div className="text-4xl sm:text-5xl font-black tracking-tight text-white my-2">
            AED {totalCostAED.toLocaleString()}
          </div>
          <div className="text-sm font-semibold text-[#F26522]">
            Approx. ${totalCostUSD.toLocaleString()} USD
          </div>
          <p className="text-xs text-white/70 mt-2">
            Includes establishment file registration, entry permits, status change, 2-year Emirates ID cards, and VIP medical clearance.
          </p>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-6 px-8 py-3.5 rounded-xl bg-[#F26522] hover:bg-[#C9511A] text-white font-black text-xs uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
          >
            Lock In Visa Quota &amp; Book Concierge →
          </button>
        </div>

        <LeadCaptureModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          toolSlug="visa-estimator"
          toolTitle="Visa Cost Estimator"
          calculatorData={{
            investorVisas,
            employeeVisas,
            dependentVisas,
            vipMedical,
            goldenVisa,
            totalCostAED,
            totalCostUSD,
          }}
          estimatedValue={totalCostUSD}
        />
      </div>
    </div>
  )
}
