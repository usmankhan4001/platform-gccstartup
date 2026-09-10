'use client'

import React, { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, CalendarClock, ChevronsUpDown } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { EmptyState } from '@/components/ui/EmptyState'
import { PIPELINE_STAGES, stageMeta } from './stages'
import type { DealCard } from './pipeline-types'
import type { LeadStatus } from './types'
import { formatCurrency, formatRelative, initialsOf, scoreTone } from './format'

type SortKey = 'title' | 'stage' | 'value' | 'jurisdiction' | 'score' | 'owner' | 'nextTask' | 'createdAt'

const COLUMNS: Array<{ key: SortKey; label: string; className?: string }> = [
  { key: 'title', label: 'Deal' },
  { key: 'stage', label: 'Stage' },
  { key: 'value', label: 'Value', className: 'text-right' },
  { key: 'jurisdiction', label: 'Jurisdiction' },
  { key: 'score', label: 'Score', className: 'text-right' },
  { key: 'owner', label: 'Owner' },
  { key: 'nextTask', label: 'Next task' },
  { key: 'createdAt', label: 'Created', className: 'text-right' },
]

function sortValue(card: DealCard, key: SortKey): string | number {
  switch (key) {
    case 'title':
      return card.title.toLowerCase()
    case 'stage':
      return PIPELINE_STAGES.findIndex((stage) => stage.id === card.stage)
    case 'value':
      return card.value
    case 'jurisdiction':
      return (card.jurisdiction || '').toLowerCase()
    case 'score':
      return card.score
    case 'owner':
      return (card.ownerName || 'zzz').toLowerCase()
    case 'nextTask':
      return card.nextTask?.dueAt ? new Date(card.nextTask.dueAt).getTime() : Number.MAX_SAFE_INTEGER
    case 'createdAt':
      return new Date(card.createdAt).getTime()
    default:
      return 0
  }
}

export function DealsTable({
  cards,
  onOpen,
  onBulkMove,
  bulkBusy,
}: {
  cards: DealCard[]
  onOpen: (id: string, tab?: string) => void
  onBulkMove: (ids: string[], stage: LeadStatus) => void
  bulkBusy: boolean
}) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<string[]>([])
  const [bulkStage, setBulkStage] = useState<LeadStatus>('new')

  const sorted = useMemo(() => {
    const rows = [...cards]
    rows.sort((a, b) => {
      const left = sortValue(a, sortKey)
      const right = sortValue(b, sortKey)
      if (left === right) return a.title.localeCompare(b.title)
      const order = left > right ? 1 : -1
      return sortDir === 'asc' ? order : -order
    })
    return rows
  }, [cards, sortKey, sortDir])

  const allSelected = sorted.length > 0 && selected.length === sorted.length

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir(key === 'title' || key === 'jurisdiction' || key === 'owner' ? 'asc' : 'desc')
  }

  function toggleRow(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  if (cards.length === 0) {
    return (
      <EmptyState
        title="No deals match these filters"
        description="Clear the search box or widen the stage and owner filters to see more of the pipeline."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2">
          <span className="text-xs font-bold text-[var(--text)]">{selected.length} selected</span>
          <select
            aria-label="Bulk move to stage"
            value={bulkStage}
            onChange={(event) => setBulkStage(event.target.value as LeadStatus)}
            className="rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-xs font-semibold text-[var(--text)]"
          >
            {PIPELINE_STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
          <Button size="xs" disabled={bulkBusy} onClick={() => onBulkMove(selected, bulkStage)}>
            {bulkBusy ? 'Moving...' : 'Move to stage'}
          </Button>
          <Button size="xs" variant="ghost" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
              <th className="w-9 px-3 py-2">
                <Checkbox
                  aria-label="Select all deals"
                  checked={allSelected ? true : selected.length > 0 ? 'indeterminate' : false}
                  onCheckedChange={() => setSelected(allSelected ? [] : sorted.map((card) => card.id))}
                />
              </th>
              {COLUMNS.map((column) => {
                const active = sortKey === column.key
                return (
                  <th key={column.key} className={`px-3 py-2 ${column.className ?? ''}`}>
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.06em] transition-colors ${
                        active ? 'text-[var(--text)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text)]'
                      }`}
                    >
                      {column.label}
                      {active ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((card) => {
              const meta = stageMeta(card.stage)
              const isSelected = selected.includes(card.id)
              return (
                <tr
                  key={card.id}
                  onClick={() => onOpen(card.id)}
                  className={`cursor-pointer border-b border-[var(--border)] text-xs transition-colors last:border-b-0 hover:bg-[var(--surface-hover)] ${
                    isSelected ? 'bg-[var(--orange-lt)]' : ''
                  }`}
                >
                  <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      aria-label={`Select ${card.title}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleRow(card.id)}
                    />
                  </td>
                  <td className="max-w-[220px] px-3 py-2">
                    <p className="truncate font-bold text-[var(--text)]">{card.title}</p>
                    <p className="truncate text-[10px] text-[var(--text-tertiary)]">
                      {card.email || card.phone || card.contactName}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    <Badge size="sm" dot style={{ color: meta.color, borderColor: `${meta.color}33` }}>
                      {meta.label}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-[var(--text)]">
                    {formatCurrency(card.value, card.currency)}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2 text-[var(--text-secondary)]">
                    {card.jurisdiction || 'Not set'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Badge size="sm" variant={scoreTone(card.scoreTier)}>
                      {card.score}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px]">
                          {initialsOf(card.ownerName || 'Unassigned')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-[var(--text-secondary)]">{card.ownerName || 'Unassigned'}</span>
                    </span>
                  </td>
                  <td className="max-w-[180px] px-3 py-2">
                    {card.nextTask ? (
                      <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                        <CalendarClock className="h-3 w-3 shrink-0" />
                        <span className="truncate">{card.nextTask.title}</span>
                      </span>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">None</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right text-[var(--text-tertiary)]">
                    {formatRelative(card.createdAt)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
