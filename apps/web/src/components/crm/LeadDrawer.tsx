'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  Activity,
  AtSign,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Mail,
  MessageSquareText,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import type { DirectusUserSummary, LeadPriority, LeadStatus } from '@/lib/directus'
import { useToast } from '@/components/ui/ToastProvider'
import {
  crmFetch,
  formatShortDate,
  isOverdue,
  type CRMLead,
  type CRMTask,
  type LeadDetailPayload,
  userId,
  userLabel,
} from './types'

import { Building, Copy, ExternalLink, FileCheck, FileText, Send, Sparkles, UploadCloud, Zap, MailCheck } from 'lucide-react'
import { calculateLeadScore } from '@/lib/crm/scoring'
import { WhatsAppThreadPanel } from './WhatsAppThreadPanel'

const STATUSES: LeadStatus[] = [
  'new',
  'paid_application',
  'kyc_processing',
  'kyc_received',
  'applied',
  'registered',
  'banking_filed',
  'closed',
  'won',
  'lost',
]
const PRIORITIES: LeadPriority[] = ['low', 'normal', 'high', 'urgent']
const ACTIVITY_TYPES = ['note', 'call', 'email', 'meeting', 'whatsapp'] as const
const KYC_STATUS_OPTIONS = ['pending', 'sent', 'received', 'approved', 'rejected'] as const

type LeadForm = {
  status: LeadStatus
  priority: LeadPriority
  assigned_to: string
  next_follow_up_at: string
  estimated_value: string
  lost_reason: string
  notes: string
  company_name_choice_1: string
  company_name_choice_2: string
  kyc_status: string
  incorporation_date: string
  annual_renewal_date: string
  tax_filing_deadline: string
}

function toLocalInput(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toDateInput(value?: string | null) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function makeForm(lead: CRMLead): LeadForm {
  return {
    status: lead.status || 'new',
    priority: lead.priority || 'normal',
    assigned_to: userId(lead.assigned_to),
    next_follow_up_at: toLocalInput(lead.next_follow_up_at),
    estimated_value: lead.estimated_value === null || lead.estimated_value === undefined ? '' : String(lead.estimated_value),
    lost_reason: lead.lost_reason || '',
    notes: lead.notes || '',
    company_name_choice_1: lead.company_name_choice_1 || '',
    company_name_choice_2: lead.company_name_choice_2 || '',
    kyc_status: lead.kyc_status || 'pending',
    incorporation_date: toDateInput(lead.incorporation_date),
    annual_renewal_date: toDateInput(lead.annual_renewal_date),
    tax_filing_deadline: toDateInput(lead.tax_filing_deadline),
  }
}

export function LeadDrawer({
  leadId,
  open = true,
  users = [],
  onClose,
  onLeadUpdated = () => {},
  onTasksChanged = () => {},
}: {
  leadId?: string | null
  open?: boolean
  users?: DirectusUserSummary[]
  onClose: () => void
  onLeadUpdated?: (lead: CRMLead) => void
  onTasksChanged?: () => void
}) {
  if (open === false || !leadId) return null
  const [data, setData] = useState<LeadDetailPayload | null>(null)
  const [form, setForm] = useState<LeadForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [activityType, setActivityType] = useState<(typeof ACTIVITY_TYPES)[number]>('note')
  const [activityTitle, setActivityTitle] = useState('')
  const [activityDescription, setActivityDescription] = useState('')
  const [addingActivity, setAddingActivity] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [taskPriority, setTaskPriority] = useState<LeadPriority>('normal')
  const [addingTask, setAddingTask] = useState(false)
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)
  const [docName, setDocName] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [savingDoc, setSavingDoc] = useState(false)
  const [sendingKyc, setSendingKyc] = useState(false)
  const [templates, setTemplates] = useState<Array<{ id: string; name?: string | null }>>([])
  const [emailTemplateId, setEmailTemplateId] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [runningAutomation, setRunningAutomation] = useState(false)
  const toast = useToast()

  async function load() {
    setLoading(true)
    setError('')
    try {
      const result = await crmFetch<LeadDetailPayload>(`/api/crm/leads/${leadId}`)
      setData(result)
      setForm(makeForm(result.lead))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load lead details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [leadId])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function saveLead() {
    if (!form) return
    const estimatedValue = form.estimated_value === '' ? null : Number(form.estimated_value)
    if (estimatedValue !== null && !Number.isFinite(estimatedValue)) {
      toast.error('Estimated value must be a valid number.')
      return
    }
    setSaving(true)
    try {
      const result = await crmFetch<{ lead: CRMLead }>(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status,
          priority: form.priority,
          assigned_to: form.assigned_to || null,
          next_follow_up_at: form.next_follow_up_at ? new Date(form.next_follow_up_at).toISOString() : null,
          estimated_value: estimatedValue,
          lost_reason: form.status === 'lost' ? form.lost_reason || null : null,
          notes: form.notes || null,
          company_name_choice_1: form.company_name_choice_1 || null,
          company_name_choice_2: form.company_name_choice_2 || null,
          kyc_status: form.kyc_status || null,
          incorporation_date: form.incorporation_date || null,
          annual_renewal_date: form.annual_renewal_date || null,
          tax_filing_deadline: form.tax_filing_deadline || null,
        }),
      })
      setData((current) => (current ? { ...current, lead: result.lead } : current))
      setForm(makeForm(result.lead))
      onLeadUpdated(result.lead)
      toast.success('Lead and formation details saved.')
      if (result.lead.status !== data?.lead.status) await load()
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'Could not save lead')
    } finally {
      setSaving(false)
    }
  }

  async function attachOfficialDoc(event: FormEvent) {
    event.preventDefault()
    if (!docName.trim() || !docUrl.trim()) {
      toast.error('Document title and download URL are required.')
      return
    }
    setSavingDoc(true)
    try {
      const currentDocs = (data?.lead.official_documents as Array<{ name: string; url: string; date_uploaded?: string }>) || []
      const updatedDocs = [
        ...currentDocs,
        { name: docName.trim(), url: docUrl.trim(), date_uploaded: new Date().toISOString() },
      ]
      const result = await crmFetch<{ lead: CRMLead }>(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ official_documents: updatedDocs }),
      })
      setData((current) => (current ? { ...current, lead: result.lead } : current))
      setDocName('')
      setDocUrl('')
      toast.success('Official document attached to client file.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to attach document')
    } finally {
      setSavingDoc(false)
    }
  }

  async function triggerManualKyc() {
    setSendingKyc(true)
    try {
      const result = await crmFetch<{ lead: CRMLead }>(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'kyc_processing', kyc_status: 'sent' }),
      })
      setData((current) => (current ? { ...current, lead: result.lead } : current))
      setForm(makeForm(result.lead))
      onLeadUpdated(result.lead)
      toast.success('KYC outreach dispatched via Email and WhatsApp!')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not dispatch KYC outreach')
    } finally {
      setSendingKyc(false)
    }
  }

  // Instant actions: load the template list once so the quick-email picker has options.
  useEffect(() => {
    fetch('/api/admin/email/templates?page=1&page_size=100')
      .then(async (res) => {
        if (!res.ok) return
        const data = (await res.json()) as { templates?: Array<{ id: string; name?: string | null }> }
        setTemplates((data.templates ?? []).filter((t) => t.id))
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendQuickEmail(event: FormEvent) {
    event.preventDefault()
    if (!emailTemplateId || sendingEmail) return
    setSendingEmail(true)
    try {
      await crmFetch(`/api/crm/leads/${leadId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: emailTemplateId, subject: emailSubject || null }),
      })
      setEmailSubject('')
      toast.success('Email queued for this lead.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send email')
    } finally {
      setSendingEmail(false)
    }
  }

  async function runLeadAutomations() {
    if (runningAutomation) return
    setRunningAutomation(true)
    try {
      const result = await crmFetch<{ stage: string; emitted: boolean }>(`/api/crm/leads/${leadId}/automation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      toast.success(`Automations fired for stage “${result.stage}”.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not run automations')
    } finally {
      setRunningAutomation(false)
    }
  }

  async function addActivity(event: FormEvent) {
    event.preventDefault()
    setAddingActivity(true)
    try {
      await crmFetch(`/api/crm/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activityType, title: activityTitle, description: activityDescription || null }),
      })
      setActivityTitle('')
      setActivityDescription('')
      toast.success('Activity added to the timeline.')
      await load()
    } catch (activityError) {
      toast.error(activityError instanceof Error ? activityError.message : 'Could not add activity')
    } finally {
      setAddingActivity(false)
    }
  }

  async function addTask(event: FormEvent) {
    event.preventDefault()
    setAddingTask(true)
    try {
      await crmFetch(`/api/crm/leads/${leadId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          due_at: taskDue ? new Date(taskDue).toISOString() : null,
          priority: taskPriority,
          assigned_to: form?.assigned_to || null,
        }),
      })
      setTaskTitle('')
      setTaskDue('')
      setTaskPriority('normal')
      toast.success('Task created.')
      await load()
      onTasksChanged()
    } catch (taskError) {
      toast.error(taskError instanceof Error ? taskError.message : 'Could not create task')
    } finally {
      setAddingTask(false)
    }
  }

  async function completeTask(task: CRMTask) {
    setBusyTaskId(task.id)
    try {
      await crmFetch(`/api/crm/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      toast.success('Task completed.')
      await load()
      onTasksChanged()
    } catch (taskError) {
      toast.error(taskError instanceof Error ? taskError.message : 'Could not complete task')
    } finally {
      setBusyTaskId(null)
    }
  }

  const timeline = data ? [
    ...data.activities.map((item) => ({ id: `activity-${item.id}`, kind: item.type, title: item.title, detail: item.description, date: item.occurred_at || item.date_created, actor: userLabel(item.user_created) })),
    ...data.stageHistory.map((item) => ({ id: `stage-${item.id}`, kind: 'stage', title: `Stage changed to ${item.to_stage}`, detail: item.from_stage ? `Moved from ${item.from_stage}.` : null, date: item.date_created, actor: userLabel(item.changed_by) })),
    ...data.emailEvents.map((item) => ({ id: `email-${item.id}`, kind: 'email_event', title: `Email ${item.event_type}`, detail: item.subject, date: item.occurred_at || item.date_created, actor: 'Email system' })),
    ...data.consents.map((item) => ({ id: `consent-${item.id}`, kind: 'consent', title: `${item.consent_type} ${item.granted ? 'consent granted' : 'consent withdrawn'}`, detail: item.source, date: item.captured_at || item.date_created, actor: 'Consent record' })),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()) : []

  const openTasks = data?.tasks.filter((task) => !['completed', 'cancelled'].includes(task.status)) || []

  return (
    <div className="crm-drawer-layer" role="dialog" aria-modal="true" aria-label="Lead details">
      <button type="button" className="crm-drawer-backdrop" onClick={onClose} aria-label="Close lead details" />
      <aside className="crm-drawer">
        <header className="crm-drawer-header">
          <div>
            <span className="crm-drawer-eyebrow">Lead record</span>
            <h2>{data?.lead.name || (loading ? 'Loading…' : 'Unnamed lead')}</h2>
            {data?.lead.email && <a href={`mailto:${data.lead.email}`}><Mail size={13} />{data.lead.email}</a>}
          </div>
          <button type="button" className="crm-icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>

        {loading && <div className="crm-drawer-state"><span className="crm-spinner" />Loading the complete lead record…</div>}
        {!loading && error && <div className="crm-drawer-state crm-error-state"><strong>Lead details unavailable</strong><span>{error}</span><button className="btn btn-outline" onClick={() => void load()}>Try again</button></div>}

        {!loading && data && form && (
          <div className="crm-drawer-content">
            <section className="crm-record-hero">
              <div className="crm-contact-actions">
                {data.lead.email && <a className="btn btn-outline" href={`mailto:${data.lead.email}`}><AtSign size={14} />Email</a>}
                {data.lead.phone && <a className="btn btn-outline" href={`tel:${data.lead.phone}`}><Phone size={14} />Call</a>}
              </div>
              <div className="crm-record-facts">
                <span><strong>{data.lead.country || 'Unknown'}</strong>Country</span>
                <span><strong>{data.lead.interest || 'General enquiry'}</strong>Interest</span>
                {(() => {
                  const s = calculateLeadScore(data.lead)
                  const tierClass = s.tier === 'VIP' ? 'vip' : s.tier === 'High' ? 'high' : 'medium'
                  return (
                    <span>
                      <strong className={`crm-score-pill ${tierClass}`}>
                        <Sparkles size={12} /> {s.tier} ({s.score})
                      </strong>
                      Lead Score
                    </span>
                  )
                })()}
                <span><strong>{formatShortDate(data.lead.date_created)}</strong>Created</span>
              </div>
            </section>

            <section className="crm-drawer-section">
              <div className="crm-section-heading"><div><UserRound size={16} /><h3>Ownership and value</h3></div><span>Controls who acts next</span></div>
              <div className="crm-edit-grid">
                <label>Stage<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as LeadStatus })}>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                <label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as LeadPriority })}>{PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
                <label>Owner<select value={form.assigned_to} onChange={(event) => setForm({ ...form, assigned_to: event.target.value })}><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{userLabel(user)}</option>)}</select></label>
                <label>Estimated value<div className="crm-input-icon"><CircleDollarSign size={15} /><input type="number" min="0" step="1" value={form.estimated_value} onChange={(event) => setForm({ ...form, estimated_value: event.target.value })} placeholder="0" /></div></label>
                <label className="crm-grid-wide">Next follow-up<input type="datetime-local" value={form.next_follow_up_at} onChange={(event) => setForm({ ...form, next_follow_up_at: event.target.value })} /></label>
                {form.status === 'lost' && <label className="crm-grid-wide">Lost reason<textarea rows={2} maxLength={500} value={form.lost_reason} onChange={(event) => setForm({ ...form, lost_reason: event.target.value })} placeholder="Why was this opportunity closed?" /></label>}
              </div>
              <button type="button" className="btn btn-primary crm-save-button" disabled={saving} onClick={() => void saveLead()}><Save size={14} />{saving ? 'Saving…' : 'Save lead'}</button>
            </section>

            <section className="crm-drawer-section">
              <div className="crm-section-heading">
                <div><Building size={16} /><h3>Formation & E-Registry Operations</h3></div>
                <span>Fulfillment & Compliance</span>
              </div>

              <div className="crm-formation-panel">
                <div className="crm-formation-header">
                  <span className="crm-formation-order">
                    Order Number: {data.lead.order_number || `GCC-${data.lead.id.slice(0, 8).toUpperCase()}`}
                  </span>
                  {data.lead.tracking_token && (
                    <a
                      href={`/track/${data.lead.tracking_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline crm-formation-actions"
                    >
                      <ExternalLink size={12} /> Open Public Tracker
                    </a>
                  )}
                </div>

                <div className="crm-formation-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={sendingKyc}
                    onClick={() => void triggerManualKyc()}
                  >
                    <Send size={12} /> {sendingKyc ? 'Sending…' : 'Send Standard KYC Pack (Email & WhatsApp)'}
                  </button>
                </div>

                <WhatsAppThreadPanel lead={data.lead} />
              </div>

              {/* Instant actions — quick email + run automations for this lead. */}
              <div className="crm-formation-panel">
                <div className="crm-formation-header">
                  <span className="crm-formation-order">
                    Order Number: {data.lead.order_number || `GCC-${data.lead.id.slice(0, 8).toUpperCase()}`}
                  </span>
                  {data.lead.tracking_token && (
                    <a
                      href={`/track/${data.lead.tracking_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline crm-formation-actions"
                    >
                      <ExternalLink size={12} /> Open Public Tracker
                    </a>
                  )}
                </div>

                <div className="crm-formation-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={sendingKyc}
                    onClick={() => void triggerManualKyc()}
                  >
                    <Send size={12} /> {sendingKyc ? 'Sending…' : 'Send Standard KYC Pack (Email & WhatsApp)'}
                  </button>
                </div>

                <WhatsAppThreadPanel lead={data.lead} />
              </div>

              {/* Instant actions — quick email + run automations for this lead. */}
              <div className="crm-formation-panel">
                <div className="crm-section-heading">
                  <div><Zap size={16} /><h3>Instant actions</h3></div>
                  <span>Quick email & automations</span>
                </div>

                <form onSubmit={sendQuickEmail} className="crm-quick-form">
                  <div className="crm-quick-email-row">
                    <MailCheck size={14} />
                    <select
                      value={emailTemplateId}
                      onChange={(e) => setEmailTemplateId(e.target.value)}
                    >
                      <option value="">Send email… choose a template</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name || t.id}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!emailTemplateId || sendingEmail}
                    >
                      <Send size={12} /> {sendingEmail ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Optional subject override"
                    maxLength={200}
                    className="crm-subject-input"
                  />
                </form>

                <button
                  type="button"
                  className="btn btn-outline crm-automation-btn"
                  disabled={runningAutomation}
                  onClick={() => void runLeadAutomations()}
                >
                  <Zap size={12} /> {runningAutomation ? 'Firing…' : 'Run automations for this lead'}
                </button>
              </div>

              <div className="crm-edit-grid crm-form-grid">
                <label className="crm-grid-wide">
                  Proposed Company Name 1
                  <input
                    type="text"
                    value={form.company_name_choice_1}
                    onChange={(e) => setForm({ ...form, company_name_choice_1: e.target.value })}
                    placeholder="e.g. Apex Global Technologies Limited"
                  />
                </label>
                <label className="crm-grid-wide">
                  Proposed Company Name 2 (Alternative)
                  <input
                    type="text"
                    value={form.company_name_choice_2}
                    onChange={(e) => setForm({ ...form, company_name_choice_2: e.target.value })}
                    placeholder="e.g. Apex Ventures Asia Limited"
                  />
                </label>
                <label>
                  KYC Status
                  <select
                    value={form.kyc_status}
                    onChange={(e) => setForm({ ...form, kyc_status: e.target.value })}
                  >
                    {KYC_STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Incorporation Date
                  <input
                    type="date"
                    value={form.incorporation_date}
                    onChange={(e) => setForm({ ...form, incorporation_date: e.target.value })}
                  />
                </label>
                <label>
                  Annual Renewal Date
                  <input
                    type="date"
                    value={form.annual_renewal_date}
                    onChange={(e) => setForm({ ...form, annual_renewal_date: e.target.value })}
                  />
                </label>
                <label>
                  Tax Filing Deadline
                  <input
                    type="date"
                    value={form.tax_filing_deadline}
                    onChange={(e) => setForm({ ...form, tax_filing_deadline: e.target.value })}
                  />
                </label>
              </div>

              {Array.isArray(data.lead.preliminary_documents) && data.lead.preliminary_documents.length > 0 && (
                <div className="crm-doc-list">
                  <div className="crm-section-label">
                    Client Preliminary Documents:
                  </div>
                  <div className="crm-doc-list">
                    {data.lead.preliminary_documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="crm-doc-link"
                      >
                        <FileText size={13} /> {doc.name || `Document ${idx + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="crm-doc-list">
                <div className="crm-section-label">
                  Official Incorporation Documents Attached:
                </div>
                {Array.isArray(data.lead.official_documents) && data.lead.official_documents.length > 0 ? (
                  <div className="crm-doc-list">
                    {data.lead.official_documents.map((doc, idx) => (
                      <div key={idx} className="crm-doc-row">
                        <span>{doc.name}</span>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">View File</a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="crm-doc-empty">
                    No official documents attached yet.
                  </div>
                )}

                <form onSubmit={attachOfficialDoc} className="crm-doc-form">
                  <input
                    type="text"
                    required
                    placeholder="Doc Title (e.g. Certificate of Incorporation)"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                  />
                  <input
                    type="url"
                    required
                    placeholder="Download / Public URL"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                  />
                  <button type="submit" className="btn btn-outline" disabled={savingDoc}>
                    <UploadCloud size={13} /> {savingDoc ? 'Attaching…' : 'Attach Official Doc'}
                  </button>
                </form>
              </div>

              <button type="button" className="btn btn-primary crm-save-button" disabled={saving} onClick={() => void saveLead()}>
                <Save size={14} />{saving ? 'Saving…' : 'Save Formation Data'}
              </button>
            </section>

            <section className="crm-drawer-section">
              <div className="crm-section-heading"><div><ClipboardCheck size={16} /><h3>Tasks</h3></div><span>{openTasks.length} active</span></div>
              <form className="crm-quick-form" onSubmit={addTask}>
                <input required maxLength={200} value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="What needs to happen next?" aria-label="Task title" />
                <div className="crm-quick-form-row">
                  <input type="datetime-local" value={taskDue} onChange={(event) => setTaskDue(event.target.value)} aria-label="Task due date" />
                  <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as LeadPriority)} aria-label="Task priority">{PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select>
                  <button type="submit" className="btn btn-primary" disabled={addingTask}><Plus size={14} />{addingTask ? 'Adding…' : 'Add task'}</button>
                </div>
              </form>
              <div className="crm-drawer-task-list">
                {openTasks.map((task) => (
                  <article key={task.id} className={isOverdue(task.due_at) ? 'is-overdue' : ''}>
                    <button type="button" onClick={() => void completeTask(task)} disabled={busyTaskId === task.id} aria-label={`Complete ${task.title}`}><Check size={13} /></button>
                    <div><strong>{task.title}</strong><span><Clock3 size={12} />{formatShortDate(task.due_at, true)} · {userLabel(task.assigned_to)}</span></div>
                    <span className={`crm-priority crm-priority-${task.priority}`}>{task.priority}</span>
                  </article>
                ))}
                {openTasks.length === 0 && <div className="crm-compact-empty"><CheckCircle2 size={16} />No active tasks for this lead.</div>}
              </div>
            </section>

            <section className="crm-drawer-section">
              <div className="crm-section-heading"><div><MessageSquareText size={16} /><h3>Log activity</h3></div><span>Add human context</span></div>
              <form className="crm-activity-form" onSubmit={addActivity}>
                <div className="crm-activity-types">{ACTIVITY_TYPES.map((type) => <button type="button" key={type} className={activityType === type ? 'active' : ''} onClick={() => setActivityType(type)}>{type}</button>)}</div>
                <input required maxLength={160} value={activityTitle} onChange={(event) => setActivityTitle(event.target.value)} placeholder={activityType === 'note' ? 'What did you learn?' : `Summary of the ${activityType}`} />
                <textarea rows={3} maxLength={5000} value={activityDescription} onChange={(event) => setActivityDescription(event.target.value)} placeholder="Add details, outcomes, or next steps…" />
                <button className="btn btn-primary" disabled={addingActivity}><Plus size={14} />{addingActivity ? 'Adding…' : 'Add to timeline'}</button>
              </form>
            </section>

            <section className="crm-drawer-section">
              <div className="crm-section-heading"><div><Activity size={16} /><h3>Activity timeline</h3></div><span>{timeline.length} events</span></div>
              <div className="crm-timeline">
                {timeline.map((item) => (
                  <article key={item.id}>
                    <span className={`crm-timeline-icon crm-timeline-${item.kind}`}>{item.kind === 'consent' ? <ShieldCheck size={14} /> : item.kind.includes('email') ? <Mail size={14} /> : item.kind === 'stage' ? <Activity size={14} /> : <MessageSquareText size={14} />}</span>
                    <div><div className="crm-timeline-title"><strong>{item.title}</strong><time>{formatShortDate(item.date, true)}</time></div>{item.detail && <p>{item.detail}</p>}<span>{item.actor}</span></div>
                  </article>
                ))}
                {timeline.length === 0 && <div className="crm-compact-empty">No activity has been recorded yet.</div>}
              </div>
            </section>

            <section className="crm-drawer-section">
              <div className="crm-section-heading"><div><ShieldCheck size={16} /><h3>Consent and subscription</h3></div></div>
              <div className="crm-consent-panel">
                <span><strong>Email subscription</strong>{data.lead.email_subscription_status || 'Unknown'}</span>
                <span><strong>Consent status</strong>{data.lead.consent_status || `${data.consents.length} records`}</span>
                <span><strong>Sender status</strong>{data.lead.sender_status || (data.lead.sender_subscriber_id ? 'Linked' : 'Not linked')}</span>
              </div>
            </section>

            {(data.lead.message || data.lead.notes) && <section className="crm-drawer-section"><div className="crm-section-heading"><div><MessageSquareText size={16} /><h3>Original context</h3></div></div>{data.lead.message && <div className="crm-context-block"><strong>Message</strong><p>{data.lead.message}</p></div>}{data.lead.notes && <div className="crm-context-block"><strong>Legacy notes</strong><p>{data.lead.notes}</p></div>}</section>}
          </div>
        )}
      </aside>
    </div>
  )
}
