'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Plus,
  Clock,
  Sparkles,
  Layers,
  Copy,
  Check,
  Eye,
  Code2,
  Trash2,
  BarChart3,
  Search,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EMAIL_MERGE_TAGS, renderEmail, renderEmailPreview, type EmailDocument } from '@/lib/email/render'
import { EMAIL_BLOCKS, type EmailBlockName } from '@/puck/email-blocks'
import type { EmailSequence } from '@/components/automation/types'
import { useToast } from '@/components/ui/ToastProvider'

// ---------------------------------------------------------------- local types

type BuilderTemplate = {
  id: string
  name: string
  subject: string
  category: string
  description: string
  document: EmailDocument
  source: 'db' | 'starter'
}

type SuppressionRow = {
  id: string
  email: string
  reason: string
  source: string | null
  detail: string | null
  created_at: string | null
}

type DeliverabilityStats = {
  total: number
  queued: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  failed: number
  deliveryRate: number
  openRate: number
  clickRate: number
  bounceRate: number
  complaintRate: number
}

type SesConfig = {
  configured: boolean
  region: string | null
  fromEmail: string | null
  fromName: string | null
  missing: string[]
}

function pct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${(value * 100).toFixed(1)}%`
}

/** DB rows store the Puck document in `blocks`; only rows that parse into a
 * document with content can be edited in the builder — HTML-only rows are
 * skipped rather than rendered as a blank canvas. */
function toEmailDocument(blocks: unknown): EmailDocument | null {
  if (!blocks || typeof blocks !== 'object') return null
  const obj = blocks as { content?: unknown; root?: { props?: Record<string, unknown> } }
  const content = Array.isArray(blocks) ? blocks : Array.isArray(obj.content) ? obj.content : null
  if (!content || content.length === 0) return null
  return { content: content as EmailDocument['content'], root: { props: obj.root?.props ?? {} } }
}

/** Status chip vocabulary shared by the telemetry matrix and the sequences tab. */
function sequenceStatusChip(status: EmailSequence['status']): { label: string; className: string } {
  switch (status) {
    case 'active':
      return { label: 'ACTIVE', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'paused':
      return { label: 'PAUSED', className: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'draft':
      return { label: 'DRAFT', className: 'bg-slate-100 text-slate-600 border-slate-200' }
    case 'archived':
      return { label: 'ARCHIVED', className: 'bg-slate-100 text-slate-600 border-slate-200' }
    default:
      return { label: 'NOT SET UP', className: 'bg-orange-50 text-[var(--orange)] border-orange-200' }
  }
}

// Pre-built Branded Template Definitions for the Visual Puck Builder.
//
// These are quick-start documents, not database rows: the builder always has
// something to render and edit even on a fresh workspace. Templates saved in
// `email_templates` (via /api/email/templates) are fetched on mount and take
// precedence in the selector.
const STARTER_TEMPLATES: BuilderTemplate[] = [
  {
    id: 'tpl-welcome-blueprint',
    name: 'UAE Freezone Formation Blueprint',
    category: 'marketing',
    subject: 'Your UAE Company Formation Blueprint — {{company_name}}',
    description: 'Hero, two-column features, price table, advisor signature, and legal disclaimer.',
    document: {
      content: [
        {
          type: 'EmailHeader',
          props: {
            logoText: 'GCC STARTUP',
            tagline: 'Company Formation & Banking Operations',
            badgeText: 'Dubai Desk · UAE',
            theme: 'white',
          },
        },
        {
          type: 'EmailHero',
          props: {
            eyebrow: 'OFFICIAL ADVISORY SUMMARY',
            heading: 'Your Tailored UAE Setup Blueprint',
            subheading:
              'Hello {{first_name}}, based on your calculation for {{jurisdiction}}, here is your complete company formation schedule with estimated tax savings of {{tax_savings_aed}}.',
            buttonText: 'View Client Portal & Token',
            buttonUrl: '{{portal_url}}',
            theme: 'navy',
            align: 'left',
          },
        },
        {
          type: 'EmailColumns',
          props: {
            theme: 'light',
            columns: [
              {
                eyebrow: 'TAX ADVANTAGE',
                title: '0% Corporate Tax',
                body: 'Qualifying Free Zone Persons (QFZP) enjoy 0% UAE corporate tax on qualifying income and 100% profit repatriation.',
                buttonText: 'Tax Guide',
                buttonUrl: 'https://gccstartup.com/services',
              },
              {
                eyebrow: 'FAST-TRACK',
                title: '3-Day Issuance',
                body: 'Official trade license issued in 72 hours with VIP Emirates ID and medical biometric fast-track scheduling.',
                buttonText: 'Timeline',
                buttonUrl: 'https://gccstartup.com/compare',
              },
            ],
          },
        },
        {
          type: 'EmailPriceTable',
          props: {
            title: 'Official Formation & Government Fee Breakdown',
            subtitle: 'Transparent statutory fees for {{jurisdiction}} with zero hidden surcharges',
            totalFreezone: '14,700 AED',
            totalMainland: '21,200 AED',
            currencyLabel: 'AED',
            rows: [
              { item: 'Trade License & Government Registry Fee', freezoneAED: '8,500 AED', mainlandAED: '14,000 AED' },
              { item: 'Establishment Card & E-Channel Registration', freezoneAED: '1,800 AED', mainlandAED: '2,200 AED' },
              { item: 'Investor / Partner Residence Visa (3 Years)', freezoneAED: '3,200 AED', mainlandAED: '3,800 AED' },
              { item: 'Emirates ID & Medical Fitness VIP Fast-Track', freezoneAED: '1,200 AED', mainlandAED: '1,200 AED' },
              { item: 'Corporate Bank Account Opening Guarantee', freezoneAED: 'FREE', mainlandAED: 'FREE' },
            ],
            footerNote: 'All pricing guaranteed in writing by GCC Startup Advisory FZ-LLC.',
          },
        },
        {
          type: 'EmailSignature',
          props: {
            advisorName: 'Tariq Al-Mansoor',
            advisorTitle: 'Senior Formation Specialist & Banking Counsel',
            deskLocation: 'Dubai Desk · Emaar Square, Downtown Dubai',
            licenseNumber: 'UAE DED Agent #94821-B',
            phone: '+971 4 812 9000',
            whatsappUrl: 'https://wa.me/97148129000',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
            bookingUrl: 'https://gccstartup.com/contact',
          },
        },
        {
          type: 'EmailDisclaimer',
          props: {
            registeredEntityText: 'UAE Commercial License #109482 · Registered with Federal Tax Authority (FTA)',
            taxNotice: 'Corporate Tax Advice complies with UAE Federal Decree-Law No. 47 of 2022.',
          },
        },
        {
          type: 'EmailFooter',
          props: {
            companyName: 'GCC Startup Advisory FZ-LLC',
            address: 'Building 4, Emaar Square, Downtown Dubai, United Arab Emirates',
            showUnsubscribe: true,
          },
        },
      ],
      root: { props: { subject: 'Your UAE Company Formation Blueprint — {{company_name}}' } },
    } as EmailDocument,
    source: 'starter',
  },
  {
    id: 'tpl-kyc-request',
    name: 'KYC & Encrypted Document Request',
    category: 'transactional',
    subject: 'Action Required: Encrypted Passport Upload for {{company_name}}',
    description: 'KYC collection email with high-urgency call to action and upload token link.',
    document: {
      content: [
        {
          type: 'EmailHeader',
          props: {
            logoText: 'GCC STARTUP COMPLIANCE',
            badgeText: 'Encrypted Transmittal',
            theme: 'white',
          },
        },
        {
          type: 'EmailHero',
          props: {
            eyebrow: 'STATUTORY REQUIREMENT',
            heading: 'Passport & UBO Identification Needed',
            subheading:
              'Dear {{first_name}}, to submit your trade license application to the government registry for {{company_name}}, please upload a certified passport scan and proof of address through our 256-bit encrypted portal.',
            buttonText: 'Upload Identification Documents',
            buttonUrl: '{{portal_url}}',
            theme: 'orange',
            align: 'left',
          },
        },
        {
          type: 'EmailCtaCard',
          props: {
            title: 'Required Verification Checklist',
            body: '1. Clear color passport scan (minimum 6 months validity)\n2. Utility bill / Bank statement proof of address (< 3 months old)\n3. Digital passport photo on crisp white background',
            buttonText: 'Open Encrypted Uploader',
            buttonUrl: '{{portal_url}}',
            theme: 'light',
          },
        },
        {
          type: 'EmailSignature',
          props: {
            advisorName: 'Sarah Al-Maktoum',
            advisorTitle: 'Director of KYC & Government Compliance',
            deskLocation: 'Dubai Desk · Emaar Square',
            phone: '+971 4 812 9015',
            whatsappUrl: 'https://wa.me/97148129015',
          },
        },
        {
          type: 'EmailDisclaimer',
          props: {},
        },
        {
          type: 'EmailFooter',
          props: {
            showUnsubscribe: false,
          },
        },
      ],
      root: { props: { subject: 'Action Required: Encrypted Passport Upload for {{company_name}}' } },
    } as EmailDocument,
    source: 'starter',
  },
  {
    id: 'tpl-renewal-alert',
    name: 'Annual License & Compliance Renewal Notice',
    category: 'flow',
    subject: 'UAE Compliance Notice: Annual License Renewal for {{company_name}}',
    description: '30-day compliance warning to avoid government registry penalties and bank freeze.',
    document: {
      content: [
        {
          type: 'EmailHeader',
          props: {
            logoText: 'GCC STARTUP RENEWALS',
            badgeText: 'Compliance Radar',
            theme: 'white',
          },
        },
        {
          type: 'EmailHero',
          props: {
            eyebrow: 'RENEWAL REMINDER',
            heading: 'Trade License Expiry: {{trade_license_expiry}}',
            subheading:
              'Notice for {{company_name}} (License #{{license_number}}). Your statutory commercial license is due for annual renewal. Renew before expiry to maintain corporate bank account standing and avoid monthly economic department fines.',
            buttonText: 'Approve License Renewal & Invoice',
            buttonUrl: '{{portal_url}}',
            theme: 'navy',
            align: 'left',
          },
        },
        {
          type: 'EmailPriceTable',
          props: {
            title: 'Annual Statutory Renewal Invoice Summary',
            subtitle: 'Government fees, establishment card renewal, and registered office renewal',
            totalFreezone: '11,500 AED',
            totalMainland: '15,200 AED',
            currencyLabel: 'AED',
            rows: [
              { item: 'Trade License Annual Government Renewal Fee', freezoneAED: '7,500 AED', mainlandAED: '10,500 AED' },
              { item: 'Lease Agreement / Flexi-Desk Registered Address', freezoneAED: '2,500 AED', mainlandAED: '3,200 AED' },
              { item: 'Establishment Card & Immigration Renewal', freezoneAED: '1,500 AED', mainlandAED: '1,500 AED' },
            ],
            footerNote: 'Includes dedicated PRO renewal filing and updated Certificate of Incumbency.',
          },
        },
        {
          type: 'EmailSignature',
          props: {
            advisorName: 'Tariq Al-Mansoor',
            advisorTitle: 'Senior Formation Specialist & Banking Counsel',
            deskLocation: 'Dubai Desk · Emaar Square',
            phone: '+971 4 812 9000',
            whatsappUrl: 'https://wa.me/97148129000',
          },
        },
        {
          type: 'EmailDisclaimer',
          props: {},
        },
        {
          type: 'EmailFooter',
          props: {
            showUnsubscribe: true,
          },
        },
      ],
      root: { props: { subject: 'UAE Compliance Notice: Annual License Renewal for {{company_name}}' } },
    } as EmailDocument,
    source: 'starter',
  },
]

export function EmailOperationsView() {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'builder' | 'sequences' | 'suppressions'>('telemetry')
  const [templates, setTemplates] = useState<BuilderTemplate[]>(STARTER_TEMPLATES)
  const [selectedTemplate, setSelectedTemplate] = useState<BuilderTemplate>(STARTER_TEMPLATES[0])
  const [activeDoc, setActiveDoc] = useState<EmailDocument>(STARTER_TEMPLATES[0].document)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [interpolatePreview, setInterpolatePreview] = useState(true)
  const [viewHtmlCode, setViewHtmlCode] = useState(false)
  const [testEmailAddress, setTestEmailAddress] = useState('tariq@almansoorgroup.ae')
  const [sendingTest, setSendingTest] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [suppressions, setSuppressions] = useState<SuppressionRow[]>([])
  const [suppressionSearch, setSuppressionSearch] = useState('')
  const [newSuppressionEmail, setNewSuppressionEmail] = useState('')
  const [newSuppressionReason, setNewSuppressionReason] = useState('manual')
  const [showAddSuppressionModal, setShowAddSuppressionModal] = useState(false)
  const [sequences, setSequences] = useState<EmailSequence[]>([])
  const [selectedSequenceKey, setSelectedSequenceKey] = useState<string | null>(null)
  const [provisioningKey, setProvisioningKey] = useState<string | null>(null)
  const [stats, setStats] = useState<DeliverabilityStats | null>(null)
  const [sesConfig, setSesConfig] = useState<SesConfig | null>(null)
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null)

  const { success: showSuccess, error: showError, toast: showToast } = useToast()

  // ---------------------------------------------------------------- loaders

  const loadSequences = useCallback(async () => {
    try {
      const res = await fetch('/api/email/sequences')
      if (!res.ok) throw new Error('Failed to load sequences')
      const data = (await res.json()) as { data?: EmailSequence[] }
      setSequences(Array.isArray(data.data) ? data.data : [])
    } catch (err) {
      console.error('[email] sequences failed', err)
      // Empty list renders the graceful empty state; never a crash.
    }
  }, [])

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/email/templates')
      if (!res.ok) throw new Error('Failed to load templates')
      const data = (await res.json()) as { data?: Array<Record<string, unknown>> }
      const rows = Array.isArray(data.data) ? data.data : []
      const mapped = rows
        .map((row): BuilderTemplate | null => {
          const document = toEmailDocument(row.blocks)
          if (!document) return null
          return {
            id: String(row.id),
            name: String(row.name ?? 'Untitled template'),
            subject: String(row.subject ?? ''),
            category: String(row.category ?? 'marketing'),
            description: typeof row.description === 'string' ? row.description : 'Saved in the email template library.',
            document,
            source: 'db',
          }
        })
        .filter((entry): entry is BuilderTemplate => entry !== null)
      if (mapped.length) setTemplates([...mapped, ...STARTER_TEMPLATES])
    } catch (err) {
      console.error('[email] templates failed', err)
      // Starters remain available when the library is empty or unreachable.
    }
  }, [])

  const loadSuppressions = useCallback(async () => {
    try {
      const res = await fetch('/api/email/suppressions')
      if (!res.ok) throw new Error('Failed to load suppressions')
      const data = (await res.json()) as { data?: Array<Record<string, unknown>> }
      setSuppressions(
        (Array.isArray(data.data) ? data.data : []).map((row) => ({
          id: String(row.id),
          email: String(row.email),
          reason: String(row.reason ?? 'manual'),
          source: typeof row.source === 'string' ? row.source : null,
          detail: typeof row.detail === 'string' ? row.detail : null,
          created_at: typeof row.created_at === 'string' ? row.created_at : null,
        })),
      )
    } catch (err) {
      console.error('[email] suppressions failed', err)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/email/stats')
      if (!res.ok) throw new Error('Failed to load stats')
      setStats((await res.json()) as DeliverabilityStats)
    } catch (err) {
      console.error('[email] stats failed', err)
    }
  }, [])

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/email/config')
      if (!res.ok) throw new Error('Failed to load email config')
      setSesConfig((await res.json()) as SesConfig)
    } catch (err) {
      console.error('[email] config failed', err)
    }
  }, [])

  useEffect(() => {
    void loadSequences()
    void loadTemplates()
    void loadSuppressions()
    void loadStats()
    void loadConfig()
  }, [loadSequences, loadTemplates, loadSuppressions, loadStats, loadConfig])

  // Render HTML from activeDoc
  const rendered = interpolatePreview
    ? renderEmailPreview(activeDoc, { brandName: 'GCC Startup' })
    : renderEmail(activeDoc, { brandName: 'GCC Startup' })

  // Handle Copy Token
  const copyToken = (tag: string) => {
    navigator.clipboard.writeText(tag)
    setCopiedToken(tag)
    showSuccess(`Copied ${tag} to clipboard`)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  // Handle Test Send Email — renders the active document exactly as a real send
  // would and dispatches one transactional email through SES. The route reports
  // `not_configured` (missing env) and `suppressed` distinctly so the operator
  // always knows what actually happened.
  const handleSendTest = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      showError('Please enter a valid email address')
      return
    }
    setSendingTest(true)
    try {
      const res = await fetch('/api/email/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmailAddress, document: activeDoc }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string; missing?: string[]; messageId?: string; error?: string }
      if (res.ok && data.ok) {
        showSuccess(`Test email dispatched via Amazon SES to ${testEmailAddress}`)
      } else if (data.reason === 'not_configured') {
        showToast(`SES is not configured — missing env: ${(data.missing ?? []).join(', ') || 'unknown'}`)
      } else {
        showError(data.error || 'Failed to dispatch test email')
      }
    } catch (err) {
      console.error('[email] test send failed', err)
      showError('Failed to dispatch test email')
    } finally {
      setSendingTest(false)
    }
  }

  // Handle Block Reordering & Deletion
  const removeBlock = (index: number) => {
    const updated = {
      ...activeDoc,
      content: activeDoc.content.filter((_, i) => i !== index),
    }
    setActiveDoc(updated)
    if (selectedBlockIndex === index) setSelectedBlockIndex(null)
    showSuccess('Block removed')
  }

  // Add Block to Document
  const addBlock = (blockType: EmailBlockName) => {
    const blockDef = EMAIL_BLOCKS[blockType]
    if (!blockDef) return
    const newBlock = {
      type: blockType,
      props: { ...blockDef.defaults },
    }
    const updated = {
      ...activeDoc,
      content: [...activeDoc.content, newBlock],
    }
    setActiveDoc(updated)
    setSelectedBlockIndex(updated.content.length - 1)
    showSuccess(`Added ${blockDef.label} block`)
  }

  // Load a template into the builder (DB row or starter document)
  const loadTemplate = (tpl: BuilderTemplate) => {
    setSelectedTemplate(tpl)
    setActiveDoc(tpl.document)
    setSelectedBlockIndex(null)
    showSuccess(`Loaded template: ${tpl.name}`)
  }

  // Handle Add Suppression — persisted via /api/email/suppressions
  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSuppressionEmail || !newSuppressionEmail.includes('@')) {
      showError('Enter a valid email')
      return
    }
    try {
      const res = await fetch('/api/email/suppressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newSuppressionEmail.trim().toLowerCase(), reason: newSuppressionReason, source: 'Admin Manual Console', detail: 'Manual block entered by administrator' }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string }
      if (!res.ok) throw new Error(data.error || 'Failed to add suppression')
      setNewSuppressionEmail('')
      setShowAddSuppressionModal(false)
      showSuccess(data.message || 'Suppression added')
      await loadSuppressions()
    } catch (err) {
      console.error('[email] add suppression failed', err)
      showError(err instanceof Error ? err.message : 'Failed to add suppression')
    }
  }

  const handleRemoveSuppression = async (id: string, email: string) => {
    // Optimistic removal; the refetch restores the row if the delete fails.
    setSuppressions((rows) => rows.filter((row) => row.id !== id))
    try {
      const res = await fetch(`/api/email/suppressions?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove suppression')
      showSuccess(`Removed ${email} from suppression list`)
      await loadSuppressions()
    } catch (err) {
      console.error('[email] remove suppression failed', err)
      showError('Failed to remove suppression')
      await loadSuppressions()
    }
  }

  // Provision an unprovisioned sequence definition into a real flow row.
  const handleProvisionSequence = async (key: string) => {
    setProvisioningKey(key)
    try {
      const res = await fetch('/api/email/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; flow?: { id?: string }; error?: string }
      if (!res.ok) throw new Error(data.error || 'Failed to provision sequence')
      showSuccess('Sequence provisioned as a draft flow — open it in the builder to publish')
      await loadSequences()
    } catch (err) {
      console.error('[email] provision failed', err)
      showError(err instanceof Error ? err.message : 'Failed to provision sequence')
    } finally {
      setProvisioningKey(null)
    }
  }

  const filteredSuppressions = suppressions.filter(
    (s) =>
      s.email.toLowerCase().includes(suppressionSearch.toLowerCase()) ||
      s.reason.toLowerCase().includes(suppressionSearch.toLowerCase()),
  )

  const selectedSequence = sequences.find((seq) => seq.key === selectedSequenceKey) ?? sequences[0] ?? null

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Email Operations &amp; SES Engine</h1>
            {sesConfig?.configured ? (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SES Dedicated IP Pool Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                SES Not Configured
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            HubSpot-grade visual email builder, token variable mesh, automated formation drip sequences, and AWS SES deliverability radar.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--orange)] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Launch Visual Builder
          </button>
        </div>
      </div>

      {/* Hub Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === 'telemetry'
              ? 'bg-[var(--navy)] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          SES Telemetry &amp; Deliverability
        </button>

        <button
          onClick={() => setActiveTab('builder')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === 'builder'
              ? 'bg-[var(--navy)] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Layers className="h-4 w-4" />
          Puck Visual Email Builder
        </button>

        <button
          onClick={() => setActiveTab('sequences')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === 'sequences'
              ? 'bg-[var(--navy)] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Clock className="h-4 w-4" />
          Automated Drip Sequences ({sequences.length})
        </button>

        <button
          onClick={() => setActiveTab('suppressions')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === 'suppressions'
              ? 'bg-[var(--navy)] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Suppressions &amp; Reputation ({suppressions.length})
        </button>
      </div>

      {/* TAB 1: SES TELEMETRY & DELIVERABILITY RADAR */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Top KPI Cards — live from /api/email/stats (email_sends) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                <span>Total Emails Dispatched</span>
                <Send className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[var(--text)]">{stats ? stats.sent.toLocaleString() : '—'}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{stats ? `${stats.queued.toLocaleString()} queued in outbox` : 'Loading send telemetry…'}</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                <span>Delivery Success Rate</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{pct(stats?.deliveryRate)}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{stats ? `${stats.delivered.toLocaleString()} delivered` : 'No sends recorded yet'}</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                <span>Average Open Rate</span>
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-600">{pct(stats?.openRate)}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{stats ? `${stats.opened.toLocaleString()} opens tracked` : 'Opens appear after delivery webhooks'}</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                <span>SES Reputation Health</span>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{pct(stats?.bounceRate)} Bounce</p>
              <p className="mt-1 text-xs text-emerald-700 font-medium">Spam complaints: {pct(stats?.complaintRate)}</p>
            </div>
          </div>

          {/* Infrastructure Health Status — live from /api/email/config */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-[var(--text-tertiary)]">
                <span>Verified Sender Identity</span>
                <Mail className="h-4 w-4 text-[var(--accent)]" />
              </div>
              <p className="mt-2 text-base font-bold text-[var(--text)]">{sesConfig?.fromEmail ?? 'Not configured'}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {sesConfig?.configured ? (
                  <>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">SES credentials set</span>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">From identity configured</span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                    <AlertTriangle className="h-3 w-3" />
                    Missing: {(sesConfig?.missing ?? []).join(', ') || 'AWS credentials'}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-[var(--text-tertiary)]">
                <span>Sending Region</span>
                <Layers className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-base font-bold text-[var(--text)]">AWS SES {sesConfig?.region ? `(${sesConfig.region})` : ''}</p>
              <p className="mt-1 text-xs font-mono text-[var(--text-secondary)]">From name: {sesConfig?.fromName ?? '—'}</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-[var(--text-tertiary)]">
                <span>Outbox Queue Health</span>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-2 text-base font-bold text-[var(--text)]">{stats ? `${stats.queued.toLocaleString()} queued · ${stats.failed.toLocaleString()} failed` : '—'}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Drained by the worker each tick</p>
            </div>
          </div>

          {/* Active Flow Performance Matrix — real sequences + enrollment counts */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">
                  Automated Trigger Deliverability Performance
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Drip sequences joined to live flow enrollment counts from the database
                </p>
              </div>
              <button
                onClick={() => void loadSequences()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-all"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>

            <div className="divide-y divide-[var(--border)] text-xs">
              {sequences.length === 0 ? (
                <div className="p-10 text-center text-xs text-[var(--text-tertiary)]">
                  No drip sequences configured yet — the four canonical programmes appear here once the sequences API is reachable.
                </div>
              ) : (
                sequences.map((seq) => {
                  const chip = sequenceStatusChip(seq.status)
                  return (
                    <div key={seq.key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[var(--text)]">{seq.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${chip.className}`}>{chip.label}</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">Trigger: {seq.triggerLabel}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">{seq.steps.length} Automated Steps · {seq.activeCount.toLocaleString()} active enrollments</p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="block font-mono text-xs font-bold text-[var(--text)]">{seq.enrolledCount.toLocaleString()}</span>
                          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Enrolled</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-mono text-xs font-bold text-emerald-600">{pct(seq.openRate)}</span>
                          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Open Rate</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-mono text-xs font-bold text-blue-600">{pct(seq.clickRate)}</span>
                          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Click Rate</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSequenceKey(seq.key)
                            setActiveTab('sequences')
                          }}
                          className="rounded-lg border border-[var(--border)] px-3 py-1.5 font-semibold text-xs text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"
                        >
                          View Steps &rarr;
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PUCK VISUAL EMAIL BLOCK BUILDER */}
      {activeTab === 'builder' && (
        <div className="space-y-4">
          {/* Builder Top Controls Bar */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Template Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Template:</span>
              <div className="flex items-center gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => loadTemplate(t)}
                    title={t.source === 'starter' ? 'Built-in starter document' : 'Saved in the email template library'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedTemplate.id === t.id
                        ? 'bg-[var(--navy)] text-white shadow-xs'
                        : 'bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    {t.name}
                    {t.source === 'starter' && <span className="ml-1.5 text-[9px] uppercase opacity-70">starter</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Viewport & View Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg p-0.5">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md ${previewDevice === 'desktop' ? 'bg-white shadow-xs text-[var(--navy)]' : 'text-[var(--text-tertiary)]'}`}
                  title="Desktop View"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded-md ${previewDevice === 'tablet' ? 'bg-white shadow-xs text-[var(--navy)]' : 'text-[var(--text-tertiary)]'}`}
                  title="Tablet View"
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-md ${previewDevice === 'mobile' ? 'bg-white shadow-xs text-[var(--navy)]' : 'text-[var(--text-tertiary)]'}`}
                  title="Mobile View"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => setInterpolatePreview(!interpolatePreview)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  interpolatePreview
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-[var(--surface-alt)] text-[var(--text-secondary)] border-[var(--border)]'
                }`}
              >
                {interpolatePreview ? 'Variable Tokens: Sample Data' : 'Variable Tokens: Raw {{tags}}'}
              </button>

              <button
                onClick={() => setViewHtmlCode(!viewHtmlCode)}
                className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                  viewHtmlCode
                    ? 'bg-[var(--navy)] text-white border-[var(--navy)]'
                    : 'bg-[var(--surface-alt)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
                }`}
                title="View HTML Source Code"
              >
                <Code2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Dynamic Variable Tokens Toolbar */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[var(--orange)]" />
                Dynamic Variable Tokens (Click to Copy &amp; Insert)
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)]">Substituted dynamically at send time</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EMAIL_MERGE_TAGS.map((token) => (
                <button
                  key={token.tag}
                  onClick={() => copyToken(token.tag)}
                  className="group inline-flex items-center gap-1 rounded-md bg-[var(--surface-alt)] hover:bg-orange-50 border border-[var(--border)] hover:border-orange-200 px-2 py-1 text-[11px] font-mono text-[var(--text)] hover:text-[var(--orange)] transition-all"
                >
                  <span>{token.tag}</span>
                  {copiedToken === token.tag ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-[var(--text-tertiary)] group-hover:text-[var(--orange)] opacity-60" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Column Visual Builder Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Block Palette & Hierarchy */}
            <div className="lg:col-span-3 space-y-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                  Branded Email Blocks
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => addBlock('EmailHeader')}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--orange)] hover:bg-orange-50/50 text-left transition-all group"
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--orange)] block">Header</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">Logo, title, desk badge</span>
                    </div>
                    <Plus className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--orange)]" />
                  </button>

                  <button
                    onClick={() => addBlock('EmailHero')}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--orange)] hover:bg-orange-50/50 text-left transition-all group"
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--orange)] block">Hero Banner</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">Headline, tokens, CTA</span>
                    </div>
                    <Plus className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--orange)]" />
                  </button>

                  <button
                    onClick={() => addBlock('EmailColumns')}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--orange)] hover:bg-orange-50/50 text-left transition-all group"
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--orange)] block">2-Column Features</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">Side-by-side comparison</span>
                    </div>
                    <Plus className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--orange)]" />
                  </button>

                  <button
                    onClick={() => addBlock('EmailPriceTable')}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--orange)] hover:bg-orange-50/50 text-left transition-all group"
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--orange)] block">Pricing Table</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">Freezone &amp; Mainland fees</span>
                    </div>
                    <Plus className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--orange)]" />
                  </button>

                  <button
                    onClick={() => addBlock('EmailSignature')}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--orange)] hover:bg-orange-50/50 text-left transition-all group"
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--orange)] block">Advisor Signature</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">Photo, desk, WhatsApp link</span>
                    </div>
                    <Plus className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--orange)]" />
                  </button>

                  <button
                    onClick={() => addBlock('EmailCtaCard')}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--orange)] hover:bg-orange-50/50 text-left transition-all group"
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--orange)] block">CTA Card</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">High conversion callout</span>
                    </div>
                    <Plus className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--orange)]" />
                  </button>

                  <button
                    onClick={() => addBlock('EmailDisclaimer')}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--orange)] hover:bg-orange-50/50 text-left transition-all group"
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--orange)] block">Legal Disclaimer</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">DED &amp; FTA disclosure</span>
                    </div>
                    <Plus className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--orange)]" />
                  </button>

                  <button
                    onClick={() => addBlock('EmailFooter')}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] hover:border-[var(--orange)] hover:bg-orange-50/50 text-left transition-all group"
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--orange)] block">Footer &amp; Unsubscribe</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">HMAC opt-out link</span>
                    </div>
                    <Plus className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--orange)]" />
                  </button>
                </div>
              </div>

              {/* Document Outline */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                  Document Structure ({activeDoc.content.length} Blocks)
                </h3>
                <div className="space-y-1.5">
                  {activeDoc.content.map((block, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedBlockIndex(idx)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                        selectedBlockIndex === idx
                          ? 'bg-[var(--navy)] text-white font-bold'
                          : 'bg-[var(--surface-alt)] text-[var(--text)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <span className="truncate">{idx + 1}. {block.type}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeBlock(idx)
                        }}
                        className="opacity-70 hover:opacity-100 hover:text-red-400 p-1"
                        title="Remove Block"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Column: Live Puck Preview Canvas */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div
                className="w-full transition-all duration-200"
                style={{
                  maxWidth:
                    previewDevice === 'mobile'
                      ? '380px'
                      : previewDevice === 'tablet'
                      ? '540px'
                      : '640px',
                }}
              >
                {viewHtmlCode ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-slate-900 p-4 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[700px]">
                    <pre>{rendered.html}</pre>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[var(--border)] bg-white shadow-xl overflow-hidden">
                    <div
                      dangerouslySetInnerHTML={{ __html: rendered.html }}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Block Inspector & Test Send Panel */}
            <div className="lg:col-span-3 space-y-4">
              {/* Test Send Panel */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-[var(--orange)]" />
                  Amazon SES Test Dispatch
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mb-3">
                  Send a live transactional test email rendered with real token variables.
                </p>
                {sesConfig && !sesConfig.configured && (
                  <p className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-2 text-[11px] font-medium text-amber-700 flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>SES is not configured ({(sesConfig.missing ?? []).join(', ')}). Test sends will report the missing env vars instead of sending.</span>
                  </p>
                )}
                <div className="space-y-2">
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="advisor@example.com"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--orange)]"
                  />
                  <Button
                    onClick={handleSendTest}
                    disabled={sendingTest}
                    size="sm"
                    className="w-full bg-[var(--navy)] text-white hover:bg-[var(--navy)]/90"
                  >
                    {sendingTest ? 'Sending via SES...' : 'Send Live Test Email'}
                  </Button>
                </div>
              </div>

              {/* Block Inspector */}
              {selectedBlockIndex !== null && activeDoc.content[selectedBlockIndex] ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                      Edit Block: {activeDoc.content[selectedBlockIndex].type}
                    </span>
                    <button
                      onClick={() => setSelectedBlockIndex(null)}
                      className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text)]"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-3 text-xs max-h-[400px] overflow-y-auto pr-1">
                    {Object.entries(activeDoc.content[selectedBlockIndex].props || {}).map(([key, val]) => {
                      if (typeof val === 'object' && val !== null) return null
                      return (
                        <div key={key} className="space-y-1">
                          <label className="font-semibold text-[var(--text-secondary)] capitalize">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </label>
                          {typeof val === 'string' && val.length > 50 ? (
                            <textarea
                              value={val}
                              onChange={(e) => {
                                const copy = [...activeDoc.content]
                                copy[selectedBlockIndex].props[key] = e.target.value
                                setActiveDoc({ ...activeDoc, content: copy })
                              }}
                              rows={3}
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-2 text-xs text-[var(--text)] focus:ring-1 focus:ring-[var(--orange)]"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(val ?? '')}
                              onChange={(e) => {
                                const copy = [...activeDoc.content]
                                copy[selectedBlockIndex].props[key] = e.target.value
                                setActiveDoc({ ...activeDoc, content: copy })
                              }}
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:ring-1 focus:ring-[var(--orange)]"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-tertiary)]">
                  Click any block in the document structure on the left to customize its properties.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUTOMATED DRIP SEQUENCES — canonical definitions joined to real flows */}
      {activeTab === 'sequences' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sequence Selector List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Configured Drip Sequences
                </h3>
                <button
                  onClick={() => void loadSequences()}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-all"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
              </div>
              {sequences.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] p-6 text-center text-xs text-[var(--text-tertiary)]">
                  No sequences loaded — the four canonical programmes appear here when the sequences API responds.
                </div>
              ) : (
                sequences.map((seq) => {
                  const chip = sequenceStatusChip(seq.status)
                  return (
                    <div
                      key={seq.key}
                      onClick={() => setSelectedSequenceKey(seq.key)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedSequence?.key === seq.key
                          ? 'border-[var(--navy)] bg-white shadow-md'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[var(--text)]">{seq.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${chip.className}`}>{chip.label}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{seq.triggerLabel}</p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--text-tertiary)] pt-2 border-t border-[var(--border)]">
                        <span>{seq.steps.length} Automated Steps</span>
                        <span className="font-mono text-[var(--text-secondary)] font-bold">{seq.enrolledCount.toLocaleString()} Enrolled</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Sequence Step-by-Step Pipeline Inspector */}
            <div className="lg:col-span-8 space-y-4">
              {selectedSequence ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-[var(--text)]">{selectedSequence.name}</h2>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${sequenceStatusChip(selectedSequence.status).className}`}>
                          {sequenceStatusChip(selectedSequence.status).label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Trigger: <span className="font-medium text-[var(--text)]">{selectedSequence.triggerLabel}</span>
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{selectedSequence.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedSequence.status === 'unprovisioned' ? (
                        <Button size="sm" onClick={() => void handleProvisionSequence(selectedSequence.key)} disabled={provisioningKey === selectedSequence.key}>
                          <Plus className="h-4 w-4 mr-1" />
                          {provisioningKey === selectedSequence.key ? 'Provisioning…' : 'Set Up Flow'}
                        </Button>
                      ) : selectedSequence.flowId ? (
                        <Link
                          href={`/crm/flows?flow=${selectedSequence.flowId}`}
                          className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--navy)] bg-transparent px-4 py-1.5 text-xs font-bold text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Open in Flow Builder
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  {/* Steps Pipeline Visual Timeline */}
                  <div className="space-y-4 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                    {selectedSequence.steps.map((step, index) => (
                      <div key={step.id} className="relative pl-10">
                        {/* Step Badge Dot */}
                        <div className="absolute left-2 top-3 -translate-x-1/2 flex items-center justify-center h-5 w-5 rounded-full bg-[var(--navy)] text-white font-mono text-[10px] font-bold shadow-xs">
                          {index + 1}
                        </div>

                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="font-bold text-sm text-[var(--text)]">{step.title}</span>
                            <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold font-mono">
                              {step.delay}
                            </span>
                          </div>

                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Template: <span className="font-medium text-[var(--text)]">{step.template}</span>
                          </p>

                          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-[var(--border)]">
                            <span className="text-[var(--text-tertiary)]">Channel: {step.channel}</span>
                            <span className="font-mono text-[var(--text-secondary)] truncate max-w-[50%]" title={step.subject}>
                              {step.subject}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-alt)] p-10 text-center text-xs text-[var(--text-tertiary)]">
                  Select a sequence to inspect its step-by-step pipeline.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUPPRESSIONS & REPUTATION LEDGER */}
      {activeTab === 'suppressions' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={suppressionSearch}
                onChange={(e) => setSuppressionSearch(e.target.value)}
                placeholder="Search suppressed email or reason..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] pl-9 pr-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--orange)]"
              />
            </div>
            <Button size="sm" onClick={() => setShowAddSuppressionModal(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Manual Suppression
            </Button>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)] text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                  <th className="py-3 px-4">Suppressed Email</th>
                  <th className="py-3 px-4">Reason Category</th>
                  <th className="py-3 px-4">Detection Source</th>
                  <th className="py-3 px-4">Error / Event Detail</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredSuppressions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-[var(--text-tertiary)]">
                      {suppressions.length === 0
                        ? 'No suppressions recorded yet — bounces, complaints and manual blocks appear here as SES reports them.'
                        : 'No suppressions match your search filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredSuppressions.map((sup) => (
                    <tr key={sup.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-[var(--text)]">{sup.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            sup.reason === 'hard_bounce'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : sup.reason === 'complaint'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sup.reason.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-[var(--text-secondary)]">{sup.source ?? '—'}</td>
                      <td className="py-3.5 px-4 text-[11px] text-[var(--text-tertiary)] max-w-xs truncate">{sup.detail ?? '—'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveSuppression(sup.id, sup.email)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                        >
                          Remove Block
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Suppression Modal */}
          {showAddSuppressionModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
                <h3 className="text-base font-bold text-[var(--text)]">Add Email Suppression</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Add an address to the global do-not-mail list to prevent marketing and transactional dispatches.
                </p>

                <form onSubmit={handleAddSuppression} className="space-y-4 mt-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text)]">Email Address</label>
                    <input
                      type="email"
                      required
                      value={newSuppressionEmail}
                      onChange={(e) => setNewSuppressionEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-xs text-[var(--text)] focus:ring-1 focus:ring-[var(--orange)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text)]">Reason</label>
                    <select
                      value={newSuppressionReason}
                      onChange={(e) => setNewSuppressionReason(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-xs text-[var(--text)] focus:ring-1 focus:ring-[var(--orange)]"
                    >
                      <option value="manual">Manual Administrator Block</option>
                      <option value="hard_bounce">Hard Bounce (Invalid Mailbox)</option>
                      <option value="complaint">Spam Complaint / Unsubscribe Request</option>
                      <option value="invalid">Invalid Domain Syntax</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddSuppressionModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="bg-[var(--navy)] text-white">
                      Confirm Suppression
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
