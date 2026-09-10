'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  ListChecks,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  StickyNote,
  Tag as TagIcon,
  UserCheck,
} from 'lucide-react'

import { Avatar, AvatarFallback, initials } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LEAD_STAGES, getLeadStage } from '@/lib/constants/lead-stages'
import { formatTimeAgo } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

export interface CrmContextContact {
  id: string
  name?: string
  phoneNumber?: string
  email?: string
  company?: string
  channel?: string
  leadStage?: string
  dealValue?: number
}

interface CrmContextDrawerProps {
  contact: CrmContextContact | null
  onChanged?: () => void
}

const LIFECYCLE_TONE: Record<string, string> = {
  lead: 'info',
  subscriber: 'info',
  prospect: 'warning',
  client: 'success',
  churned: 'destructive',
}

function formatDue(dueAt?: string | null): string {
  if (!dueAt) return 'No due date'
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) return 'No due date'
  const diff = due.getTime() - Date.now()
  if (diff < 0) return `Overdue · ${formatTimeAgo(due)}`
  return `Due ${formatTimeAgo(due).replace(' ago', '')}`
}

export function CrmContextDrawer({ contact, onChanged }: CrmContextDrawerProps) {
  const [crm, setCrm] = useState<AnyRecord | null>(null)
  const [tasks, setTasks] = useState<AnyRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [leadStage, setLeadStage] = useState('NEW_LEAD')
  const [dealValue, setDealValue] = useState(0)
  const [assignee, setAssignee] = useState('')
  const [noteText, setNoteText] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  const contactId = contact?.id

  const fetchCrm = useCallback(() => {
    if (!contactId) return
    setLoading(true)
    setError(null)
    fetch(`/api/chat/contact-crm?contactId=${encodeURIComponent(contactId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (!data?.contact) {
          setError('Contact record not found')
          return
        }
        setCrm(data)
        setLeadStage(data.contact.leadStage || 'NEW_LEAD')
        setDealValue(Number(data.contact.dealValue) || 0)
        setAssignee(data.contact.conversation?.assignedToId || data.contact.owner_id || '')
      })
      .catch(() => setError('Could not load CRM context'))
      .finally(() => setLoading(false))
  }, [contactId])

  const fetchTasks = useCallback(() => {
    if (!contactId) return
    fetch(`/api/crm/tasks?contact_id=${encodeURIComponent(contactId)}&completed=false`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setTasks(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setTasks([]))
  }, [contactId])

  useEffect(() => {
    setCrm(null)
    setTasks([])
    setNoteText('')
    setTaskTitle('')
    fetchCrm()
    fetchTasks()
  }, [fetchCrm, fetchTasks])

  const save = async (patch: AnyRecord = {}) => {
    if (!contactId) return
    setSaving(true)
    try {
      const res = await fetch('/api/chat/contact-crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          leadStage,
          dealValue,
          assignToId: assignee || null,
          ...patch,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      fetchCrm()
      onChanged?.()
    } catch {
      setError('Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return
    await save({ noteText: noteText.trim() })
    setNoteText('')
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim() || !contactId) return
    setAddingTask(true)
    try {
      await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          contact_id: contactId,
          priority: 'normal',
        }),
      })
      setTaskTitle('')
      fetchTasks()
    } catch {
      setError('Could not create task')
    } finally {
      setAddingTask(false)
    }
  }

  const completeTask = async (taskId: string) => {
    try {
      await fetch(`/api/crm/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })
      fetchTasks()
    } catch {
      setError('Could not complete task')
    }
  }

  if (!contact) {
    return (
      <aside className="hidden w-[320px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)] xl:flex">
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <p className="text-xs text-[var(--text-tertiary)]">
            Select a conversation to see the CRM record, deal stage and next task.
          </p>
        </div>
      </aside>
    )
  }

  const record = crm?.contact
  const custom = (record?.custom_fields || {}) as AnyRecord
  const displayName =
    contact.name ||
    record?.display_name ||
    [record?.first_name, record?.last_name].filter(Boolean).join(' ') ||
    'Contact'
  const lifecycle = String(record?.lifecycle_stage || 'lead')
  const nextTask = tasks[0]
  const stage = getLeadStage(leadStage)
  const agents: AnyRecord[] = Array.isArray(crm?.allAgents) ? crm.allAgents : []
  const notes: AnyRecord[] = Array.isArray(record?.conversation?.notes) ? record.conversation.notes : []
  const events: AnyRecord[] = Array.isArray(record?.conversation?.events) ? record.conversation.events : []

  return (
    <aside className="hidden w-[320px] shrink-0 flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--surface)] xl:flex">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--navy)]">CRM context</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              fetchCrm()
              fetchTasks()
            }}
            className="rounded p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
            aria-label="Refresh CRM context"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href={`/crm/contacts?contactId=${encodeURIComponent(contact.id)}`}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[10px] font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--orange-lt)]"
          >
            <ExternalLink className="h-3 w-3" />
            360° record
          </Link>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {error && (
          <div className="rounded-lg border border-[var(--danger-border)] bg-[var(--danger-lt)] px-2.5 py-2 text-[11px] text-[var(--danger)]">
            {error}
          </div>
        )}

        {/* Contact summary */}
        <section className="flex items-start gap-2.5">
          <Avatar className="h-11 w-11">
            <AvatarFallback>{initials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[var(--text)]">{displayName}</p>
            {contact.company || record?.company ? (
              <p className="flex items-center gap-1 truncate text-[11px] text-[var(--text-secondary)]">
                <Building2 className="h-3 w-3 shrink-0" />
                {contact.company || record?.company}
              </p>
            ) : null}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <StatusBadge tone={LIFECYCLE_TONE[lifecycle] ?? 'neutral'}>{lifecycle}</StatusBadge>
              <StatusBadge tone={stage.tone}>{stage.label}</StatusBadge>
            </div>
          </div>
        </section>

        <section className="space-y-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-2.5 text-[11px]">
          <p className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <Phone className="h-3 w-3 shrink-0 text-[var(--text-tertiary)]" />
            <span className="truncate font-mono">{contact.phoneNumber || record?.phone || '—'}</span>
          </p>
          <p className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <Mail className="h-3 w-3 shrink-0 text-[var(--text-tertiary)]" />
            <span className="truncate">{contact.email || record?.email || '—'}</span>
          </p>
          <p className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <MapPin className="h-3 w-3 shrink-0 text-[var(--text-tertiary)]" />
            <span className="truncate">
              {custom.jurisdiction || custom.city || record?.city || 'Jurisdiction not set'}
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <TagIcon className="h-3 w-3 shrink-0 text-[var(--text-tertiary)]" />
            <span className="truncate">
              {Array.isArray(record?.tags) && record.tags.length > 0
                ? record.tags.map(String).join(', ')
                : 'No tags'}
            </span>
          </p>
          {record?.source && (
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              Source · {record.source}
            </p>
          )}
        </section>

        {/* Deal stage + value */}
        <section className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            Deal stage
          </label>
          <select
            value={leadStage}
            onChange={(e) => {
              setLeadStage(e.target.value)
              void save({ leadStage: e.target.value })
            }}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
          >
            {LEAD_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(Number(e.target.value) || 0)}
              className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              placeholder="Deal value"
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--navy)] px-2 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-3 w-3" />
              Save
            </button>
          </div>
        </section>

        {/* Assigned agent */}
        <section className="space-y-1.5">
          <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            <UserCheck className="h-3 w-3" />
            Assigned agent
          </label>
          <select
            value={assignee}
            onChange={(e) => {
              setAssignee(e.target.value)
              void save({ assignToId: e.target.value || null })
            }}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name || agent.email} ({agent.role})
              </option>
            ))}
          </select>
        </section>

        {/* Next task */}
        <section className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5">
          <div className="flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Next task
            </span>
            {tasks.length > 1 && (
              <span className="ml-auto rounded-full bg-[var(--surface-alt)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-tertiary)]">
                +{tasks.length - 1} open
              </span>
            )}
          </div>

          {nextTask ? (
            <div className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => void completeTask(nextTask.id)}
                className="mt-0.5 shrink-0 text-[var(--text-tertiary)] transition-colors hover:text-emerald-600"
                aria-label="Mark task complete"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--text)]">{nextTask.title}</p>
                <p className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                  <CalendarClock className="h-3 w-3" />
                  {formatDue(nextTask.due_at)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-[var(--text-tertiary)]">No open tasks for this contact.</p>
          )}

          <form onSubmit={addTask} className="flex items-center gap-1.5">
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Add a follow-up task..."
              className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-1 text-[11px] text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={addingTask || !taskTitle.trim()}
              className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-40"
              aria-label="Add task"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>
        </section>

        {/* Staff notes */}
        <section className="space-y-2">
          <div className="flex items-center gap-1.5">
            <StickyNote className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Staff notes
            </span>
          </div>

          <form onSubmit={addNote} className="space-y-1.5">
            <textarea
              rows={2}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Private note for the team..."
              className="w-full resize-none rounded-lg border border-amber-200 bg-amber-50/60 px-2 py-1.5 text-[11px] text-[var(--text)] placeholder:text-amber-800/40 focus:border-amber-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!noteText.trim() || saving}
              className="w-full rounded-lg bg-amber-500 py-1 text-[11px] font-semibold text-white transition-opacity hover:bg-amber-600 disabled:opacity-40"
            >
              Add note
            </button>
          </form>

          <div className="space-y-1.5">
            {notes.slice(0, 5).map((note) => (
              <div key={note.id} className="rounded-lg border border-amber-200 bg-amber-50/60 p-2">
                <p className="whitespace-pre-wrap text-[11px] text-amber-950">{note.body}</p>
                <p className="mt-1 text-[10px] text-amber-700/70">
                  {note.author?.name || 'Agent'} · {formatTimeAgo(note.createdAt)}
                </p>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-[11px] text-[var(--text-tertiary)]">No notes yet.</p>
            )}
          </div>
        </section>

        {/* Recent activity */}
        <section className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
            Recent activity
          </span>
          {events.slice(0, 6).map((ev) => (
            <div key={ev.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text)]">{ev.type}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {ev.actor?.name ? `By ${ev.actor.name}` : 'System'} · {formatTimeAgo(ev.createdAt)}
              </p>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-[11px] text-[var(--text-tertiary)]">No activity recorded yet.</p>
          )}
        </section>
      </div>
    </aside>
  )
}
