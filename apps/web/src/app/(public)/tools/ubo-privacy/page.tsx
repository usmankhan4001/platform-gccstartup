'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Lock, ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { LeadCaptureModal } from '@/components/LeadCaptureModal'

export default function UBOPrivacyMatrix() {
  const [structure, setStructure] = useState('direct')
  const [jurisdiction, setJurisdiction] = useState('uae_freezone')
  const [showModal, setShowModal] = useState(false)

  const isPublicRegister = structure === 'direct' && jurisdiction !== 'bvi_cayman'

  return (
    <div className="bg-white text-[#0F172A] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-[#0A142F] bg-[#F1F5F9] px-3 py-1 rounded-full border border-slate-200">
            Fiduciary &amp; Asset Protection
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#0A142F] tracking-tight">
            UBO Privacy &amp; Public Register Matrix
          </h1>
          <p className="mt-2 text-[#334155] text-sm">
            Evaluate whether your beneficial ownership details are accessible on public commercial registers.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs mb-8 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
              Current / Target Shareholding Structure
            </label>
            <select
              value={structure}
              onChange={(e) => setStructure(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
            >
              <option value="direct">Direct Individual Shareholding (Self as UBO)</option>
              <option value="nominee">Institutional Nominee Director / Shareholder (Declaration of Trust)</option>
              <option value="holding">Foreign Offshore Holding Entity (BVI/Cayman)</option>
              <option value="foundation">ADGM / DIFC Foundation (Private Wealth Trust)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0A142F] uppercase mb-1.5">
              Operating Jurisdiction
            </label>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-semibold border border-[#CBD5E1] rounded-xl bg-white focus:outline-none focus:border-[#F26522]"
            >
              <option value="uae_freezone">UAE Freezone (IFZA/Meydan/DMCC)</option>
              <option value="uae_mainland">UAE Mainland (DED)</option>
              <option value="ksa">Saudi Arabia (MISA)</option>
              <option value="singapore">Singapore (ACRA)</option>
              <option value="hongkong">Hong Kong Companies Registry</option>
              <option value="bvi_cayman">BVI / Cayman Islands</option>
            </select>
          </div>
        </div>

        {/* Evaluation Result */}
        <div className="space-y-4">
          <div
            className={`rounded-2xl p-6 border shadow-xs ${
              structure === 'nominee' || structure === 'foundation'
                ? 'bg-emerald-50/50 border-emerald-300'
                : isPublicRegister
                  ? 'bg-amber-50/50 border-amber-300'
                  : 'bg-blue-50/50 border-blue-300'
            }`}
          >
            <div className="flex items-start gap-4">
              {structure === 'nominee' || structure === 'foundation' ? (
                <ShieldCheck className="h-8 w-8 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Lock className="h-8 w-8 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  {structure === 'nominee'
                    ? 'Maximum Confidentiality: Nominee Fiduciary Shield Active'
                    : structure === 'foundation'
                      ? 'Institutional Wealth Protection: Foundation Trust Structure'
                      : isPublicRegister
                        ? 'Public Disclosure Warning: Individual UBO Listed on Register'
                        : 'Confidential Registry: Limited Access'}
                </h3>
                <p className="text-xs text-[#334155] mt-1.5 leading-relaxed">
                  {structure === 'nominee'
                    ? 'Under a Declaration of Trust, the institutional nominee appears on the public trade license. Your name is protected while you hold 100% beneficial rights and bank signatory power.'
                    : structure === 'foundation'
                      ? 'DIFC and ADGM Foundations provide orphan entity holding structures where assets are legally separated from personal liabilities and public registers.'
                      : 'Under standard direct shareholding, beneficial owner names, nationality, and passport details are recorded in commercial registry records and searchable by third parties.'}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#64748B]">Inquire about institutional nominee services?</span>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#0A142F] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1039AC] transition-colors cursor-pointer"
              >
                Inquire Privacy Shield ($12,500) →
              </button>
            </div>
          </div>
        </div>

        <LeadCaptureModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          toolSlug="ubo-privacy"
          toolTitle="UBO Privacy Shield"
          calculatorData={{
            structure,
            jurisdiction,
            isPublicRegister,
          }}
          jurisdiction={jurisdiction}
          estimatedValue={12500}
        />
      </div>
    </div>
  )
}
