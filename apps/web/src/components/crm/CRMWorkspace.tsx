'use client'

import { useDeferredValue, useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownUp,
  CalendarClock,
  Columns3,
  List,
  RefreshCw,
  Search,
  UserRound,
  UsersRound,
  WalletCards,
  Workflow,
  Zap,
  Building2,
  Sparkles,
  Layers,
} from 'lucide-react'
import type { DirectusUserSummary } from '@/lib/directus'
import { useToast } from '@/components/ui/ToastProvider'
import { LeadDrawer } from './LeadDrawer'
import { PipelineBoard } from './PipelineBoard'
import { TasksView } from './TasksView'
import { AutomationsView } from './AutomationsView'

import { AutomationBuilder } from '@/components/admin/automation/AutomationBuilder'
import { crmFetch, formatMoney, formatShortDate, isOverdue, type CRMLead, type CRMTask, userLabel, type LeadStatus } from './types'
import { createAbortController } from '@/lib/abort'

type View = 'pipeline' | 'renewals' | 'list' | 'tasks' | 'automations' | 'builder'

export function CRMWorkspace() {
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [tasks, setTasks] = useState<CRMTask[]>([])
  const [users, setUsers] = useState<DirectusUserSummary[]>([])
  const [view, setView] = useState<View>('pipeline')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [assignedTo, setAssignedTo] = useState('all')
  const [followUp, setFollowUp] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [hasNext, setHasNext] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [initialDrawerTab, setInitialDrawerTab] = useState<string>('note')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [movingId, setMovingId] = useState<string | null>(null)
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)
  const [leadRefresh, setLeadRefresh] = useState(0)
  const [taskRefresh, setTaskRefresh] = useState(0)
  const { success: showSuccess, error: showError } = useToast()

  useEffect(() => {
    crmFetch<{ users: DirectusUserSummary[] }>('/api/crm/users')
      .then((result) => setUsers(result.users))
      .catch((error) => showError(error instanceof Error ? error.message : 'Could not load assignees'))
  }, [showError])

  useEffect(() => {
    const controller = createAbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setLoadError('')
      const params = new URLSearchParams({
        q: deferredSearch,
        status,
        priority,
        assigned_to: assignedTo,
        follow_up: followUp,
        sort,
        page: String(page),
        page_size: String(pageSize),
      })
      try {
        const result = await crmFetch<{ leads: CRMLead[]; hasNext: boolean }>(`/api/crm/leads?${params}`, { signal: controller.signal })
        setLeads(result.leads)
        setHasNext(result.hasNext)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setLoadError(error instanceof Error ? error.message : 'Could not load CRM leads')
      } finally {
        if (!controller.signal?.aborted) setLoading(false)
      }
    }, 180)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [deferredSearch, status, priority, assignedTo, followUp, sort, page, pageSize, leadRefresh])

  useEffect(() => {
    crmFetch<{ tasks: CRMTask[] }>('/api/crm/tasks?status=active')
      .then((result) => setTasks(result.tasks))
      .catch((error) => showError(error instanceof Error ? error.message : 'Could not load CRM tasks'))
  }, [taskRefresh, showError])

  async function moveLead(lead: CRMLead, nextStatus: LeadStatus) {
    setMovingId(lead.id)
    try {
      const result = await crmFetch<{ lead: CRMLead; data?: CRMLead }>(`/api/crm/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, stage: nextStatus }),
      })
      const updated = result.lead || result.data
      setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, ...updated, status: nextStatus } : item)))
      showSuccess(`${lead.name || 'Lead'} moved to ${nextStatus.replace(/_/g, ' ')}.`)
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not move lead')
    } finally {
      setMovingId(null)
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
      setTasks((current) => current.filter((item) => item.id !== task.id))
      showSuccess('Task completed.')
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not complete task')
    } finally {
      setBusyTaskId(null)
    }
  }

  function updateLead(updated: CRMLead) {
    setLeads((current) => current.map((lead) => (lead.id === updated.id ? { ...lead, ...updated } : lead)))
  }

  function handleOpenDrawer(id: string, tab: string = 'note') {
    setSelectedLeadId(id)
    setInitialDrawerTab(tab)
  }

  const activeLeads = leads.filter((lead) => !['won', 'closed', 'lost'].includes(lead.status || 'new'))
  const overdueCount = activeLeads.filter((lead) => isOverdue(lead.next_follow_up_at)).length
  const unassignedCount = activeLeads.filter((lead) => !lead.assigned_to && !lead.owner_id).length
  const pipelineValue = activeLeads.reduce((sum, lead) => sum + Number(lead.deal_value || lead.estimated_value || 5800), 0)

  return (
    <>
      <section className="crm-command-strip" aria-label="CRM summary" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div><span className="crm-metric-icon"><UsersRound size={18} /></span><span><strong>{activeLeads.length}</strong>Open Formation Deals</span></div>
        <div className={overdueCount ? 'is-alert' : ''}><span className="crm-metric-icon"><CalendarClock size={18} /></span><span><strong>{overdueCount}</strong>Overdue follow-ups</span></div>
        <div><span className="crm-metric-icon"><UserRound size={18} /></span><span><strong>{unassignedCount}</strong>Unassigned</span></div>
        <div><span className="crm-metric-icon"><WalletCards size={18} /></span><span><strong>{formatMoney(pipelineValue, 'USD') || '$0'}</strong>Pipeline Value</span></div>
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', cursor: 'pointer' }} onClick={() => setView('renewals')}>
          <span className="crm-metric-icon" style={{ background: '#10B981', color: '#fff' }}><CalendarClock size={18} /></span>
          <span><strong style={{ color: '#10B981', fontSize: 15 }}>Renewal Ledger</strong><span>60d/30d/7d triggers</span></span>
        </div>
      </section>

      <section className="crm-workspace-panel">
        <div className="crm-viewbar">
          <div className="crm-view-tabs" role="tablist" aria-label="CRM views">
            <button type="button" className={view === 'pipeline' ? 'active' : ''} onClick={() => setView('pipeline')}><Columns3 size={15} />Pipeline Board</button>
            <button type="button" className={view === 'renewals' ? 'active' : ''} onClick={() => setView('renewals')}><CalendarClock size={15} />Renewal Ledger</button>
            <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={15} />List Directory</button>
            <button type="button" className={view === 'tasks' ? 'active' : ''} onClick={() => setView('tasks')}><CheckSquareIcon />Tasks<span>{tasks.length}</span></button>
            <button type="button" className={view === 'automations' ? 'active' : ''} onClick={() => setView('automations')}><Zap size={15} />Automations</button>
            <button type="button" className={view === 'builder' ? 'active' : ''} onClick={() => setView('builder')}><Workflow size={15} />Builder</button>
          </div>
          <button type="button" className="crm-refresh" onClick={() => { setLeadRefresh((value) => value + 1); setTaskRefresh((value) => value + 1) }} aria-label="Refresh CRM"><RefreshCw size={15} /></button>
        </div>

        {view !== 'renewals' && view !== 'tasks' && view !== 'automations' && view !== 'builder' && (
          <div className="crm-filters">
            <label className="crm-search"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search name, email, phone, company, jurisdiction…" /><span>{loading ? 'Searching' : `Page ${page}`}</span></label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by stage">
              <option value="all">All stages</option>
              {[
                { id: 'new', label: 'New Lead' },
                { id: 'paid_application', label: 'Paid App' },
                { id: 'kyc_processing', label: 'KYC Review' },
                { id: 'applied', label: 'Applied' },
                { id: 'registered', label: 'Registered' },
                { id: 'banking_filed', label: 'Banking Filed' },
                { id: 'won', label: 'Closed Won' },
                { id: 'lost', label: 'Closed Lost' },
              ].map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Filter by priority"><option value="all">All priorities</option>{['urgent', 'high', 'normal', 'low'].map((item) => <option key={item}>{item}</option>)}</select>
            <select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} aria-label="Filter by owner"><option value="all">All owners</option><option value="unassigned">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{userLabel(user)}</option>)}</select>
            <select value={followUp} onChange={(event) => setFollowUp(event.target.value)} aria-label="Filter by follow-up"><option value="all">Any follow-up</option><option value="overdue">Overdue</option><option value="today">Due today</option><option value="upcoming">Upcoming</option><option value="none">Not scheduled</option></select>
            <label className="crm-sort"><ArrowDownUp size={14} /><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }} aria-label="Sort leads"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="followup">Follow-up</option><option value="value">Highest value</option></select></label>
          </div>
        )}

        {loadError && view !== 'renewals' && view !== 'tasks' && view !== 'automations' && view !== 'builder' && <div className="crm-load-error"><AlertTriangle size={18} /><span><strong>Could not load the pipeline.</strong>{loadError}</span></div>}
        {loading && view !== 'renewals' && view !== 'tasks' && view !== 'automations' && view !== 'builder' && <div className="crm-loading"><span className="crm-spinner" />Loading pipeline…</div>}

        {!loading && !loadError && view === 'pipeline' && (
          <PipelineBoard
            leads={leads}
            movingId={movingId}
            onOpen={handleOpenDrawer}
            onMove={moveLead}
            onQuickWhatsApp={(lead) => handleOpenDrawer(lead.id, 'whatsapp')}
            onQuickEmail={(lead) => handleOpenDrawer(lead.id, 'email')}
            onQuickTask={(lead) => handleOpenDrawer(lead.id, 'task')}
          />
        )}

        {view === 'renewals' && (
          <div className="crm-empty-panel">
            <CalendarClock size={22} />
            <strong>The renewal ledger has its own page</strong>
            <span>
              It now loads compliance dates straight from the database.{' '}
              <a href="/crm/renewals" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                Open the renewal ledger
              </a>
            </span>
          </div>
        )}

        {!loading && !loadError && view === 'list' && (
          <div className="crm-list card">
            {leads.length ? (
              <>
                <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Lead</th><th>Stage</th><th>Desk &amp; Owner</th><th>Priority</th><th>Follow-up</th><th>Value</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id} onClick={() => handleOpenDrawer(lead.id)}><td><strong>{lead.name || 'Unnamed lead'}</strong><span>{lead.company || lead.email || lead.phone || 'No contact details'}</span></td><td><span className={`crm-stage-badge crm-stage-badge-${lead.status || 'new'}`}>{(lead.status || 'new').replace(/_/g, ' ')}</span></td><td>{lead.desk || 'Dubai Desk'} · {userLabel(lead.assigned_to)}</td><td><span className={`crm-priority crm-priority-${lead.priority || 'normal'}`}>{lead.priority || 'normal'}</span></td><td className={isOverdue(lead.next_follow_up_at) ? 'crm-due-overdue' : ''}>{formatShortDate(lead.next_follow_up_at, true)}</td><td>{formatMoney(lead.deal_value || lead.estimated_value, lead.currency || 'USD') || '—'}</td></tr>)}</tbody></table></div>
                <div className="crm-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0' }}>
                  <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ opacity: page <= 1 ? 0.4 : 1 }}>Previous</button>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page}</span>
                  <button type="button" disabled={!hasNext} onClick={() => setPage((p) => p + 1)} style={{ opacity: hasNext ? 1 : 0.4 }}>Next</button>
                  <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }} aria-label="Leads per page" style={{ marginLeft: 'var(--space-2)' }}>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
              </>
            ) : <div className="crm-empty-panel"><Search size={22} /><strong>No formation deals match these filters</strong><span>Clear a filter or try a broader search.</span></div>}
          </div>
        )}
        {view === 'tasks' && <TasksView tasks={tasks} busyId={busyTaskId} onComplete={completeTask} onOpenLead={(id) => handleOpenDrawer(id, 'task')} />}
        {view === 'automations' && <AutomationsView />}
        {view === 'builder' && <AutomationBuilder />}
      </section>

      {selectedLeadId && (
        <LeadDrawer
          leadId={selectedLeadId}
          open={Boolean(selectedLeadId)}
          initialTab={initialDrawerTab}
          users={users}
          onClose={() => setSelectedLeadId(null)}
          onLeadUpdated={updateLead}
          onTasksChanged={() => setTaskRefresh((value) => value + 1)}
        />
      )}
    </>
  )
}

function CheckSquareIcon() {
  return <span className="crm-check-icon" aria-hidden="true"><span /></span>
}
