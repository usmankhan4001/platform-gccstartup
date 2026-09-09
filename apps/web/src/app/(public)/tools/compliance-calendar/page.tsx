'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Clock, CalendarCheck2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'
import { LeadCaptureModal } from '@/components/LeadCaptureModal'

export default function ComplianceCalendar() {
  const [incorpDate, setIncorpDate] = useState('2025-06-15')
  const [financialYearEnd, setFinancialYearEnd] = useState('12-31')
  const [showModal, setShowModal] = useState(false)

  // Compute key deadlines
  const incorp = new Date(incorpDate)
  const licenseExpiry = new Date(incorp.getFullYear() + 1, incorp.getMonth(), incorp.getDate())
  const renewalWindow = new Date(licenseExpiry.getTime() - 60 * 24 * 60 * 60 * 1000)

  // CT Return deadline: 9 months after financial year end
  const ctDeadline = '9 months following financial year-end (e.g. September 30)'

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-[#16A34A] bg-[#DCFCE7] px-3 py-1 rounded-full border border-green-200">
            Annual Compliance Ledger
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#0A142F] tracking-tight">
            UAE Company Compliance Calendar
          </h1>
          <p className="mt-2 text-[#334155] text-sm">
            Calculate your exact statutory filing deadlines for trade license renewal, ESR notifications, and Corporate Tax returns.
          </p>
        </div>

        {/* Inputs */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                Trade License Incorporation Date
              </label>
              <input
                type="date"
                value={incorpDate}
                onChange={(e) => setIncorpDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-bold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                Financial Year-End
              </label>
              <select
                value={financialYearEnd}
                onChange={(e) => setFinancialYearEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
              >
                <option value="12-31">December 31 (Standard Calendar Year)</option>
                <option value="03-31">March 31</option>
                <option value="06-30">June 30</option>
              </select>
            </div>
          </div>
        </div>

        {/* Schedule Timeline Output */}
        <div className="space-y-4 mb-8">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-[#0A142F] uppercase tracking-wider">
              Calculated Statutory Deadlines
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
                <span className="text-[10px] font-black uppercase text-[#1B4FD8]">60-Day Renewal Window</span>
                <div className="text-base font-bold text-[#0A142F] mt-1">{fmtDate(renewalWindow)}</div>
                <p className="text-[11px] text-[#64748B] mt-0.5">Lease &amp; license renewal period opens</p>
              </div>

              <div className="p-4 rounded-xl bg-[#FEF1E9] border border-[#FED7AA]">
                <span className="text-[10px] font-black uppercase text-[#F26522]">Trade License Expiry</span>
                <div className="text-base font-bold text-[#0A142F] mt-1">{fmtDate(licenseExpiry)}</div>
                <p className="text-[11px] text-[#64748B] mt-0.5">Penalty grace period begins (30 days)</p>
              </div>

              <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0]">
                <span className="text-[10px] font-black uppercase text-[#15803D]">Corporate Tax Filing</span>
                <div className="text-base font-bold text-[#0A142F] mt-1">9 Months Post Year-End</div>
                <p className="text-[11px] text-[#64748B] mt-0.5">FTA Form 201 return &amp; payment</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0A142F] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white">Automate Corporate Annual Renewals</h4>
              <p className="text-xs text-white/70 mt-1 max-w-md">
                Our automated compliance desk tracks all deadlines and coordinates trade license renewals at wholesale agent rates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl bg-[#F26522] hover:bg-[#C9511A] text-white font-bold text-xs uppercase tracking-wider shrink-0 transition-colors cursor-pointer shadow-md"
            >
              Sync Compliance Calendar →
            </button>
          </div>
        </div>

        <LeadCaptureModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          toolSlug="compliance-calendar"
          toolTitle="Compliance Calendar"
          calculatorData={{
            incorpDate,
            financialYearEnd,
            licenseExpiry: fmtDate(licenseExpiry),
          }}
          estimatedValue={4800}
        />
      </div>
    </div>
  )
}
