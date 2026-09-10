'use client'

import React, { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Columns3, RefreshCw, Search, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/ToastProvider'
import { DealsKanban } from './DealsKanban'
import { DealsTable } from './DealsTable'
import { Lead360Drawer } from './Lead360Drawer'
import { PipelineKpiHeader } from './PipelineKpiHeader'
import { PIPELINE_STAGES } from './stages'
import type { DealCard, OwnerOption, PipelineKpis } from './pipeline-types'
import type { LeadStatus } from './types'

type View = 'kanban' | 'table'

export function DealsPipeline({
  initialCards,
  owners,
  kpis,
  loadError,
}: {
  initialCards: DealCard[]
  owners: OwnerOption[]
  kpis: PipelineKpis
  loadError: string | null
}) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const [cards, setCards] = useState<DealCard[]>(initialCards)
  const [view, setView] = useState<View>('kanban')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<'all' | LeadStatus>('all')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')
  const [movingId, setMovingId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [openLeadId, setOpenLeadId] = useState<string | null>(null)
  const [drawerTab, setDrawerTab] = useState('note')

  // Server data wins whenever the route re-renders (after a mutation refresh).
  React.useEffect(() => {
    setCards(initialCards)
  }, [initialCards])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return cards.filter((card) => {
      if (stageFilter !== 'all' && card.stage !== stageFilter) return false
      if (ownerFilter === 'unassigned' && card.ownerId) return false
      if (ownerFilter !== 'all' && ownerFilter !== 'unassigned' && card.ownerId !== ownerFilter) return false
      if (!needle) return true
      return [card.title, card.contactName, card.email, card.phone, card.jurisdiction, card.tradeLicenseNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [cards, search, stageFilter, ownerFilter])

  function refresh() {
    startTransition(() => router.refresh())
  }

  async function moveCard(card: DealCard, stage: LeadStatus) {
    setMovingId(card.id)
    const previous = cards
    setCards((current) => current.map((item) => (item.id === card.id ? { ...item, stage } : item)))
    try {
      const res = await fetch(`/api/crm/leads/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: stage, stage }),
      })
      const payload = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(payload.error || 'Could not move this deal')
      const label = PIPELINE_STAGES.find((item) => item.id === stage)?.label ?? stage
      toast.success(`${card.title} moved to ${label}.`)
      refresh()
    } catch (error) {
      setCards(previous)
      toast.error(error instanceof Error ? error.message : 'Could not move this deal')
    } finally {
      setMovingId(null)
    }
  }

  async function bulkMove(ids: string[], stage: LeadStatus) {
    if (ids.length === 0) return
    setBulkBusy(true)
    const previous = cards
    setCards((current) => current.map((item) => (ids.includes(item.id) ? { ...item, stage } : item)))
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids, status: stage, stage }),
      })
      const payload = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(payload.error || 'Could not move these deals')
      toast.success(`${ids.length} deal${ids.length === 1 ? '' : 's'} moved.`)
      refresh()
    } catch (error) {
      setCards(previous)
      toast.error(error instanceof Error ? error.message : 'Could not move these deals')
    } finally {
      setBulkBusy(false)
    }
  }

  function openLead(id: string, tab = 'note') {
    setDrawerTab(tab)
    setOpenLeadId(id)
  }

  return (
    <div className="space-y-4">
      <PipelineKpiHeader kpis={kpis} />

      {loadError && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--danger-border)] bg-[var(--danger-lt)] px-4 py-3 text-xs text-[var(--danger)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-bold">{loadError}</p>
            <p className="mt-0.5 text-[var(--text-secondary)]">
              The board is showing an empty state until the connection is restored.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, contact, email, jurisdiction..."
            aria-label="Search deals"
            className="w-full rounded-full border border-[var(--border)] bg-white py-2 pl-9 pr-3 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <select
          aria-label="Filter by stage"
          value={stageFilter}
          onChange={(event) => setStageFilter(event.target.value as 'all' | LeadStatus)}
          className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)]"
        >
          <option value="all">All stages</option>
          {PIPELINE_STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by owner"
          value={ownerFilter}
          onChange={(event) => setOwnerFilter(event.target.value)}
          className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)]"
        >
          <option value="all">All owners</option>
          <option value="unassigned">Unassigned</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-white p-1">
          <button
            type="button"
            onClick={() => setView('kanban')}
            aria-pressed={view === 'kanban'}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
              view === 'kanban' ? 'bg-[var(--navy)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Columns3 className="h-3.5 w-3.5" /> Kanban
          </button>
          <button
            type="button"
            onClick={() => setView('table')}
            aria-pressed={view === 'table'}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
              view === 'table' ? 'bg-[var(--navy)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Table2 className="h-3.5 w-3.5" /> Table
          </button>
        </div>

        <Button variant="secondary" size="sm" onClick={refresh} disabled={isPending}>
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <p className="text-[11px] text-[var(--text-tertiary)]">
        Showing {filtered.length} of {cards.length} deals
      </p>

      {view === 'kanban' ? (
        <DealsKanban cards={filtered} movingId={movingId} onOpen={openLead} onMove={moveCard} />
      ) : (
        <DealsTable cards={filtered} onOpen={openLead} onBulkMove={bulkMove} bulkBusy={bulkBusy} />
      )}

      {!loadError && cards.length === 0 && (
        <EmptyState
          title="No deals yet"
          description="Formation inquiries and paid applications appear here automatically. Create a deal to start tracking pipeline value and forecast."
        />
      )}

      {openLeadId && (
        <Lead360Drawer
          leadId={openLeadId}
          open
          initialTab={drawerTab}
          onClose={() => setOpenLeadId(null)}
          onUpdated={refresh}
        />
      )}
    </div>
  )
}
