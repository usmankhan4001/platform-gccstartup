'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AtSign,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Circle,
  CircleDollarSign,
  FileText,
  ListChecks,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/ToastProvider'
import { calculateLeadScore } from '@/lib/crm/scoring'
import { logLeadNote, updateLeadFields } from './actions'
import { COMPLIANCE_KINDS, COMPLIANCE_LABELS, type ComplianceKind } from './pipeline-types'
import { PIPELINE_STAGES, stageMeta } from './stages'
import {
  formatCountdown,
  formatCurrency,
  formatRelative,
  initialsOf,
  scoreTone,
  urgencyLabel,
  urgencyTone,
} from './format'
import { resolveUrgency, type LeadStatus } from './types'

/* -------------------------------------------------------------------------- */
/* API shapes                                                                 */
/* -------------------------------------------------------------------------- */

type LeadRecord = {
  id: string
  name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  company?: string | null
  job_title?: string | null
  status?: string | null
  lifecycle_stage?: string | null
  source?: string | null
  owner_id?: string | null
  owner_name?: string | null
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
  [key: string]: any
}

type ApiActivity = {
  id: string
  type: string
  direction: string
  subject: string | null
  notes: string | null
  occurred_at: string
  duration_minutes: number | null
}

type ApiNote = { id: string; body: string; author_name: string | null; created_at: string }
type ApiTask = {
  id: string
  title: string
  details: string | null
  due_at: string | null
  completed_at: string | null
  priority: string
  status?: string
}
type ApiMessage = { id: string; direction: string; body: string | null; status: string; occurred_at?: string; date_created?: string }
type ApiEmail = { id: string; subject: string; status: string; created_at: string; sent_at: string | null }
type ApiDeal = { id: string; title: string; value: number | null; currency: string; status: string; expected_close_date: string | null }

type LeadDetailPayload = {
  lead: LeadRecord
  activities: ApiActivity[]
  tasks: ApiTask[]
  notes: ApiNote[]
  deals: ApiDeal[]
  messages: ApiMessage[]
  emailEvents: ApiEmail[]
}

/* -------------------------------------------------------------------------- */
/* Static config                                                              */
/* -------------------------------------------------------------------------- */

const KYC_ITEMS = [
  { key: 'passport', label: 'Passport copy' },
  { key: 'proof_of_address', label: 'Proof of address' },
  { key: 'ubo_declaration', label: 'UBO declaration' },
  { key: 'moa_signed', label: 'MoA / AoA signed' },
  { key: 'bank_reference', label: 'Bank reference letter' },
]

const DEADLINE_FIELDS: Record<ComplianceKind, string> = {
  trade_license: 'trade_license_expiry',
  visa_eid: 'visa_eid_expiry',
  corporate_tax: 'tax_filing_deadline',
  ubo_declaration: 'ubo_declaration_deadline',
}

const TIMELINE_FILTERS = ['all', 'whatsapp', 'email', 'note', 'task', 'call'] as const
type TimelineFilter = (typeof TIMELINE_FILTERS)[number]

const COMPOSER_TABS = ['whatsapp', 'email', 'note', 'task'] as const
type ComposerTab = (typeof COMPOSER_TABS)[number]

type TimelineItem = {
  id: string
  kind: 'whatsapp' | 'email' | 'note' | 'task' | 'call' | 'meeting'
  title: string
  body: string | null
  at: string
  direction: string | null
  meta: string | null
}

const KIND_ICON: Record<TimelineItem['kind'], React.ComponentType<{ className?: string }>> = {
  whatsapp: MessageSquare,
  email: Mail,
  note: FileText,
  task: ListChecks,
  call: Phone,
  meeting: UserRound,
}

const KIND_TONE: Record<TimelineItem['kind'], string> = {
  whatsapp: 'rgba(37, 211, 102, 0.14)',
  email: 'rgba(27, 79, 216, 0.12)',
  note: 'rgba(100, 116, 139, 0.14)',
  task: 'rgba(242, 101, 34, 0.14)',
  call: 'rgba(16, 185, 129, 0.14)',
  meeting: 'rgba(139, 92, 246, 0.14)',
}

function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null
  const target = new Date(value).getTime()
  if (Number.isNaN(target)) return null
  return Math.ceil((target - Date.now()) / (24 * 60 * 60 * 1000))
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function Lead360Drawer({
  leadId,
  open = true,
  initialTab = 'note',
  onClose,
  onUpdated,
}: {
  leadId?: string | null
  open?: boolean
  initialTab?: string
  onClose: () => void
  onUpdated?: () => void
}) {
  const toast = useToast()
  const [data, setData] = useState<LeadDetailPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [filter, setFilter] = useState<TimelineFilter>('all')
  const [composer, setComposer] = useState<ComposerTab>(
    COMPOSER_TABS.find((tab) => tab === initialTab) ?? 'note'
  )

  const [whatsappBody, setWhatsappBody] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDue, setTaskDue] = useState('')

  const [compliance, setCompliance] = useState<Record<ComplianceKind, string>>({
    trade_license: '',
    visa_eid: '',
    corporate_tax: '',
    ubo_declaration: '',
  })
  const [licenseNumber, setLicenseNumber] = useState('')

  const load = useCallback(async () => {
    if (!leadId) return
    setLoading(true)
    setError('')
    try {
      const [detailRes, waRes] = await Promise.all([
        fetch(`/api/crm/leads/${leadId}`, { credentials: 'include' }),
        fetch(`/api/crm/whatsapp?lead_id=${leadId}`, { credentials: 'include' }),
      ])

      if (!detailRes.ok) throw new Error('Could not load this record')
      const detail = (await detailRes.json()) as Partial<LeadDetailPayload> & { data?: LeadDetailPayload }

      const payload: LeadDetailPayload = {
        lead: (detail.lead ?? detail.data?.lead ?? { id: leadId }) as LeadRecord,
        activities: detail.activities ?? [],
        tasks: detail.tasks ?? [],
        notes: detail.notes ?? [],
        deals: detail.deals ?? [],
        messages: detail.messages ?? [],
        emailEvents: detail.emailEvents ?? [],
      }

      if (waRes.ok) {
        const wa = (await waRes.json()) as { messages?: ApiMessage[] }
        const seen = new Set(payload.messages.map((message) => message.id))
        for (const message of wa.messages ?? []) {
          if (!seen.has(message.id)) payload.messages.push(message)
        }
      }

      setData(payload)

      const cf = (payload.lead.custom_fields ?? {}) as Record<string, any>
      setCompliance({
        trade_license: typeof cf.trade_license_expiry === 'string' ? cf.trade_license_expiry.slice(0, 10) : '',
        visa_eid: typeof cf.visa_eid_expiry === 'string' ? cf.visa_eid_expiry.slice(0, 10) : '',
        corporate_tax: typeof cf.tax_filing_deadline === 'string' ? cf.tax_filing_deadline.slice(0, 10) : '',
        ubo_declaration: typeof cf.ubo_declaration_deadline === 'string' ? cf.ubo_declaration_deadline.slice(0, 10) : '',
      })
      setLicenseNumber(typeof cf.trade_license_number === 'string' ? cf.trade_license_number : '')
    } catch (err) {
      console.error('[crm/lead360] load failed', err)
      setError(err instanceof Error ? err.message : 'Could not load this record')
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    if (!open || !leadId) return
    void load()
  }, [open, leadId, load])

  useEffect(() => {
    setComposer(COMPOSER_TABS.find((tab) => tab === initialTab) ?? 'note')
  }, [initialTab])

  const lead = data?.lead
  const cf = useMemo<Record<string, any>>(() => (lead?.custom_fields ?? {}) as Record<string, any>, [lead])
  const stage = stageMeta(lead?.status ?? cf.status)
  const score = useMemo(
    () =>
      calculateLeadScore({
        email: lead?.email ?? null,
        phone: lead?.phone ?? null,
        jurisdiction: cf.jurisdiction ?? null,
        deal_value: Number(cf.deal_value ?? cf.estimated_value ?? 0) || undefined,
        status: lead?.status ?? cf.status,
        custom_fields: cf,
      }),
    [lead, cf]
  )

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!data) return []
    const items: TimelineItem[] = []

    for (const activity of data.activities) {
      items.push({
        id: `act-${activity.id}`,
        kind: activity.type === 'meeting' ? 'meeting' : 'call',
        title: activity.subject || (activity.type === 'meeting' ? 'Meeting' : 'Call'),
        body: activity.notes,
        at: activity.occurred_at,
        direction: activity.direction,
        meta: activity.duration_minutes ? `${activity.duration_minutes} min` : null,
      })
    }
    for (const note of data.notes) {
      items.push({
        id: `note-${note.id}`,
        kind: 'note',
        title: note.author_name ? `Note from ${note.author_name}` : 'Internal note',
        body: note.body,
        at: note.created_at,
        direction: null,
        meta: null,
      })
    }
    for (const message of data.messages) {
      items.push({
        id: `wa-${message.id}`,
        kind: 'whatsapp',
        title: message.direction === 'inbound' ? 'WhatsApp received' : 'WhatsApp sent',
        body: message.body,
        at: message.occurred_at ?? message.date_created ?? new Date().toISOString(),
        direction: message.direction,
        meta: message.status,
      })
    }
    for (const email of data.emailEvents) {
      items.push({
        id: `email-${email.id}`,
        kind: 'email',
        title: email.subject,
        body: null,
        at: email.sent_at ?? email.created_at,
        direction: 'outbound',
        meta: email.status,
      })
    }
    for (const task of data.tasks) {
      items.push({
        id: `task-${task.id}`,
        kind: 'task',
        title: task.title,
        body: task.details,
        at: task.due_at ?? task.completed_at ?? new Date().toISOString(),
        direction: null,
        meta: task.completed_at ? 'Completed' : task.due_at ? 'Due' : 'Open',
      })
    }

    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    return items
  }, [data])

  const visibleTimeline = useMemo(
    () => (filter === 'all' ? timeline : timeline.filter((item) => item.kind === filter)),
    [timeline, filter]
  )

  const kycChecklist = useMemo<Record<string, boolean>>(() => {
    const stored = cf.kyc_checklist
    if (stored && typeof stored === 'object') return stored as Record<string, boolean>
    // Fall back to the pipeline status so the checklist still means something
    // before anyone has ticked a box manually.
    const order = ['pending', 'sent', 'received', 'under_review', 'approved']
    const index = order.indexOf(String(cf.kyc_status ?? 'pending'))
    const done = index <= 0 ? 0 : Math.round((index / (order.length - 1)) * KYC_ITEMS.length)
    return Object.fromEntries(KYC_ITEMS.map((item, i) => [item.key, i < done]))
  }, [cf])

  const documents = useMemo(() => {
    const list = [...(Array.isArray(cf.documents) ? cf.documents : []), ...(Array.isArray(cf.official_documents) ? cf.official_documents : [])]
    return list.filter((doc): doc is { name: string; url?: string } => Boolean(doc && typeof doc.name === 'string'))
  }, [cf])

  async function runMutation(action: () => Promise<void>, successMessage: string) {
    setBusy(true)
    try {
      await action()
      toast.success(successMessage)
      await load()
      onUpdated?.()
    } catch (err) {
      console.error('[crm/lead360] mutation failed', err)
      toast.error(err instanceof Error ? err.message : 'That action could not be completed')
    } finally {
      setBusy(false)
    }
  }

  async function postJson(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    const payload = (await res.json().catch(() => ({}))) as { error?: string }
    if (!res.ok) throw new Error(payload.error || 'Request failed')
    return payload
  }

  function sendWhatsApp() {
    if (!leadId || !whatsappBody.trim()) return
    return runMutation(async () => {
      await postJson('/api/crm/whatsapp', { lead_id: leadId, body: whatsappBody.trim() })
      setWhatsappBody('')
    }, 'WhatsApp message sent.')
  }

  function sendEmail() {
    if (!leadId || !emailSubject.trim() || !emailBody.trim()) return
    return runMutation(async () => {
      await postJson(`/api/crm/leads/${leadId}/email`, {
        subject: emailSubject.trim(),
        html: emailBody.trim().replace(/\n/g, '<br />'),
        text: emailBody.trim(),
      })
      setEmailSubject('')
      setEmailBody('')
    }, 'Email queued for delivery.')
  }

  function saveNote() {
    if (!leadId || !noteBody.trim()) return
    return runMutation(async () => {
      const result = await logLeadNote(leadId, noteBody)
      if (!result.ok) throw new Error(result.message)
      setNoteBody('')
    }, 'Note added to the timeline.')
  }

  function createTask() {
    if (!leadId || !taskTitle.trim()) return
    return runMutation(async () => {
      await postJson(`/api/crm/leads/${leadId}/tasks`, {
        title: taskTitle.trim(),
        due_at: taskDue ? new Date(taskDue).toISOString() : null,
        priority: 'normal',
      })
      setTaskTitle('')
      setTaskDue('')
    }, 'Task created.')
  }

  function toggleKyc(key: string) {
    if (!leadId) return
    const next = { ...kycChecklist, [key]: !kycChecklist[key] }
    return runMutation(async () => {
      const result = await updateLeadFields(leadId, { kyc_checklist: next })
      if (!result.ok) throw new Error(result.message)
    }, 'KYC checklist updated.')
  }

  function saveCompliance() {
    if (!leadId) return
    return runMutation(async () => {
      const result = await updateLeadFields(leadId, {
        trade_license_number: licenseNumber || null,
        trade_license_expiry: compliance.trade_license || null,
        annual_renewal_date: compliance.trade_license || null,
        visa_eid_expiry: compliance.visa_eid || null,
        tax_filing_deadline: compliance.corporate_tax || null,
        ubo_declaration_deadline: compliance.ubo_declaration || null,
      })
      if (!result.ok) throw new Error(result.message)
    }, 'Compliance dates saved.')
  }

  function changeStage(next: LeadStatus) {
    if (!leadId) return
    return runMutation(async () => {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: next, stage: next }),
      })
      const payload = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(payload.error || 'Could not move this deal')
    }, `Moved to ${stageMeta(next).label}.`)
  }

  const displayName = lead?.name || [lead?.first_name, lead?.last_name].filter(Boolean).join(' ') || 'Unnamed contact'

  return (
    <Sheet open={open && Boolean(leadId)} onOpenChange={(next) => { if (!next) onClose() }}>
      <SheetContent
        side="right"
        hideClose
        className="w-full gap-0 p-0 sm:max-w-[1180px]"
        aria-describedby={undefined}
      >
        {/* Header */}
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback>{initialsOf(displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle className="truncate text-base font-black text-[var(--text)]">{displayName}</SheetTitle>
              <p className="truncate text-xs text-[var(--text-secondary)]">
                {lead?.company || cf.company_name_choice_1 || 'No company on file'}
                {lead?.job_title ? ` - ${lead.job_title}` : ''}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge size="sm" dot style={{ color: stage.color, borderColor: `${stage.color}33` }}>
                  {stage.label}
                </Badge>
                <Badge size="sm" variant={scoreTone(score.tier)}>
                  {score.tier} {score.score}
                </Badge>
                {cf.desk ? <Badge size="sm">{String(cf.desk)}</Badge> : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <select
              aria-label="Move deal to stage"
              value={stage.id}
              disabled={busy}
              onChange={(event) => changeStage(event.target.value as LeadStatus)}
              className="rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-xs font-semibold text-[var(--text)]"
            >
              {PIPELINE_STAGES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <Button variant="ghost" size="icon" aria-label="Reload record" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Close panel" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {error && (
          <p className="shrink-0 border-b border-[var(--danger-border)] bg-[var(--danger-lt)] px-5 py-2 text-xs font-semibold text-[var(--danger)]">
            {error}
          </p>
        )}

        {/* Three columns */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[300px_minmax(0,1fr)_320px] lg:overflow-hidden">
          {/* Left - properties & vitals */}
          <aside className="border-b border-[var(--border)] px-4 py-4 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <SectionTitle icon={UserRound}>Properties</SectionTitle>

            <dl className="mt-3 space-y-2.5">
              <Field label="Email" icon={AtSign}>
                {lead?.email ? (
                  <a href={`mailto:${lead.email}`} className="truncate text-[var(--blue-dk)] hover:underline">
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-[var(--text-tertiary)]">Not set</span>
                )}
              </Field>
              <Field label="Phone" icon={Phone}>
                {lead?.phone ? (
                  <a href={`tel:${lead.phone}`} className="text-[var(--blue-dk)] hover:underline">
                    {lead.phone}
                  </a>
                ) : (
                  <span className="text-[var(--text-tertiary)]">Not set</span>
                )}
              </Field>
              <Field label="Lifecycle" icon={Sparkles}>
                <span className="capitalize">{lead?.lifecycle_stage || 'lead'}</span>
              </Field>
              <Field label="Source" icon={Building2}>
                {lead?.source || 'Not set'}
              </Field>
              <Field label="Owner" icon={UserRound}>
                {lead?.owner_name || 'Unassigned'}
              </Field>
              <Field label="Jurisdiction" icon={ShieldCheck}>
                {cf.jurisdiction || 'Not set'}
              </Field>
              <Field label="Deal value" icon={Sparkles}>
                <span className="font-mono font-bold">
                  {formatCurrency(Number(cf.deal_value ?? cf.estimated_value ?? 0) || 0, cf.currency || 'AED')}
                </span>
              </Field>
            </dl>

            <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                  Lead score
                </p>
                <Badge size="sm" variant={scoreTone(score.tier)}>
                  {score.tier}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-2xl font-black text-[var(--text)]">{score.score}</p>
              <Progress
                className="mt-2"
                value={score.score}
                tone={score.score >= 70 ? 'success' : score.score >= 40 ? 'warning' : 'danger'}
                label={`Lead score ${score.score} out of 100`}
              />
              <ul className="mt-2.5 space-y-1">
                {score.factors.slice(0, 4).map((factor) => (
                  <li key={factor.factor} className="flex items-start justify-between gap-2 text-[11px]">
                    <span className="min-w-0 truncate text-[var(--text-secondary)]">{factor.factor}</span>
                    <span className="shrink-0 font-mono font-bold text-[var(--green-dk)]">+{factor.points}</span>
                  </li>
                ))}
                {score.factors.length === 0 && (
                  <li className="text-[11px] text-[var(--text-tertiary)]">No scoring signals yet.</li>
                )}
              </ul>
            </div>

            <div className="mt-5">
              <SectionTitle icon={ListChecks}>KYC checklist</SectionTitle>
              <ul className="mt-2 space-y-1">
                {KYC_ITEMS.map((item) => {
                  const done = Boolean(kycChecklist[item.key])
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleKyc(item.key)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-60"
                      >
                        {done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--success)]" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" />
                        )}
                        <span className={done ? 'text-[var(--text-secondary)] line-through' : 'text-[var(--text)]'}>
                          {item.label}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)]">
                Status: {String(cf.kyc_status || 'pending').replace(/_/g, ' ')}
              </p>
            </div>
          </aside>

          {/* Center - timeline + composer */}
          <section className="flex min-h-0 flex-col border-b border-[var(--border)] lg:border-b-0 lg:border-r">
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[var(--border)] px-4 py-2.5">
              {TIMELINE_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize transition-colors ${
                    filter === item
                      ? 'bg-[var(--navy)] text-white'
                      : 'bg-[var(--surface-alt)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {loading && !data && <p className="py-8 text-center text-xs text-[var(--text-tertiary)]">Loading activity...</p>}

              {!loading && visibleTimeline.length === 0 && (
                <p className="py-10 text-center text-xs text-[var(--text-tertiary)]">
                  No activity on this channel yet. Use the composer below to start the thread.
                </p>
              )}

              <ol className="space-y-2.5">
                {visibleTimeline.map((item) => {
                  const Icon = KIND_ICON[item.kind]
                  return (
                    <li key={item.id} className="flex gap-2.5">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: KIND_TONE[item.kind] }}
                      >
                        <Icon className="h-3.5 w-3.5 text-[var(--text)]" />
                      </span>
                      <div className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 truncate text-xs font-bold text-[var(--text)]">{item.title}</p>
                          <span className="shrink-0 text-[10px] text-[var(--text-tertiary)]">
                            {formatRelative(item.at)}
                          </span>
                        </div>
                        {item.body && (
                          <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-[var(--text-secondary)]">
                            {item.body}
                          </p>
                        )}
                        {(item.direction || item.meta) && (
                          <p className="mt-1 text-[10px] capitalize text-[var(--text-tertiary)]">
                            {[item.direction, item.meta].filter(Boolean).join(' - ')}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* Composer */}
            <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                {COMPOSER_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setComposer(tab)}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold capitalize transition-colors ${
                      composer === tab
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-white text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {composer === 'whatsapp' && (
                <div className="mt-2.5">
                  <textarea
                    value={whatsappBody}
                    onChange={(event) => setWhatsappBody(event.target.value)}
                    rows={2}
                    placeholder="Write a WhatsApp message..."
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button size="xs" disabled={busy || !whatsappBody.trim()} onClick={() => void sendWhatsApp()}>
                      <Send className="h-3 w-3" /> Send WhatsApp
                    </Button>
                  </div>
                </div>
              )}

              {composer === 'email' && (
                <div className="mt-2.5 space-y-2">
                  <input
                    value={emailSubject}
                    onChange={(event) => setEmailSubject(event.target.value)}
                    placeholder="Subject"
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  />
                  <textarea
                    value={emailBody}
                    onChange={(event) => setEmailBody(event.target.value)}
                    rows={2}
                    placeholder="Write the email body..."
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="xs"
                      disabled={busy || !emailSubject.trim() || !emailBody.trim()}
                      onClick={() => void sendEmail()}
                    >
                      <Mail className="h-3 w-3" /> Queue email
                    </Button>
                  </div>
                </div>
              )}

              {composer === 'note' && (
                <div className="mt-2.5">
                  <textarea
                    value={noteBody}
                    onChange={(event) => setNoteBody(event.target.value)}
                    rows={2}
                    placeholder="Log an internal note..."
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button size="xs" variant="secondary" disabled={busy || !noteBody.trim()} onClick={() => void saveNote()}>
                      <Save className="h-3 w-3" /> Save note
                    </Button>
                  </div>
                </div>
              )}

              {composer === 'task' && (
                <div className="mt-2.5 space-y-2">
                  <input
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    placeholder="Task title"
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  />
                  <input
                    type="date"
                    value={taskDue}
                    onChange={(event) => setTaskDue(event.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  />
                  <div className="flex justify-end">
                    <Button size="xs" variant="secondary" disabled={busy || !taskTitle.trim()} onClick={() => void createTask()}>
                      <Check className="h-3 w-3" /> Create task
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Right - associations */}
          <aside className="space-y-5 px-4 py-4 lg:overflow-y-auto">
            <div>
              <SectionTitle icon={Building2}>Company</SectionTitle>
              <p className="mt-2 text-xs font-bold text-[var(--text)]">
                {lead?.company || cf.company_name_choice_1 || 'Not set'}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">{cf.entity_type || 'Entity type not set'}</p>
              <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                Order: <span className="font-mono">{cf.order_number || 'Not issued'}</span>
              </p>
            </div>

            <div>
              <SectionTitle icon={ShieldCheck}>Compliance ledger</SectionTitle>
              <div className="mt-2 space-y-2">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                    Trade license no.
                  </span>
                  <input
                    value={licenseNumber}
                    onChange={(event) => setLicenseNumber(event.target.value)}
                    placeholder="TL-000000"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 font-mono text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  />
                </label>

                {COMPLIANCE_KINDS.map((kind) => {
                  const days = daysUntil(compliance[kind] || null)
                  const urgency = days === null ? 'unknown' : resolveUrgency(days)
                  return (
                    <label key={kind} className="block">
                      <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                        {COMPLIANCE_LABELS[kind]}
                      </span>
                      <input
                        type="date"
                        value={compliance[kind]}
                        onChange={(event) => setCompliance((current) => ({ ...current, [kind]: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                      />
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <Badge size="sm" variant={urgencyTone(urgency)}>
                          {urgencyLabel(urgency)}
                        </Badge>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{formatCountdown(days)}</span>
                      </span>
                    </label>
                  )
                })}

                <Button size="xs" variant="secondary" className="w-full" disabled={busy} onClick={() => void saveCompliance()}>
                  <Save className="h-3 w-3" /> Save compliance dates
                </Button>
              </div>
            </div>

            <div>
              <SectionTitle icon={CalendarClock}>Renewal countdowns</SectionTitle>
              <ul className="mt-2 space-y-1.5">
                {COMPLIANCE_KINDS.map((kind) => {
                  const days = daysUntil(compliance[kind] || null)
                  const urgency = days === null ? 'unknown' : resolveUrgency(days)
                  return (
                    <li
                      key={kind}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-2.5 py-1.5"
                    >
                      <span className="truncate text-[11px] text-[var(--text-secondary)]">{COMPLIANCE_LABELS[kind]}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              urgency === 'expired' || urgency === 'critical'
                                ? 'var(--danger)'
                                : urgency === 'warning'
                                  ? 'var(--warning)'
                                  : urgency === 'upcoming'
                                    ? 'var(--gold)'
                                    : urgency === 'healthy'
                                      ? 'var(--success)'
                                      : 'var(--border-hover)',
                          }}
                        />
                        <span className="text-[11px] font-bold text-[var(--text)]">{formatCountdown(days)}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div>
              <SectionTitle icon={FileText}>Document vault</SectionTitle>
              {documents.length === 0 ? (
                <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">No documents attached yet.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {documents.slice(0, 12).map((doc, index) => (
                    <li key={`${doc.name}-${index}`}>
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-[11px] text-[var(--blue-dk)] hover:underline"
                        >
                          <FileText className="h-3 w-3 shrink-0" />
                          <span className="truncate">{doc.name}</span>
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                          <FileText className="h-3 w-3 shrink-0" />
                          <span className="truncate">{doc.name}</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <SectionTitle icon={CircleDollarSign}>Deals</SectionTitle>
              {(data?.deals ?? []).length === 0 ? (
                <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">No linked deals.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {(data?.deals ?? []).slice(0, 6).map((deal) => (
                    <li
                      key={deal.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-2.5 py-1.5"
                    >
                      <span className="truncate text-[11px] text-[var(--text)]">{deal.title}</span>
                      <span className="shrink-0 font-mono text-[11px] font-bold text-[var(--text)]">
                        {formatCurrency(deal.value ?? 0, deal.currency || 'AED')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* -------------------------------------------------------------------------- */
/* Small local building blocks                                                */
/* -------------------------------------------------------------------------- */

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </h4>
  )
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" />
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">{label}</dt>
        <dd className="truncate text-xs text-[var(--text)]">{children}</dd>
      </div>
    </div>
  )
}
