'use client'

import React, { useEffect, useState, type FormEvent } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  AtSign,
  Building,
  Building2,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Clock,
  Clock3,
  Copy,
  ExternalLink,
  FileCheck,
  FileText,
  Layers,
  Mail,
  MailCheck,
  MapPin,
  MessageSquare,
  MessageSquareText,
  Paperclip,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  Plus,
  RefreshCw,
  Save,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserCheck,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
import type { DirectusUserSummary } from '@/lib/directus'
import { useToast } from '@/components/ui/ToastProvider'
import { calculateLeadScore, resolveDeskTag, resolveEstimatedDealValue } from '@/lib/crm/scoring'
import {
  crmFetch,
  formatMoney,
  formatShortDate,
  getDaysRemaining,
  isOverdue,
  resolveUrgency,
  userId,
  userLabel,
  type CRMLead,
  type CRMTask,
  type CRMNote,
  type CRMActivity,
  type LeadDetailPayload,
  type LeadStatus,
  type DeskTag,
  type TaxRegime,
  type KycStatus,
} from './types'
import { PIPELINE_STAGES } from './PipelineBoard'

const TAX_REGIMES: TaxRegime[] = [
  '0% QFZP Qualified',
  '9% Standard UAE CT',
  '15% Pillar Two',
  '20% KSA Income Tax',
  'VAT Registered (5%/15%)',
  'Tax Exempt Holding',
  'Standard Corporate Tax',
]

const KYC_STATUSES: KycStatus[] = ['pending', 'sent', 'received', 'under_review', 'approved', 'rejected']
const DESK_TAGS: DeskTag[] = ['Dubai Desk', 'Riyadh Desk', 'APAC Desk', 'London Desk', 'Global Desk']
const ACTIVITY_FILTERS = ['all', 'whatsapp', 'email', 'note', 'call', 'stage', 'system'] as const

type ComposerTab = 'note' | 'whatsapp' | 'email' | 'call' | 'task'

export function LeadDrawer({
  leadId,
  open = true,
  initialTab = 'note',
  users = [],
  onClose,
  onLeadUpdated = () => {},
  onTasksChanged = () => {},
}: {
  leadId?: string | null
  open?: boolean
  initialTab?: string
  users?: DirectusUserSummary[]
  onClose: () => void
  onLeadUpdated?: (lead: CRMLead) => void
  onTasksChanged?: () => void
}) {
  if (!open || !leadId) return null

  const toast = useToast()
  const [data, setData] = useState<LeadDetailPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Composer Active Tab
  const [activeTab, setActiveTab] = useState<ComposerTab>(
    initialTab === 'whatsapp' ? 'whatsapp' : initialTab === 'email' ? 'email' : initialTab === 'task' ? 'task' : 'note'
  )
  const [activityFilter, setActivityFilter] = useState<(typeof ACTIVITY_FILTERS)[number]>('all')

  // Editable Properties Form
  const [form, setForm] = useState({
    status: 'new' as LeadStatus,
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    assigned_to: '',
    desk: 'Dubai Desk' as DeskTag,
    jurisdiction: 'UAE · IFZA',
    entity_type: 'Freezone LLC',
    tax_regime: '0% QFZP Qualified' as TaxRegime,
    kyc_status: 'pending' as KycStatus,
    deal_value: '5800',
    currency: 'USD',
    company_name_choice_1: '',
    company_name_choice_2: '',
    trade_license_number: '',
    trade_license_expiry: '',
    visa_eid_expiry: '',
    tax_filing_deadline: '',
    vat_deadline: '',
    annual_retainer_fee: '8500',
    next_follow_up_at: '',
    notes: '',
    lost_reason: '',
  })

  // Composer States
  const [noteContent, setNoteContent] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const [whatsappBody, setWhatsappBody] = useState('')
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false)

  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailTemplateId, setEmailTemplateId] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [templates, setTemplates] = useState<Array<{ id: string; name?: string | null }>>([])

  const [callSubject, setCallSubject] = useState('')
  const [callOutcome, setCallOutcome] = useState<'connected' | 'left_voicemail' | 'busy' | 'scheduled_followup'>('connected')
  const [callDuration, setCallDuration] = useState('5')
  const [callNotes, setCallNotes] = useState('')
  const [loggingCall, setLoggingCall] = useState(false)

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [taskPriority, setTaskPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [addingTask, setAddingTask] = useState(false)
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)

  // Official Document Attachment
  const [docName, setDocName] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [docCategory, setDocCategory] = useState<'trade_license' | 'moa' | 'passport_kyc' | 'bank_statement' | 'tax_cert' | 'other'>('trade_license')
  const [attachingDoc, setAttachingDoc] = useState(false)

  // Actions in Flight
  const [sendingKyc, setSendingKyc] = useState(false)
  const [renewingLicense, setRenewingLicense] = useState(false)

  async function loadDetails() {
    setLoading(true)
    setError('')
    try {
      const result = await crmFetch<LeadDetailPayload>(`/api/crm/leads/${leadId}`)
      setData(result)
      const l = result.lead
      setForm({
        status: (l.status as LeadStatus) || 'new',
        priority: l.priority || 'normal',
        assigned_to: userId(l.assigned_to) || l.owner_id || '',
        desk: (l.desk as DeskTag) || resolveDeskTag(l),
        jurisdiction: l.jurisdiction || 'UAE · IFZA',
        entity_type: l.entity_type || 'Freezone LLC',
        tax_regime: (l.tax_regime as TaxRegime) || '0% QFZP Qualified',
        kyc_status: (l.kyc_status as KycStatus) || 'pending',
        deal_value: String(l.deal_value || l.estimated_value || 5800),
        currency: l.currency || 'USD',
        company_name_choice_1: l.company_name_choice_1 || l.company || '',
        company_name_choice_2: l.company_name_choice_2 || '',
        trade_license_number: l.trade_license_number || '',
        trade_license_expiry: l.trade_license_expiry ? String(l.trade_license_expiry).slice(0, 10) : '',
        visa_eid_expiry: l.visa_eid_expiry ? String(l.visa_eid_expiry).slice(0, 10) : '',
        tax_filing_deadline: l.tax_filing_deadline ? String(l.tax_filing_deadline).slice(0, 10) : '',
        vat_deadline: l.vat_deadline ? String(l.vat_deadline).slice(0, 10) : '',
        annual_retainer_fee: String(l.annual_retainer_fee || 8500),
        next_follow_up_at: l.next_follow_up_at ? String(l.next_follow_up_at).slice(0, 16) : '',
        notes: l.notes || '',
        lost_reason: l.lost_reason || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load lead 360 record')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDetails()
  }, [leadId])

  useEffect(() => {
    fetch('/api/admin/email/templates?page=1&page_size=50')
      .then(async (res) => {
        if (!res.ok) return
        const d = (await res.json()) as { templates?: Array<{ id: string; name?: string | null }> }
        setTemplates((d.templates ?? []).filter((t) => t.id))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Save Properties
  async function handleSaveProperties() {
    setSaving(true)
    try {
      const result = await crmFetch<{ data?: CRMLead; lead?: CRMLead }>(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status,
          priority: form.priority,
          assigned_to: form.assigned_to || null,
          desk: form.desk,
          jurisdiction: form.jurisdiction,
          entity_type: form.entity_type,
          tax_regime: form.tax_regime,
          kyc_status: form.kyc_status,
          deal_value: Number(form.deal_value) || 5800,
          estimated_value: Number(form.deal_value) || 5800,
          currency: form.currency,
          company_name_choice_1: form.company_name_choice_1 || null,
          company_name_choice_2: form.company_name_choice_2 || null,
          company: form.company_name_choice_1 || null,
          trade_license_number: form.trade_license_number || null,
          trade_license_expiry: form.trade_license_expiry || null,
          visa_eid_expiry: form.visa_eid_expiry || null,
          tax_filing_deadline: form.tax_filing_deadline || null,
          vat_deadline: form.vat_deadline || null,
          annual_retainer_fee: Number(form.annual_retainer_fee) || 8500,
          next_follow_up_at: form.next_follow_up_at ? new Date(form.next_follow_up_at).toISOString() : null,
          notes: form.notes || null,
          lost_reason: form.lost_reason || null,
        }),
      })

      const updated = result.data || result.lead
      if (updated) {
        setData((prev) => (prev ? { ...prev, lead: updated } : prev))
        onLeadUpdated(updated)
      }
      toast.success('Lead properties & compliance profile saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save properties')
    } finally {
      setSaving(false)
    }
  }

  // Submit Note
  async function handleAddNote(e: FormEvent) {
    e.preventDefault()
    if (!noteContent.trim()) return
    setSavingNote(true)
    try {
      await crmFetch(`/api/crm/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'note',
          title: 'Internal Note Added',
          description: noteContent.trim(),
        }),
      })
      setNoteContent('')
      toast.success('Note logged to activity timeline.')
      await loadDetails()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add note')
    } finally {
      setSavingNote(false)
    }
  }

  // Send WhatsApp Message
  async function handleSendWhatsApp(e: FormEvent) {
    e.preventDefault()
    if (!whatsappBody.trim() || !data?.lead.phone) {
      toast.error('Recipient phone and message body required.')
      return
    }
    setSendingWhatsapp(true)
    try {
      await crmFetch(`/api/crm/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: leadId,
          to: data.lead.phone,
          message: whatsappBody.trim(),
        }),
      })
      setWhatsappBody('')
      toast.success('WhatsApp message dispatched via Meta Cloud API.')
      await loadDetails()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'WhatsApp dispatch failed')
    } finally {
      setSendingWhatsapp(false)
    }
  }

  // Send Quick SES Email
  async function handleSendEmail(e: FormEvent) {
    e.preventDefault()
    if (!emailTemplateId && !emailBody.trim()) {
      toast.error('Choose a template or enter an email body.')
      return
    }
    setSendingEmail(true)
    try {
      await crmFetch(`/api/crm/leads/${leadId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: emailTemplateId || null,
          subject: emailSubject || 'Update regarding your GCC Incorporation File',
          body: emailBody || null,
        }),
      })
      setEmailSubject('')
      setEmailBody('')
      setEmailTemplateId('')
      toast.success('Email dispatched via Amazon SES.')
      await loadDetails()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Email dispatch failed')
    } finally {
      setSendingEmail(false)
    }
  }

  // Log Call
  async function handleLogCall(e: FormEvent) {
    e.preventDefault()
    setLoggingCall(true)
    try {
      await crmFetch(`/api/crm/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'call',
          title: `Call (${(callOutcome || 'connected').replace(/_/g, ' ')}) — ${callSubject || 'Client Outreach'}`,
          description: `Duration: ${callDuration} min\n${callNotes}`,
        }),
      })
      setCallSubject('')
      setCallNotes('')
      toast.success('Call logged to timeline.')
      await loadDetails()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log call')
    } finally {
      setLoggingCall(false)
    }
  }

  // Add Task
  async function handleAddTask(e: FormEvent) {
    e.preventDefault()
    if (!taskTitle.trim()) return
    setAddingTask(true)
    try {
      await crmFetch(`/api/crm/leads/${leadId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          due_at: taskDue ? new Date(taskDue).toISOString() : null,
          priority: taskPriority,
          assigned_to: form.assigned_to || null,
        }),
      })
      setTaskTitle('')
      setTaskDue('')
      toast.success('Task scheduled.')
      await loadDetails()
      onTasksChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add task')
    } finally {
      setAddingTask(false)
    }
  }

  // Complete Task
  async function handleCompleteTask(taskId: string) {
    setBusyTaskId(taskId)
    try {
      await crmFetch(`/api/crm/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      toast.success('Task marked completed.')
      await loadDetails()
      onTasksChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete task')
    } finally {
      setBusyTaskId(null)
    }
  }

  // Attach Document
  async function handleAttachDoc(e: FormEvent) {
    e.preventDefault()
    if (!docName.trim() || !docUrl.trim()) return
    setAttachingDoc(true)
    try {
      const currentDocs = data?.lead.official_documents || []
      const updated = [
        ...currentDocs,
        {
          name: docName.trim(),
          url: docUrl.trim(),
          category: docCategory,
          date_uploaded: new Date().toISOString(),
        },
      ]
      await crmFetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ official_documents: updated }),
      })
      setDocName('')
      setDocUrl('')
      toast.success('Official corporate document attached.')
      await loadDetails()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to attach document')
    } finally {
      setAttachingDoc(false)
    }
  }

  // Trigger Manual KYC Pack
  async function handleDispatchKyc() {
    setSendingKyc(true)
    try {
      await crmFetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'kyc_processing', kyc_status: 'sent' }),
      })
      toast.success('Standard KYC onboarding pack dispatched over WhatsApp & SES!')
      await loadDetails()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to dispatch KYC pack')
    } finally {
      setSendingKyc(false)
    }
  }

  // 1-Click Extend License (+1 Year)
  async function handleRenewLicense() {
    setRenewingLicense(true)
    try {
      await crmFetch(`/api/crm/renewals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'renew_license',
          contactId: leadId,
        }),
      })
      toast.success('Annual trade license renewed for +1 year.')
      await loadDetails()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to renew license')
    } finally {
      setRenewingLicense(false)
    }
  }

  const scoreInfo = data?.lead ? calculateLeadScore(data.lead) : { score: 75, tier: 'High' }
  const desk = data?.lead ? resolveDeskTag(data.lead) : 'Dubai Desk'
  const dealVal = data?.lead ? resolveEstimatedDealValue(data.lead) : { value: 5800, currency: 'USD' }

  const daysRemaining = getDaysRemaining(form.trade_license_expiry)
  const urgency = resolveUrgency(daysRemaining)

  // Timeline compilation
  const timeline = data
    ? [
        ...(data.activities || []).map((a) => ({
          id: `act-${a.id}`,
          kind: a.type || 'note',
          title: a.subject || `${a.type.toUpperCase()} Activity`,
          detail: a.notes,
          date: a.occurred_at || a.created_at,
          actor: a.logged_by || 'Staff Case Officer',
          direction: a.direction,
        })),
        ...(data.messages || []).map((m) => ({
          id: `msg-${m.id}`,
          kind: 'whatsapp',
          title: m.direction === 'inbound' ? 'Inbound WhatsApp' : 'Outbound WhatsApp',
          detail: m.body,
          date: m.occurred_at,
          actor: m.direction === 'inbound' ? data.lead.name || 'Client' : 'Case Officer',
          direction: m.direction,
          status: m.status,
        })),
        ...(data.emailEvents || []).map((e) => ({
          id: `email-${e.id}`,
          kind: 'email',
          title: `SES Email: ${e.subject || 'Transactional Notice'}`,
          detail: `Status: ${e.status.toUpperCase()} to ${e.to_email}`,
          date: e.sent_at || e.created_at,
          actor: 'Amazon SES Engine',
          direction: 'outbound',
        })),
      ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    : []

  const filteredTimeline = timeline.filter((item) => {
    if (activityFilter === 'all') return true
    if (activityFilter === 'whatsapp') return item.kind === 'whatsapp'
    if (activityFilter === 'email') return item.kind === 'email'
    if (activityFilter === 'note') return item.kind === 'note'
    if (activityFilter === 'call') return item.kind === 'call'
    return true
  })

  const openTasks = data?.tasks?.filter((t) => t.status !== 'completed' && !t.completed_at) || []

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0A142F]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* HubSpot 3-Column 360° Drawer Modal */}
      <aside
        className="relative w-full max-w-[1340px] bg-slate-50 border-l border-slate-200 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300 select-none"
        role="dialog"
        aria-modal="true"
        aria-label="Lead 360 Command Center"
      >
        {/* Top Header Command Bar */}
        <header className="px-6 py-4 bg-[#0A142F] text-white border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-white font-black text-sm shrink-0">
              <Building2 className="h-5 w-5 text-blue-400" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-white truncate">
                  {data?.lead.name || (loading ? 'Loading Record...' : 'Unnamed Prospect')}
                </h2>

                <span className="rounded-md bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={10} /> {scoreInfo.tier} {scoreInfo.score}/100
                </span>

                <span className="rounded-md bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 text-[10px] font-bold text-blue-300 flex items-center gap-1">
                  <MapPin size={10} /> {desk}
                </span>

                {data?.lead.order_number && (
                  <span className="text-[11px] font-mono text-slate-400">
                    {data.lead.order_number}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5 truncate">
                {data?.lead.company_name_choice_1 && (
                  <span className="font-semibold text-white truncate">
                    {data.lead.company_name_choice_1}
                  </span>
                )}
                {data?.lead.email && (
                  <a
                    href={`mailto:${data.lead.email}`}
                    className="flex items-center gap-1 hover:text-blue-300 text-slate-400 transition-colors"
                  >
                    <Mail size={12} /> {data.lead.email}
                  </a>
                )}
                {data?.lead.phone && (
                  <a
                    href={`tel:${data.lead.phone}`}
                    className="flex items-center gap-1 hover:text-emerald-300 text-slate-400 transition-colors"
                  >
                    <Phone size={12} /> {data.lead.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Top Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-xs"
              onClick={() => setActiveTab('whatsapp')}
            >
              <MessageSquare size={13} />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-xs"
              onClick={() => setActiveTab('email')}
            >
              <Mail size={13} />
              <span>Email</span>
            </button>

            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-600 transition-all"
              onClick={() => setActiveTab('call')}
            >
              <PhoneCall size={13} />
              <span>Log Call</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveProperties}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--orange)] px-4 py-1.5 text-xs font-black text-white hover:opacity-95 transition-all shadow-xs disabled:opacity-50"
            >
              <Save size={13} />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Close drawer"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-sm font-semibold">Loading HubSpot-style Lead 360 record...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
            <h3 className="text-base font-bold text-slate-800">Record Not Available</h3>
            <p className="text-sm text-slate-500 max-w-md mt-1">{error}</p>
            <button
              onClick={() => void loadDetails()}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && data && (
          <div className="flex-1 overflow-hidden grid grid-cols-12 divide-x divide-slate-200">
            {/* COLUMN 1: LEFT SIDEBAR (Properties & Compliance - 30% / 3.5 cols) */}
            <div className="col-span-3.5 p-4 overflow-y-auto space-y-4 bg-white">
              {/* Pipeline Stage Selector Pill Bar */}
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Pipeline Stage
                </span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#0A142F] focus:ring-2 focus:ring-blue-500 outline-hidden"
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.cue})
                    </option>
                  ))}
                </select>
              </div>

              {/* Deal & Financial Valuation */}
              <div className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 flex items-center gap-1.5">
                    <CircleDollarSign size={14} className="text-emerald-600" />
                    Deal Financials
                  </span>
                  <span className="font-mono font-black text-xs text-emerald-700">
                    {formatMoney(Number(form.deal_value) || 5800, form.currency)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Deal Value
                    </label>
                    <input
                      type="number"
                      value={form.deal_value}
                      onChange={(e) => setForm({ ...form, deal_value: e.target.value })}
                      className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Currency
                    </label>
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs font-bold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="AED">AED (د.إ)</option>
                      <option value="SAR">SAR (ر.س)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                    Assigned Desk
                  </label>
                  <select
                    value={form.desk}
                    onChange={(e) => setForm({ ...form, desk: e.target.value as DeskTag })}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs font-bold"
                  >
                    {DESK_TAGS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                    Account Officer / Owner
                  </label>
                  <select
                    value={form.assigned_to}
                    onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {userLabel(u)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Corporate & Jurisdiction Details */}
              <div className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Building size={14} className="text-blue-600" />
                  Corporate Structure
                </span>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                    Proposed Company Name 1 (Primary)
                  </label>
                  <input
                    type="text"
                    value={form.company_name_choice_1}
                    onChange={(e) => setForm({ ...form, company_name_choice_1: e.target.value })}
                    placeholder="e.g. Apex Global Technologies FZ-LLC"
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs font-bold text-[#0A142F]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                    Proposed Company Name 2 (Alternative)
                  </label>
                  <input
                    type="text"
                    value={form.company_name_choice_2}
                    onChange={(e) => setForm({ ...form, company_name_choice_2: e.target.value })}
                    placeholder="e.g. Apex Innovations Holdings Limited"
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Jurisdiction
                    </label>
                    <input
                      type="text"
                      value={form.jurisdiction}
                      onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })}
                      placeholder="e.g. UAE · IFZA"
                      className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Entity Type
                    </label>
                    <input
                      type="text"
                      value={form.entity_type}
                      onChange={(e) => setForm({ ...form, entity_type: e.target.value })}
                      placeholder="e.g. Freezone LLC"
                      className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Tax & Compliance Regime */}
              <div className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <ShieldCheck size={14} className="text-purple-600" />
                  Tax & KYC Governance
                </span>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                    Corporate Tax Regime
                  </label>
                  <select
                    value={form.tax_regime}
                    onChange={(e) => setForm({ ...form, tax_regime: e.target.value as TaxRegime })}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs font-bold text-purple-900 bg-purple-50/50"
                  >
                    {TAX_REGIMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold text-slate-500">
                      KYC / Due Diligence Status
                    </label>
                    <button
                      type="button"
                      disabled={sendingKyc}
                      onClick={handleDispatchKyc}
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Send size={10} /> Dispatch Pack
                    </button>
                  </div>
                  <select
                    value={form.kyc_status}
                    onChange={(e) => setForm({ ...form, kyc_status: e.target.value as KycStatus })}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs font-bold uppercase"
                  >
                    {KYC_STATUSES.map((k) => (
                      <option key={k} value={k}>
                        {k.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                    Next Follow-up Reminder
                  </label>
                  <input
                    type="datetime-local"
                    value={form.next_follow_up_at}
                    onChange={(e) => setForm({ ...form, next_follow_up_at: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* COLUMN 2: CENTER (Unified Activity Timeline & Action Composers - 45% / 5.5 cols) */}
            <div className="col-span-5.5 flex flex-col bg-slate-50 overflow-hidden">
              {/* Quick Action Composer Header */}
              <div className="p-3 bg-white border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    className={`flex-1 py-1 px-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'note'
                        ? 'bg-white text-[#0A142F] shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                    onClick={() => setActiveTab('note')}
                  >
                    <FileText size={13} />
                    <span>Note</span>
                  </button>

                  <button
                    type="button"
                    className={`flex-1 py-1 px-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'whatsapp'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-emerald-700'
                    }`}
                    onClick={() => setActiveTab('whatsapp')}
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    className={`flex-1 py-1 px-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'email'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-blue-700'
                    }`}
                    onClick={() => setActiveTab('email')}
                  >
                    <Mail size={13} />
                    <span>Email</span>
                  </button>

                  <button
                    type="button"
                    className={`flex-1 py-1 px-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'call'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-purple-700'
                    }`}
                    onClick={() => setActiveTab('call')}
                  >
                    <PhoneCall size={13} />
                    <span>Call</span>
                  </button>

                  <button
                    type="button"
                    className={`flex-1 py-1 px-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'task'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-amber-700'
                    }`}
                    onClick={() => setActiveTab('task')}
                  >
                    <ClipboardCheck size={13} />
                    <span>Task</span>
                  </button>
                </div>

                {/* Composer Form Bodies */}
                <div className="mt-3">
                  {/* Note Composer */}
                  {activeTab === 'note' && (
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <textarea
                        rows={3}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Log internal note or formation context..."
                        className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={savingNote || !noteContent.trim()}
                          className="rounded-lg bg-[#0A142F] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          {savingNote ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* WhatsApp Composer */}
                  {activeTab === 'whatsapp' && (
                    <form onSubmit={handleSendWhatsApp} className="space-y-2">
                      <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <span>Dispatch to:</span>
                        <strong className="text-emerald-700">{data.lead.phone || 'No phone on file'}</strong>
                      </div>
                      <textarea
                        rows={3}
                        value={whatsappBody}
                        onChange={(e) => setWhatsappBody(e.target.value)}
                        placeholder="Type personalized WhatsApp message or template text..."
                        className="w-full rounded-lg border border-emerald-200 bg-emerald-50/30 p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400">Meta Cloud API Connected</span>
                        <button
                          type="submit"
                          disabled={sendingWhatsapp || !whatsappBody.trim()}
                          className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Send size={11} /> {sendingWhatsapp ? 'Dispatching...' : 'Send WhatsApp'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Email Composer */}
                  {activeTab === 'email' && (
                    <form onSubmit={handleSendEmail} className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={emailTemplateId}
                          onChange={(e) => setEmailTemplateId(e.target.value)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                        >
                          <option value="">Choose SES Template...</option>
                          {templates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name || t.id}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Subject line override..."
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Optional custom message body..."
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={sendingEmail}
                          className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Send size={11} /> {sendingEmail ? 'Sending...' : 'Send SES Email'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Call Logger */}
                  {activeTab === 'call' && (
                    <form onSubmit={handleLogCall} className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Call topic..."
                          value={callSubject}
                          onChange={(e) => setCallSubject(e.target.value)}
                          className="col-span-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
                        />
                        <select
                          value={callOutcome}
                          onChange={(e) => setCallOutcome(e.target.value as any)}
                          className="col-span-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
                        >
                          <option value="connected">Connected</option>
                          <option value="left_voicemail">Left Voicemail</option>
                          <option value="busy">Line Busy</option>
                          <option value="scheduled_followup">Follow-up Scheduled</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Mins"
                          value={callDuration}
                          onChange={(e) => setCallDuration(e.target.value)}
                          className="col-span-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        placeholder="Call notes and outcome..."
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={loggingCall}
                          className="rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
                        >
                          {loggingCall ? 'Logging...' : 'Log Call'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Task Creator */}
                  {activeTab === 'task' && (
                    <form onSubmit={handleAddTask} className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="Task title (e.g. Follow up on Emirates ID biometrics)..."
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="datetime-local"
                          value={taskDue}
                          onChange={(e) => setTaskDue(e.target.value)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                        />
                        <select
                          value={taskPriority}
                          onChange={(e) => setTaskPriority(e.target.value as any)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold"
                        >
                          <option value="normal">Normal Priority</option>
                          <option value="high">High Priority</option>
                          <option value="urgent">Urgent</option>
                          <option value="low">Low Priority</option>
                        </select>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={addingTask}
                          className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
                        >
                          {addingTask ? 'Creating...' : 'Create Task'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Timeline Filter Bar */}
              <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
                <span className="font-bold text-slate-600 uppercase tracking-wide text-[10px]">
                  Activity Stream ({timeline.length})
                </span>

                <div className="flex items-center gap-1">
                  {ACTIVITY_FILTERS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all ${
                        activityFilter === f
                          ? 'bg-[#0A142F] text-white'
                          : 'bg-white text-slate-500 hover:bg-slate-200'
                      }`}
                      onClick={() => setActivityFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Unified Chronological Activity Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {filteredTimeline.map((item) => {
                  const isWa = item.kind === 'whatsapp'
                  const isEmail = item.kind === 'email'
                  const isCall = item.kind === 'call'
                  const isNote = item.kind === 'note'

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-3 bg-white shadow-2xs space-y-1.5 transition-all ${
                        isWa
                          ? 'border-emerald-200 bg-emerald-50/10'
                          : isEmail
                          ? 'border-blue-200 bg-blue-50/10'
                          : isCall
                          ? 'border-purple-200'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs ${
                              isWa
                                ? 'bg-emerald-100 text-emerald-700'
                                : isEmail
                                ? 'bg-blue-100 text-blue-700'
                                : isCall
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isWa ? (
                              <MessageSquare size={12} />
                            ) : isEmail ? (
                              <Mail size={12} />
                            ) : isCall ? (
                              <PhoneCall size={12} />
                            ) : (
                              <FileText size={12} />
                            )}
                          </div>

                          <strong className="text-xs font-bold text-[#0A142F] leading-none">
                            {item.title}
                          </strong>
                        </div>

                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatShortDate(item.date, true)}
                        </span>
                      </div>

                      {item.detail && (
                        <p className="text-xs text-slate-600 pl-8 whitespace-pre-wrap leading-relaxed">
                          {item.detail}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[9px] text-slate-400 pl-8 pt-1 border-t border-slate-50">
                        <span>Logged by: {item.actor}</span>
                        {(item as any).status && <span className="uppercase font-bold">{(item as any).status}</span>}
                      </div>
                    </div>
                  )
                })}

                {filteredTimeline.length === 0 && (
                  <div className="flex h-36 flex-col items-center justify-center text-center text-slate-400 text-xs">
                    <Clock size={20} className="mb-1 text-slate-300" />
                    <span>No activities recorded yet under this filter.</span>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 3: RIGHT SIDEBAR (Linked Records, Tasks, Docs & Compliance - 25% / 3 cols) */}
            <div className="col-span-3 p-4 overflow-y-auto space-y-4 bg-white">
              {/* Annual Renewal & Compliance Ledger Widget */}
              <div
                className={`rounded-xl border p-3.5 space-y-2.5 transition-all ${
                  urgency === 'critical' || urgency === 'expired'
                    ? 'border-red-300 bg-red-50/40 ring-2 ring-red-500/20'
                    : urgency === 'warning'
                    ? 'border-amber-300 bg-amber-50/40'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CalendarClock size={14} className="text-blue-600" />
                    Renewal Ledger
                  </span>

                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                      urgency === 'critical' || urgency === 'expired'
                        ? 'bg-red-600 text-white'
                        : urgency === 'warning'
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} Days Left`}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Trade License:</span>
                    <strong className="text-slate-800">{form.trade_license_expiry || 'Not set'}</strong>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Visa / EID Expiry:</span>
                    <strong className="text-slate-800">{form.visa_eid_expiry || 'Not set'}</strong>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Corporate Tax Filing:</span>
                    <strong className="text-slate-800">{form.tax_filing_deadline || 'Not set'}</strong>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Retainer Fee:</span>
                    <strong className="text-emerald-700 font-mono">
                      {formatMoney(Number(form.annual_retainer_fee) || 8500, 'AED')}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={renewingLicense}
                    onClick={handleRenewLicense}
                    className="flex-1 rounded-lg bg-[#0A142F] py-1.5 text-[10px] font-bold text-white hover:bg-slate-800 transition-all text-center"
                  >
                    {renewingLicense ? 'Renewing...' : 'Extend +1 Year'}
                  </button>
                </div>
              </div>

              {/* Pending Tasks Checklist */}
              <div className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                    <ClipboardCheck size={14} className="text-amber-600" />
                    Tasks & Reminders
                  </span>
                  <span className="flex h-5 min-w-[18px] items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-bold text-amber-800">
                    {openTasks.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {openTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-start gap-2 p-2 rounded-lg border text-xs transition-all ${
                        isOverdue(t.due_at)
                          ? 'border-red-300 bg-red-50/30'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        disabled={busyTaskId === t.id}
                        onClick={() => handleCompleteTask(t.id)}
                        className="h-4 w-4 rounded border border-slate-300 bg-white hover:bg-emerald-50 hover:border-emerald-600 text-transparent hover:text-emerald-600 flex items-center justify-center mt-0.5 shrink-0"
                      >
                        <Check size={10} />
                      </button>

                      <div className="flex-1 min-w-0">
                        <strong className="block text-slate-800 leading-snug truncate">
                          {t.title}
                        </strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Due: {formatShortDate(t.due_at, false)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {openTasks.length === 0 && (
                    <div className="text-center py-3 text-slate-400 text-xs">
                      No pending tasks for this client.
                    </div>
                  )}
                </div>
              </div>

              {/* Associated Documents */}
              <div className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                    <Paperclip size={14} className="text-blue-600" />
                    Associated Documents
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {(data.lead.official_documents?.length || 0) + (data.lead.preliminary_documents?.length || 0)}
                  </span>
                </div>

                {/* Document Links */}
                <div className="space-y-1.5">
                  {Array.isArray(data.lead.official_documents) &&
                    data.lead.official_documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-blue-50 text-xs transition-colors group"
                      >
                        <span className="font-semibold text-slate-700 group-hover:text-blue-700 truncate pr-2">
                          {doc.name}
                        </span>
                        <ExternalLink size={11} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                      </a>
                    ))}

                  {Array.isArray(data.lead.preliminary_documents) &&
                    data.lead.preliminary_documents.map((doc, idx) => (
                      <a
                        key={`prelim-${idx}`}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-emerald-50 text-xs transition-colors group"
                      >
                        <span className="font-semibold text-slate-700 group-hover:text-emerald-700 truncate pr-2">
                          {doc.name || `Quiz Doc ${idx + 1}`}
                        </span>
                        <ExternalLink size={11} className="text-slate-400 group-hover:text-emerald-600 shrink-0" />
                      </a>
                    ))}

                  {(!data.lead.official_documents || data.lead.official_documents.length === 0) &&
                    (!data.lead.preliminary_documents || data.lead.preliminary_documents.length === 0) && (
                      <div className="text-center py-2 text-[11px] text-slate-400">
                        No official documents attached yet.
                      </div>
                    )}
                </div>

                {/* Attach Document Form */}
                <form onSubmit={handleAttachDoc} className="pt-2 border-t border-slate-100 space-y-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Document Title (e.g. Trade License)"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-[11px]"
                  />
                  <input
                    type="url"
                    required
                    placeholder="Download URL / R2 Link"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-[11px]"
                  />
                  <button
                    type="submit"
                    disabled={attachingDoc}
                    className="w-full rounded-md bg-slate-100 hover:bg-slate-200 py-1 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1"
                  >
                    <UploadCloud size={12} />
                    <span>{attachingDoc ? 'Attaching...' : 'Attach Document'}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
