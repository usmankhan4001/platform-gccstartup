'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { FileCheck2, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import { LeadCaptureModal } from '@/components/LeadCaptureModal'

const RESTRICTED_TERMS = ['bank', 'insurance', 'royal', 'ministry', 'emirates', 'dubai', 'federal', 'global', 'islamic']

export default function NameEligibilityChecker() {
  const [name, setName] = useState('')
  const [legalSuffix, setLegalSuffix] = useState('FZ-LLC')
  const [result, setResult] = useState<{ eligible: boolean; warnings: string[]; reasons: string[] } | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const lower = name.toLowerCase()
    const foundRestricted = RESTRICTED_TERMS.filter((term) => lower.includes(term))
    const warnings: string[] = []
    const reasons: string[] = []

    if (foundRestricted.length > 0) {
      warnings.push(`Contains regulated terms: "${foundRestricted.join(', ')}" which requires special ministry pre-approval.`)
    }
    if (name.length < 3) {
      reasons.push('Trade name is too short (must be at least 3 characters).')
    }
    if (/^[0-9]/.test(name)) {
      warnings.push('Trade names starting with numbers may face delays in Arabic transliteration.')
    }

    const eligible = reasons.length === 0

    setResult({
      eligible,
      warnings,
      reasons: eligible ? ['Complies with UAE Ministry of Economy commercial naming standards.'] : reasons,
    })
  }

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-[#1B4FD8] bg-[#EFF6FF] px-3 py-1 rounded-full border border-blue-200">
            Ministry of Economy Standards
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#0A142F] tracking-tight">
            Company Name Eligibility Checker
          </h1>
          <p className="mt-2 text-[#334155] text-sm">
            Check your proposed UAE commercial trade name against registry reservation and trademark restrictions.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <form onSubmit={handleCheck} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
                Proposed Trade Name
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Global Tech"
                  required
                  className="flex-1 px-3.5 py-2.5 text-sm font-bold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
                />
                <select
                  value={legalSuffix}
                  onChange={(e) => setLegalSuffix(e.target.value)}
                  className="w-full sm:w-40 px-3.5 py-2.5 text-xs font-bold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
                >
                  <option value="FZ-LLC">FZ-LLC</option>
                  <option value="FZE">FZE (Single)</option>
                  <option value="LLC">Mainland LLC</option>
                  <option value="Ltd">Ltd (ADGM/DIFC)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0A142F] hover:bg-[#1039AC] text-white font-black py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md cursor-pointer"
            >
              <FileCheck2 className="h-4 w-4 text-[#F26522]" />
              Check Name Availability
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div
              className={`rounded-2xl p-6 border shadow-xs ${
                result.eligible ? 'bg-emerald-50/50 border-emerald-300' : 'bg-amber-50/50 border-amber-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {result.eligible ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">
                    {result.eligible
                      ? `"${name} ${legalSuffix}" is Eligible for Reservation`
                      : 'Proposed Name Requires Modification'}
                  </h3>
                  <div className="mt-2 space-y-1 text-xs text-[#334155]">
                    {result.reasons.map((r) => (
                      <p key={r}>• {r}</p>
                    ))}
                    {result.warnings.map((w) => (
                      <p key={w} className="text-amber-700 font-semibold">• Warning: {w}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-[#64748B]">Ready to reserve this trade name officially?</span>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#0A142F] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1039AC] transition-colors cursor-pointer"
                >
                  Reserve Trade Name →
                </button>
              </div>
            </div>
          </div>
        )}

        <LeadCaptureModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          toolSlug="name-checker"
          toolTitle="Company Name Checker"
          calculatorData={{
            name,
            legalSuffix,
            result,
          }}
          estimatedValue={4800}
        />
      </div>
    </div>
  )
}
