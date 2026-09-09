'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Landmark,
  ShieldCheck,
  Layers,
  Users,
  CalendarCheck2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FileCheck2,
  Send,
  Loader2,
  Scale,
} from 'lucide-react'

const SERVICES = [
  {
    id: 'company-registration',
    icon: Building2,
    title: 'UAE Company Registration & Licensing',
    subtitle: 'Freezone & Mainland Trade Licenses',
    description: 'Turnkey remote incorporation across 40+ UAE freezones (IFZA, Meydan, RAKEZ, DAFZA, DMCC) and Dubai Mainland (DED). 100% foreign ownership with zero capital deposit requirements.',
    highlights: [
      '3 to 5 business day digital turnaround',
      'Electronic MOA & Certificate of Incorporation',
      'Immigration establishment card registration',
      'Zero physical office required for setup',
    ],
    startingPrice: 'From AED 11,500',
  },
  {
    id: 'bank-account',
    icon: Landmark,
    title: 'Corporate Bank Account Opening',
    subtitle: 'Tier-1 UAE & Multi-Currency Digital Banks',
    description: 'Direct relationship manager filing across Wio Bank, Mashreq NeoBiz, Emirates NBD, ADCB, and FAB. We prepare your business profile, transaction proofs, and compliance dossier.',
    highlights: [
      '99.2% bank file approval rate',
      'Fast-track digital account opening in 48-72 hours',
      'USD, EUR, AED, GBP multi-currency support',
      'Dedicated compliance officer assigned to file',
    ],
    startingPrice: 'From AED 3,500',
  },
  {
    id: 'nominee-ubo',
    icon: ShieldCheck,
    title: 'Nominee UBO & Fiduciary Protection',
    subtitle: 'Strict Privacy & Wealth Concealment',
    description: 'Institutional-grade nominee director and nominee shareholder structures. Your personal identity remains confidential on all public registries while you retain 100% economic control.',
    highlights: [
      'Legally binding Declaration of Trust',
      'Notarized Power of Attorney (POA) to founder',
      'Bank signatory power retained by client',
      'Full AML & regulatory compliance protection',
    ],
    startingPrice: 'From $12,500',
  },
  {
    id: 'shelf-company',
    icon: Layers,
    title: 'Aged Shelf Companies',
    subtitle: 'Immediate Operational History & Vintage',
    description: 'Clean, pre-incorporated UAE entities aged 1 to 3 years. Ideal for founders needing instant enterprise credibility, government tender eligibility, or immediate contractual capability.',
    highlights: [
      'Full historical audit & debt-free warranty',
      'Immediate 48-hour ownership transfer',
      'Existing trade license & establishment card',
      'Available with pre-cleared bank files',
    ],
    startingPrice: 'From $11,000',
  },
  {
    id: 'tax-residency',
    icon: Users,
    title: 'Tax Residency & 10-Year Golden Visas',
    subtitle: 'Official UAE Residence & Tax Certificates',
    description: 'Secure personal tax-free status with UAE Tax Residency Certificates (TRC) and 10-Year Golden Visas. VIP medical biometrics concierge in Dubai for frictionless status issuance.',
    highlights: [
      'Direct ICP & GDRFA immigration clearance',
      '0% personal income tax on global earnings',
      'No minimum UAE physical stay for Golden Visa',
      'Includes family sponsorship & dependents',
    ],
    startingPrice: 'From AED 9,500',
  },
  {
    id: 'annual-renewals',
    icon: CalendarCheck2,
    title: 'Annual Renewals & Corporate Tax Compliance',
    subtitle: 'Automated Regulatory & Ledger Management',
    description: 'Ongoing corporate maintenance, trade license renewals, ESR/UBO filings, monthly VAT return submissions, and annual Corporate Tax returns with the Federal Tax Authority (FTA).',
    highlights: [
      'Automated 60d/30d/7d renewal alerts',
      'FTA registered tax agent review',
      'Avoid statutory fines and license freeze',
      'Dedicated compliance manager on retainer',
    ],
    startingPrice: 'From AED 1,200/mo',
  },
]

const TIMELINE = [
  { step: '01', title: 'Scope & Structure Selection', desc: 'Consultation to pick the optimal freezone authority, shareholding format, and visa quota.' },
  { step: '02', title: 'Remote Digital Filing', desc: 'Submission of passport copies, name reservation, and initial approval via registry portal.' },
  { step: '03', title: 'License & MOA Issuance', desc: 'Official trade license, lease agreement, and electronic memorandum issued in 3–5 days.' },
  { step: '04', title: 'Emirates ID & Bank Activation', desc: 'VIP 2-hour medical biometrics and expedited corporate bank account approval.' },
]

export default function ServicesPage() {
  const [formState, setFormState] = useState({ name: '', email: '', phone: '', service: 'Company Registration' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/lead/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formState,
          source: 'services_catalog_inquiry',
          service: formState.service,
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
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-wider text-[#1B4FD8] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200">
            Corporate Services Directory
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black text-[#0A142F] tracking-tight">
            Institutional Corporate &amp; Structuring Solutions
          </h1>
          <p className="mt-3 text-[#334155] text-base">
            From remote incorporation and corporate banking to fiduciary nominee structures and corporate tax filings across the GCC.
          </p>
        </div>

        {/* 6 Core Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {SERVICES.map((srv) => (
            <div
              key={srv.id}
              className="bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1B4FD8] rounded-3xl p-8 shadow-xs hover:shadow-2xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-[#E2E8F0] text-[#0A142F] flex items-center justify-center shadow-xs">
                    <srv.icon className="h-6 w-6 text-[#1B4FD8]" />
                  </div>
                  <span className="text-xs font-black text-[#F26522] bg-[#FEF1E9] px-2.5 py-1 rounded-md">
                    {srv.startingPrice}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#0A142F]">{srv.title}</h3>
                <p className="text-xs font-semibold text-[#64748B] mt-0.5">{srv.subtitle}</p>

                <p className="mt-3 text-xs text-[#334155] leading-relaxed">
                  {srv.description}
                </p>

                <div className="mt-6 pt-4 border-t border-[#E2E8F0] space-y-2">
                  {srv.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-2 text-xs text-[#334155]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => {
                    setFormState({ ...formState, service: srv.title })
                    document.getElementById('service-inquiry')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="w-full py-3 rounded-xl bg-[#0A142F] hover:bg-[#1039AC] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Inquire This Service →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 4-Step Process Bar */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-8 sm:p-12 mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-[#F26522]">
              Frictionless Execution
            </span>
            <h2 className="mt-2 text-3xl font-black text-[#0A142F]">
              How Your Entity is Formed &amp; Banked
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIMELINE.map((step) => (
              <div key={step.step} className="bg-white p-6 rounded-2xl border border-[#E2E8F0] relative shadow-xs">
                <span className="text-3xl font-black text-[#F26522]/20 absolute top-4 right-4">
                  {step.step}
                </span>
                <span className="inline-block h-8 w-8 rounded-lg bg-[#0A142F] text-white text-xs font-black flex items-center justify-center mb-4">
                  {step.step}
                </span>
                <h4 className="text-sm font-bold text-[#0F172A]">{step.title}</h4>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Inquiry Form */}
        <div id="service-inquiry" className="bg-[#0A142F] text-white rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <span className="text-xs font-black uppercase tracking-wider text-[#F26522] bg-white/10 px-3 py-1 rounded-full">
              Direct Desk Assignment
            </span>
            <h3 className="mt-3 text-3xl font-black text-white">
              Speak with a Senior Corporate Structuring Advisor
            </h3>
            <p className="mt-2 text-xs text-white/70">
              Selected Service: <span className="font-bold text-[#F26522]">{formState.service}</span>
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            {submitted ? (
              <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="font-bold text-base text-white">Consultation Request Dispatched</h4>
                <p className="text-xs text-white/80 mt-1">
                  Our Dubai corporate desk will connect via WhatsApp and email within 15 minutes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Full Name *"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#F26522]"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Work Email *"
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
                  {submitting ? 'Connecting with Advisor...' : 'Request Free Consultation'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
