'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Plus,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react'

import { WhatsAppMockupPreview } from '@/components/templates/WhatsAppMockupPreview'
import { TemplateBuilderModal } from '@/components/templates/TemplateBuilderModal'
import { SendTestModal } from '@/components/templates/SendTestModal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastProvider'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Template = Record<string, any>

const STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  APPROVED: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending: { label: 'Meta Reviewing', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  PENDING: { label: 'Meta Reviewing', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  rejected: { label: 'Rejected', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  REJECTED: { label: 'Rejected', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
}

// Starter templates for GCC Startup company formation
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tpl_welcome',
    name: 'gcc_welcome_inquiry',
    language: 'en',
    category: 'utility',
    status: 'approved',
    header: 'GCC Startup Formation',
    body: 'Hi {{1}}, thank you for inquiring about establishing your company in the UAE. Our senior corporate advisor has received your request regarding the {{2}} package. Would you like to schedule a 10-minute discovery call today?',
    footer: 'GCC Startup · Dubai & Abu Dhabi',
  },
  {
    id: 'tpl_pricing',
    name: 'gcc_tax_calculator_quote',
    language: 'en',
    category: 'marketing',
    status: 'approved',
    header: 'Your Freezone Formation Estimate',
    body: 'Hello {{1}}, based on your inputs in our UAE Corporate Tax & Cost Calculator, your estimated total setup cost for a {{2}} license with {{3}} visa quota is approximately AED {{4}}. Tap below to review your itemized quotation.',
    footer: 'Official Partner of IFZA, Meydan & DAFZA',
  },
  {
    id: 'tpl_kyc',
    name: 'gcc_kyc_passport_request',
    language: 'en',
    category: 'utility',
    status: 'approved',
    header: 'Document Verification',
    body: 'Dear {{1}}, to proceed with your company reservation at {{2}}, please upload a clear scan of your passport and proof of residence to our encrypted client vault: {{3}}.',
    footer: 'Secure Compliance Vault',
  },
]

export default function TemplatesPage() {
  const { success: showSuccess, error: showError } = useToast()
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [testModalTemplate, setTestModalTemplate] = useState<Template | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(DEFAULT_TEMPLATES[0])

  const fetchTemplates = () => {
    setLoading(true)
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => {
        const list: Template[] = Array.isArray(data) ? data : data?.templates || []
        if (list.length > 0) {
          setTemplates(list)
          setPreviewTemplate(list[0])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  // Pulls the live template list + approval statuses from Meta Cloud API and
  // upserts them locally; a no-op with a clear message when Meta env is unset.
  const syncWithMeta = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/templates/sync', { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        showSuccess(data.message || `Synced ${data.syncedCount ?? 0} templates from Meta`)
      } else {
        showError(data?.error || 'Template sync failed')
      }
    } catch {
      showError('Template sync failed')
    } finally {
      setSyncing(false)
      fetchTemplates()
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  return (
    <div className="space-y-6">
      {/* Modals */}
      <TemplateBuilderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => fetchTemplates()}
      />

      {testModalTemplate && (
        <SendTestModal
          isOpen={Boolean(testModalTemplate)}
          onClose={() => setTestModalTemplate(null)}
          template={testModalTemplate}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">WhatsApp Templates</h1>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              Meta Sync Active
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Create, test and sync official Meta-approved WhatsApp Cloud API message templates with dynamic variables.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={syncWithMeta} disabled={syncing}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync with Meta'}
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Main Grid: Template List + Live Mockup Preview */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left List */}
        <div className="lg:col-span-7 space-y-3">
          {templates.map((tpl) => {
            const isSelected = previewTemplate?.id === tpl.id
            const st = STATUS[tpl.status] || STATUS.approved

            return (
              <div
                key={tpl.id}
                onClick={() => setPreviewTemplate(tpl)}
                className={`cursor-pointer rounded-xl border p-4 transition-all shadow-xs ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--surface-hover)] ring-1 ring-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block font-mono text-sm font-bold text-[var(--text)] truncate">
                      {tpl.name}
                    </span>
                    <span className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">
                      {tpl.category} · {tpl.language?.toUpperCase() || 'EN'}
                    </span>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${st.cls}`}
                  >
                    {st.label}
                  </span>
                </div>

                <p className="mt-2 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {tpl.body}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5 text-xs">
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    {tpl.header ? `Header: ${tpl.header}` : 'Text only'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setTestModalTemplate(tpl)
                    }}
                    className="inline-flex items-center text-xs font-semibold text-[var(--accent)] hover:underline"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send Test
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                  Live WhatsApp Preview
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                {previewTemplate?.name || 'Preview'}
              </span>
            </div>

            {previewTemplate ? (
              <WhatsAppMockupPreview
                template={previewTemplate}
                sampleValues={{ '1': 'Tariq Mansoor', '2': 'IFZA Freezone', '3': '1', '4': '18,500' }}
              />
            ) : (
              <div className="p-8 text-center text-xs text-[var(--text-tertiary)]">
                Select a template to view phone preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
