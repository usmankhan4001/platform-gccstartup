'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Check,
  ShieldCheck,
  Building2,
  Layers,
  ArrowRight,
  HelpCircle,
  Calculator,
  Lock,
  Landmark,
  FileCheck2,
  Users,
  Send,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { ButtonLink } from '@/components/ui'

const PACKAGES = [
  {
    id: 'self-ubo',
    name: 'Self as UBO Package',
    tagline: 'Direct 100% Founder Equity',
    priceUSD: '$4,800',
    priceAED: 'AED 17,600',
    description: 'Standard incorporation with your personal name on the trade license and 100% direct shareholding.',
    badge: 'Most Popular',
    highlighted: true,
    features: [
      'Official UAE Trade License (1 Year)',
      'Lease Agreement / Virtual Office Address',
      'Memorandum of Association (MOA)',
      'Immigration Establishment Card',
      '1x Investor / Partner Visa Quota',
      'VIP Corporate Bank Account Filing (Wio/NeoBiz)',
      'UAE Corporate Tax Registration Support',
      'Digital Corporate Kit & Seal',
    ],
    cta: 'Select Self UBO',
  },
  {
    id: 'nominee-ubo',
    name: 'Nominee UBO & Fiduciary',
    tagline: 'Maximum Privacy & Wealth Shield',
    priceUSD: '$12,500',
    priceAED: 'AED 45,900',
    description: 'Institutional-grade privacy shielding with nominee corporate director and legal Declaration of Trust.',
    badge: 'High Privacy',
    highlighted: false,
    features: [
      'All Self-UBO Package Features Included',
      'Institutional Nominee Director / Shareholder',
      'Bespoke Declaration of Trust & Fiduciary Deed',
      'Notarized Power of Attorney (POA) to Founder',
      'Complete Concealment from Public Registries',
      'Tier-1 Corporate Banking Representation',
      'Dedicated Private Client Legal Counsel',
      'Annual Compliance & AML Reporting Included',
    ],
    cta: 'Inquire Nominee Service',
  },
  {
    id: 'shelf-company',
    name: 'Aged Shelf Company',
    tagline: 'Immediate Operational History',
    priceUSD: '$11,000',
    priceAED: 'AED 40,400',
    description: 'Pre-registered UAE company with clean compliance history, ready for immediate transfer and contract bidding.',
    badge: 'Instant Transfer',
    highlighted: false,
    features: [
      '1 to 3 Years Established Vintage History',
      'Clean Financial Audit & Zero Outstanding Debt',
      'Immediate Ownership & Director Transfer (48h)',
      'Existing Trade License & Establishment File',
      'Existing Bank Account Options (Subject to KYC)',
      'Immediate Tender & Enterprise Contract Eligibility',
      'Includes 1st Year Maintenance & Registered Agent',
      'Full Statutory Records & Certificates',
    ],
    cta: 'View Available Shelf Entities',
  },
]

const ADD_ONS = [
  { item: 'Additional Investor / Partner Visa', fee: 'AED 4,500 ($1,225)', details: 'Includes VIP medical, Emirates ID 2-year biometric, and status change' },
  { item: 'Employment Visa (Staff)', fee: 'AED 5,200 ($1,415)', details: 'Includes MOHRE labour contract, medical VIP, and residence permit' },
  { item: 'Tier-1 Traditional Bank Concierge (ENBD/ADCB/FAB)', fee: 'AED 5,000 ($1,360)', details: 'Dedicated relationship manager file submission and compliance prep' },
  { item: '10-Year UAE Golden Visa Fast-Track', fee: 'AED 9,500 ($2,580)', details: 'Direct ICP nomination for executive founders, property investors, and tech leaders' },
  { item: 'Annual Accounting & Bookkeeping Retainer', fee: 'From AED 1,200/mo', details: 'Monthly FTA VAT returns, bookkeeping ledger, and corporate tax readiness' },
]

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState('self-ubo')
  const [formState, setFormState] = useState({ name: '', email: '', phone: '', company: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const planObj = PACKAGES.find((p) => p.id === selectedPlan)
      const res = await fetch('/api/lead/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          package_type: selectedPlan,
          service: planObj?.name,
          source: 'pricing_table_selection',
          estimated_value: selectedPlan === 'nominee-ubo' ? 12500 : selectedPlan === 'shelf-company' ? 11000 : 4800,
        }),
      })
      if (res.ok) setSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-[#FFFFFF] text-[#0F172A] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-wider text-[#F26522] bg-[#FEF1E9] px-3 py-1 rounded-full border border-orange-200">
            Transparent Pricing
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black text-[#0A142F] tracking-tight">
            UAE Formation &amp; Structuring Packages
          </h1>
          <p className="mt-3 text-[#334155] text-base">
            Fixed institutional pricing with zero hidden fees. Includes official government registry costs, corporate banking concierge, and dedicated legal onboarding.
          </p>
        </div>

        {/* 3 Package Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-20">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-3xl border p-8 flex flex-col justify-between transition-all ${
                pkg.highlighted
                  ? 'border-[#F26522] ring-2 ring-[#F26522]/20 bg-white shadow-2xl relative scale-102'
                  : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:shadow-xl'
              }`}
            >
              {pkg.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F26522] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                  {pkg.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#0A142F]">{pkg.name}</h3>
                  {!pkg.highlighted && (
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-white text-[#64748B] border border-[#E2E8F0]">
                      {pkg.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748B] mt-1">{pkg.tagline}</p>

                <div className="mt-6 mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-[#0A142F]">{pkg.priceUSD}</span>
                    <span className="text-sm font-semibold text-[#64748B]">/ {pkg.priceAED}</span>
                  </div>
                  <span className="text-[11px] text-[#64748B] block mt-0.5">All-inclusive first year formation fee</span>
                </div>

                <p className="text-xs text-[#334155] leading-relaxed mb-6 pt-3 border-t border-[#E2E8F0]">
                  {pkg.description}
                </p>

                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-black text-[#0A142F] uppercase tracking-wider">
                    Included Features
                  </div>
                  {pkg.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs text-[#334155]">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(pkg.id)
                    const el = document.getElementById('booking-section')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    pkg.highlighted
                      ? 'bg-[#F26522] hover:bg-[#C9511A] text-white shadow-lg shadow-orange-500/20'
                      : 'bg-[#0A142F] hover:bg-[#1039AC] text-white'
                  }`}
                >
                  {pkg.cta} →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Transparent Add-ons & Visa Table */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-8 mb-20">
          <div className="max-w-3xl mb-8">
            <h2 className="text-2xl font-black text-[#0A142F]">
              Transparent Add-Ons &amp; Regulatory Fees
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Exact itemized costs for immigration, employee quotas, Golden Visas, and bank concierge.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#0A142F] font-black uppercase tracking-wider">
                  <th className="pb-3">Service / Add-On</th>
                  <th className="pb-3">Standard Fee</th>
                  <th className="pb-3">Scope &amp; Turnaround</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                {ADD_ONS.map((addon) => (
                  <tr key={addon.item} className="hover:bg-white transition-colors">
                    <td className="py-3.5 font-bold text-[#0F172A]">{addon.item}</td>
                    <td className="py-3.5 font-extrabold text-[#0A142F]">{addon.fee}</td>
                    <td className="py-3.5 text-[#64748B]">{addon.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Capture & Booking Section */}
        <div id="booking-section" className="bg-[#0A142F] text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <span className="text-xs font-black uppercase tracking-wider text-[#F26522] bg-white/10 px-3 py-1 rounded-full">
              Lock In Package &amp; Fees
            </span>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-white">
              Ready to Form Your Entity? Request an Official Quote
            </h3>
            <p className="mt-2 text-xs text-white/70">
              Selected Structure:{' '}
              <span className="font-bold text-[#F26522]">
                {PACKAGES.find((p) => p.id === selectedPlan)?.name}
              </span>
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            {submitted ? (
              <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                <h4 className="font-bold text-base text-white">Application Assigned to Dubai Desk</h4>
                <p className="text-xs text-white/80 mt-1">
                  Your customized fee breakdown and document checklist are on their way to your email and WhatsApp.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Full Name *"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#F26522]"
                  />
                  <input
                    type="text"
                    placeholder="Proposed Entity Name / Company"
                    value={formState.company}
                    onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#F26522]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Corporate Email *"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#F26522]"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp Phone Number *"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#F26522]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-[#F26522] hover:bg-[#C9511A] text-white font-black text-xs uppercase tracking-wider shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? 'Generating Official Quote...' : 'Submit Formation Inquiry'}
                </button>
                <p className="text-[10px] text-white/40 text-center">
                  Official registered agent representation under UAE Ministry of Economy licensing regulations.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
