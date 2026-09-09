'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Receipt, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { LeadCaptureModal } from '@/components/LeadCaptureModal'

export default function VATScorer() {
  const [turnoverAED, setTurnoverAED] = useState<number | ''>(450000)
  const [localExpensesAED, setLocalExpensesAED] = useState<number | ''>(100000)
  const [isExportServices, setIsExportServices] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const turnover = Number(turnoverAED) || 0
  const isMandatory = turnover >= 375000
  const isVoluntary = turnover >= 187500 && turnover < 375000
  const isExempt = turnover < 187500

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-[#DC2626] bg-[#FEE2E2] px-3 py-1 rounded-full border border-rose-200">
            Federal Tax Authority (FTA)
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#0A142F] tracking-tight">
            UAE 5% VAT Registration Readiness Scorer
          </h1>
          <p className="mt-2 text-[#334155] text-sm">
            Evaluate whether your annual turnover triggers mandatory (AED 375,000) or voluntary (AED 187,500) UAE VAT registration.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs mb-8 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
              Annual Taxable Supplies / Turnover (AED)
            </label>
            <input
              type="number"
              value={turnoverAED}
              onChange={(e) => setTurnoverAED(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="450000"
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522] font-mono"
            />
            <div className="flex justify-between text-[10px] text-[#64748B] mt-1 font-semibold">
              <span>Voluntary: AED 187,500</span>
              <span>Mandatory: AED 375,000</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
              Annual UAE Taxable Local Expenses (AED)
            </label>
            <input
              type="number"
              value={localExpensesAED}
              onChange={(e) => setLocalExpensesAED(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="100000"
              className="w-full px-3.5 py-2.5 text-sm font-bold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522] font-mono"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer bg-white border border-[#CBD5E1] p-3 rounded-xl">
            <input
              type="checkbox"
              checked={isExportServices}
              onChange={(e) => setIsExportServices(e.target.checked)}
              className="rounded border-gray-300 text-[#F26522] focus:ring-[#F26522] h-4 w-4 accent-[#F26522]"
            />
            <span className="text-xs text-[#0F172A] font-semibold">
              Supplies are cross-border export of telecommunications / digital services (0% zero-rated VAT)
            </span>
          </label>
        </div>

        {/* Evaluation Output */}
        <div className="space-y-4">
          <div
            className={`rounded-2xl p-6 border shadow-xs ${
              isMandatory
                ? 'bg-rose-50/50 border-rose-300'
                : isVoluntary
                  ? 'bg-blue-50/50 border-blue-300'
                  : 'bg-emerald-50/50 border-emerald-300'
            }`}
          >
            <div className="flex items-start gap-4">
              {isMandatory ? (
                <AlertTriangle className="h-8 w-8 text-rose-600 shrink-0 mt-0.5" />
              ) : isVoluntary ? (
                <CheckCircle2 className="h-8 w-8 text-blue-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  {isMandatory
                    ? 'Mandatory 5% UAE VAT Registration Required (AED 375,000+ Exceeded)'
                    : isVoluntary
                      ? 'Voluntary VAT Registration Eligible (AED 187,500 Threshold Met)'
                      : 'Exempt: Below Minimum Registration Threshold'}
                </h3>
                <p className="text-xs text-[#334155] mt-1.5 leading-relaxed">
                  {isMandatory
                    ? 'Your business must obtain a Tax Registration Number (TRN) within 30 days of exceeding the threshold to avoid statutory late-registration penalties (AED 10,000).'
                    : isVoluntary
                      ? 'You may voluntarily register for UAE VAT to reclaim 5% input VAT paid on local business expenses, office leases, and vendor equipment.'
                      : 'Your annual taxable turnover is below the voluntary registration floor. You are not required to register or charge VAT to clients.'}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#64748B]">Need an FTA registered tax agent to file your TRN?</span>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#0A142F] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1039AC] transition-colors cursor-pointer"
              >
                File VAT Registration →
              </button>
            </div>
          </div>
        </div>

        <LeadCaptureModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          toolSlug="vat-scorer"
          toolTitle="VAT Readiness Scorer"
          calculatorData={{
            turnoverAED,
            localExpensesAED,
            isExportServices,
            isMandatory,
            isVoluntary,
          }}
          estimatedValue={4800}
        />
      </div>
    </div>
  )
}
