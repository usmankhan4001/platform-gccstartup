'use client'

import React from 'react'
import { Zap } from 'lucide-react'

export interface CannedMacro {
  id: string
  /** Trigger typed in the composer, always leading-slash. */
  shortcut: string
  title: string
  preview: string
  content: string
  /** Built-ins are always available; DB snippets can be hidden by module flags. */
  builtIn?: boolean
}

// Sales macros for GCC company formation. These are the floor: anything saved in
// `canned_responses` (GET /api/chat/snippets) is merged on top at runtime so
// agents keep one autocomplete surface.
export const DEFAULT_MACROS: CannedMacro[] = [
  {
    id: 'macro_intro',
    shortcut: '/intro',
    title: 'Introduction',
    preview: 'Introduce GCC Startup and the formation service',
    content:
      'Hello {{first_name}}, thank you for reaching out to GCC Startup. We help founders establish companies in the UAE and Saudi Arabia — freezone, mainland and offshore — typically within 5–10 business days. I would be glad to walk you through the options that fit your activity. When would be a good time for a short call?',
    builtIn: true,
  },
  {
    id: 'macro_pricing',
    shortcut: '/pricing',
    title: 'Pricing',
    preview: 'Share licence packages and indicative setup cost',
    content:
      'Hi {{first_name}}, here is the indicative pricing for a {{jurisdiction}} setup:\n\n• Freezone (0 visas) — from AED 12,500\n• Freezone (1–2 visas) — from AED 18,500\n• Mainland LLC — from AED 24,000\n\nEach package includes trade licence, registration, establishment card and our compliance onboarding. Final pricing depends on your activity and visa quota — shall I prepare a tailored quotation?',
    builtIn: true,
  },
  {
    id: 'macro_kyc_docs',
    shortcut: '/kyc-docs',
    title: 'KYC documents',
    preview: 'Request passport, proof of address and KYC pack',
    content:
      'Dear {{first_name}}, to complete the KYC file for your application we need:\n\n1. Passport copy (clear, all pages with stamps)\n2. Proof of residential address (utility bill or bank statement, last 3 months)\n3. Passport-size photograph with white background\n4. Completed KYC form (attached)\n\nYou can upload these to our secure client vault. All documents are stored encrypted and used only for regulatory compliance.',
    builtIn: true,
  },
  {
    id: 'macro_bank_checklist',
    shortcut: '/bank-checklist',
    title: 'Bank account checklist',
    preview: 'Corporate bank account opening requirements',
    content:
      'Hi {{first_name}}, here is the checklist to open your corporate bank account:\n\n1. Trade licence + memorandum of association\n2. Shareholder and signatory passports\n3. Business plan and projected turnover\n4. Proof of address for all shareholders\n5. Source-of-funds declaration\n6. Board resolution appointing signatories\n\nWe partner with Emirates NBD, Mashreq and Wio. I can arrange an introduction once the licence is issued — would you like me to book it?',
    builtIn: true,
  },
]

/** Extracts the active macro query from composer text, or null when inactive. */
export function macroQueryFrom(text: string): string | null {
  const trimmed = text.trimStart()
  if (!trimmed.startsWith('/')) return null
  const token = trimmed.split(/\s/)[0] ?? ''
  // A macro token is a single word; once the agent types a space the macro is resolved.
  if (text !== trimmed) return null
  return token.toLowerCase()
}

export function filterMacros(macros: CannedMacro[], query: string): CannedMacro[] {
  const q = query.replace(/^\//, '').toLowerCase()
  if (!q) return macros
  return macros.filter(
    (m) =>
      m.shortcut.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.preview.toLowerCase().includes(q)
  )
}

interface MacroAutocompleteProps {
  macros: CannedMacro[]
  activeIndex: number
  onSelect: (macro: CannedMacro) => void
  onHover: (index: number) => void
}

export function MacroAutocomplete({ macros, activeIndex, onSelect, onHover }: MacroAutocompleteProps) {
  if (macros.length === 0) return null

  return (
    <div className="absolute bottom-full left-0 z-40 mb-2 w-full max-w-md overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
      <div className="flex items-center gap-1.5 border-b border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1.5">
        <Zap className="h-3 w-3 text-[var(--accent)]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
          Canned macros
        </span>
        <span className="ml-auto text-[10px] text-[var(--text-tertiary)]">↑↓ navigate · Tab insert · Esc close</span>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {macros.map((macro, index) => {
          const isActive = index === activeIndex
          return (
            <button
              key={macro.id}
              type="button"
              onMouseEnter={() => onHover(index)}
              onMouseDown={(e) => {
                // Keep focus in the composer so the agent can keep typing.
                e.preventDefault()
                onSelect(macro)
              }}
              className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors ${
                isActive ? 'bg-[var(--orange-lt)]' : 'hover:bg-[var(--surface-hover)]'
              }`}
            >
              <span
                className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                  isActive
                    ? 'bg-[var(--orange)] text-white'
                    : 'bg-[var(--surface-alt)] text-[var(--orange-dk)] border border-[var(--border)]'
                }`}
              >
                {macro.shortcut}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-[var(--text)]">{macro.title}</span>
                <span className="block truncate text-[11px] text-[var(--text-tertiary)]">{macro.preview}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
