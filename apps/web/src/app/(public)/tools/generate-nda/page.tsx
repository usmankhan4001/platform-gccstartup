'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Copy, Check, FileText, Printer, Sparkles, ShieldCheck } from 'lucide-react'
import { LeadCaptureModal } from '@/components/LeadCaptureModal'

export default function GenerateNDAPage() {
  const [yourCompany, setYourCompany] = useState('')
  const [otherParty, setOtherParty] = useState('')
  const [jurisdictionChoice, setJurisdictionChoice] = useState('DIFC (Dubai International Financial Centre)')
  const [generated, setGenerated] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!yourCompany || !otherParty) return
    setGenerated(true)
  }

  const getNDAText = () => {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    return `MUTUAL NON-DISCLOSURE AGREEMENT (NDA)

This Non-Disclosure Agreement (the "Agreement") is entered into as of ${today} (the "Effective Date"), by and between:

PARTY A: ${yourCompany || '[YOUR COMPANY]'}
PARTY B: ${otherParty || '[OTHER PARTY]'}

1. PURPOSE
The Parties wish to explore a potential business relationship or transaction and, in connection therewith, each Party may disclose to the other Party certain confidential and proprietary information.

2. CONFIDENTIAL INFORMATION
"Confidential Information" means all non-public, proprietary, or confidential information disclosed by one Party ("Disclosing Party") to the other Party ("Receiving Party"), whether orally or in writing, including but not limited to business plans, financial data, customer lists, software code, and trade secrets.

3. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees to:
(a) Protect and safeguard the confidentiality of all Confidential Information with at least the same degree of care as it uses for its own confidential information, but in no event less than a reasonable degree of care;
(b) Use the Confidential Information solely for the Purpose;
(c) Restrict disclosure of Confidential Information strictly to employees, contractors, and legal advisors who need to know such information and are bound by confidentiality obligations.

4. TERM & SURVIVAL
This Agreement shall remain in effect for a period of two (2) years from the Effective Date.

5. GOVERNING LAW & JURISDICTION
This Agreement shall be governed by, construed, and enforced in accordance with the laws of ${jurisdictionChoice}. Any dispute arising hereunder shall be subject to the exclusive jurisdiction of the competent courts of the chosen jurisdiction.

IN WITNESS WHEREOF, the Parties have executed this Mutual Non-Disclosure Agreement as of the Effective Date.

___________________________                  ___________________________
For: ${yourCompany || '[Party A]'}            For: ${otherParty || '[Party B]'}
Authorized Signatory                         Authorized Signatory`
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getNDAText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-[#F26522] bg-[#FEF1E9] px-3 py-1 rounded-full border border-orange-200">
            Legal Drafting Utility
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#0A142F] tracking-tight">
            Mutual Non-Disclosure Agreement Generator
          </h1>
          <p className="mt-2 text-[#334155] text-sm">
            Generate an enforceable bilateral NDA formatted for UAE, DIFC, ADGM, and international cross-border transactions.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                  Your Company / Legal Name
                </label>
                <input
                  type="text"
                  value={yourCompany}
                  onChange={(e) => setYourCompany(e.target.value)}
                  placeholder="e.g. Apex Global Tech FZ-LLC"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                  Counterparty Legal Name
                </label>
                <input
                  type="text"
                  value={otherParty}
                  onChange={(e) => setOtherParty(e.target.value)}
                  placeholder="e.g. Venture Capital Partners LLC"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                Governing Law &amp; Jurisdiction
              </label>
              <select
                value={jurisdictionChoice}
                onChange={(e) => setJurisdictionChoice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
              >
                <option value="DIFC (Dubai International Financial Centre)">DIFC (English Common Law / Dubai)</option>
                <option value="ADGM (Abu Dhabi Global Market)">ADGM (English Common Law / Abu Dhabi)</option>
                <option value="United Arab Emirates (Civil Code)">United Arab Emirates (Civil Code)</option>
                <option value="England &amp; Wales">England &amp; Wales</option>
                <option value="State of Delaware, USA">State of Delaware, USA</option>
                <option value="Singapore">Singapore Law</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!yourCompany || !otherParty}
              className="w-full bg-[#0A142F] hover:bg-[#1039AC] text-white font-black py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
            >
              <FileText className="h-4 w-4 text-[#F26522]" />
              Generate Mutual NDA Document
            </button>
          </form>
        </div>

        {/* NDA Result Box */}
        {generated && (
          <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden animate-in fade-in duration-300">
            <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0A142F]">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Ready for Execution ({jurisdictionChoice.split(' ')[0]})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#0A142F] text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 bg-[#F26522] hover:bg-[#C9511A] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Request Custom Legal Review</span>
                </button>
              </div>
            </div>

            <div className="p-5">
              <pre className="text-xs font-mono text-[#334155] whitespace-pre-wrap leading-relaxed bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] max-h-96 overflow-y-auto">
                {getNDAText()}
              </pre>
            </div>
          </div>
        )}

        <LeadCaptureModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          toolSlug="generate-nda"
          toolTitle="Instant NDA Generator"
          calculatorData={{
            yourCompany,
            otherParty,
            jurisdictionChoice,
          }}
          estimatedValue={4800}
        />
      </div>
    </div>
  )
}
