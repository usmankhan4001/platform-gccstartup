'use client'

import React, { useEffect, useRef, useState } from 'react'
import { CalendarClock, GripVertical, Layers, MapPin, ShieldCheck } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PIPELINE_STAGES, stageMeta } from './stages'
import type { DealCard } from './pipeline-types'
import type { LeadStatus } from './types'
import { formatCurrency, initialsOf, scoreTone, toAed } from './format'

const DRAG_THRESHOLD = 6

function stageUnderPoint(x: number, y: number): LeadStatus | null {
  const el = document.elementFromPoint(x, y)
  const section = el?.closest?.('[data-stage]') as HTMLElement | null
  return (section?.dataset.stage as LeadStatus | undefined) ?? null
}

function taskTone(dueAt: string | null): { className: string; label: string } {
  if (!dueAt) return { className: 'text-[var(--text-tertiary)]', label: 'No due date' }
  const days = Math.ceil((new Date(dueAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  if (days < 0) return { className: 'text-[var(--danger)]', label: `${Math.abs(days)}d overdue` }
  if (days === 0) return { className: 'text-[var(--warning)]', label: 'Due today' }
  if (days === 1) return { className: 'text-[var(--warning)]', label: 'Due tomorrow' }
  return { className: 'text-[var(--text-tertiary)]', label: `in ${days}d` }
}

export function DealsKanban({
  cards,
  movingId,
  onOpen,
  onMove,
}: {
  cards: DealCard[]
  movingId: string | null
  onOpen: (id: string, tab?: string) => void
  onMove: (card: DealCard, stage: LeadStatus) => void
}) {
  const [overStage, setOverStage] = useState<LeadStatus | null>(null)
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const dragStart = useRef<{ x: number; y: number; id: string; active: boolean } | null>(null)

  useEffect(() => {
    if (!drag) return
    const cancel = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dragStart.current = null
        setDrag(null)
        setOverStage(null)
      }
    }
    document.addEventListener('keydown', cancel)
    return () => document.removeEventListener('keydown', cancel)
  }, [drag])

  function commitMove(leadId: string, stage: LeadStatus | null) {
    if (!stage) return
    const card = cards.find((item) => item.id === leadId)
    if (card && card.stage !== stage) onMove(card, stage)
  }

  function onGripPointerDown(event: React.PointerEvent, id: string) {
    if (movingId === id) return
    event.stopPropagation()
    dragStart.current = { x: event.clientX, y: event.clientY, id, active: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onGripPointerMove(event: React.PointerEvent) {
    const start = dragStart.current
    if (!start) return
    if (!start.active) {
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < DRAG_THRESHOLD) return
      start.active = true
    }
    setDrag({ id: start.id, x: event.clientX, y: event.clientY })
    setOverStage(stageUnderPoint(event.clientX, event.clientY))
  }

  function onGripPointerUp(event: React.PointerEvent) {
    const start = dragStart.current
    dragStart.current = null
    if (start?.active) commitMove(start.id, stageUnderPoint(event.clientX, event.clientY))
    setDrag(null)
    setOverStage(null)
  }

  const draggedCard = drag ? cards.find((item) => item.id === drag.id) : undefined

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No deals in the pipeline"
        description="New inquiries and formation orders land here automatically. Create a deal to start tracking forecast value."
      />
    )
  }

  return (
    <div className="relative">
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ minHeight: '520px' }}
        aria-label="Formation deals pipeline"
      >
        {PIPELINE_STAGES.map((stage) => {
          const stageCards = cards.filter((card) => card.stage === stage.id)
          const totalValue = stageCards.reduce((sum, card) => sum + toAed(card.value, card.currency), 0)
          const isOver = overStage === stage.id

          return (
            <section
              key={stage.id}
              data-stage={stage.id}
              onDragOver={(event) => {
                event.preventDefault()
                setOverStage(stage.id)
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOverStage(null)
              }}
              onDrop={(event) => {
                event.preventDefault()
                setOverStage(null)
                const id = drag?.id ?? event.dataTransfer.getData('text/plain') ?? ''
                commitMove(id, stage.id)
              }}
              className={`flex w-[300px] shrink-0 flex-col rounded-xl border bg-[var(--surface-alt)] transition-colors ${
                isOver ? 'border-[var(--navy)] ring-2 ring-[rgba(10,20,47,0.12)]' : 'border-[var(--border)]'
              }`}
            >
              <header className="shrink-0 rounded-t-xl border-b border-[var(--border)] bg-white px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} />
                    <h3 className="truncate text-[11px] font-bold uppercase tracking-wide text-[var(--text)]">
                      {stage.label}
                    </h3>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--surface-hover)] px-1.5 text-[10px] font-black text-[var(--text-secondary)]">
                      {stageCards.length}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] font-bold text-[var(--green-dk)]">
                    {formatCurrency(totalValue, 'AED')}
                  </span>
                </div>
                <p className="mt-1 truncate pl-[18px] text-[10px] text-[var(--text-tertiary)]">{stage.cue}</p>
              </header>

              <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                {stageCards.length === 0 && (
                  <p className="rounded-lg border border-dashed border-[var(--border)] px-3 py-6 text-center text-[11px] text-[var(--text-tertiary)]">
                    Drop a deal here
                  </p>
                )}

                {stageCards.map((card) => {
                  const meta = stageMeta(card.stage)
                  const task = taskTone(card.nextTask?.dueAt ?? null)
                  const isMoving = movingId === card.id
                  const isDragging = drag?.id === card.id

                  return (
                    <article
                      key={card.id}
                      draggable={!isMoving}
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', card.id)
                        event.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => setOverStage(null)}
                      onClick={() => onOpen(card.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onOpen(card.id)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ${card.title}`}
                      className={`cursor-pointer rounded-lg border border-[var(--border)] bg-white p-2.5 shadow-xs transition-all hover:border-[var(--border-hover)] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                        isDragging ? 'opacity-40' : ''
                      } ${isMoving ? 'animate-pulse' : ''}`}
                      style={{ borderLeft: `3px solid ${meta.color}` }}
                    >
                      <div className="flex items-start gap-1.5">
                        <span
                          role="button"
                          tabIndex={-1}
                          aria-label={`Drag ${card.title}`}
                          onPointerDown={(event) => onGripPointerDown(event, card.id)}
                          onPointerMove={onGripPointerMove}
                          onPointerUp={onGripPointerUp}
                          onClick={(event) => event.stopPropagation()}
                          className="mt-0.5 cursor-grab touch-none text-[var(--text-tertiary)] active:cursor-grabbing"
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-xs font-bold leading-tight text-[var(--text)]">{card.title}</p>
                            <Badge size="sm" variant={scoreTone(card.scoreTier)}>
                              {card.score}
                            </Badge>
                          </div>
                          {card.company && card.contactName !== card.company && (
                            <p className="truncate text-[10px] text-[var(--text-tertiary)]">{card.contactName}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-[var(--text)]">
                          {formatCurrency(card.value, card.currency)}
                        </span>
                        {card.jurisdiction && (
                          <span className="flex min-w-0 items-center gap-1 truncate text-[10px] text-[var(--text-secondary)]">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{card.jurisdiction}</span>
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[9px]">
                              {initialsOf(card.ownerName || 'Unassigned')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-[10px] text-[var(--text-secondary)]">
                            {card.ownerName || 'Unassigned'}
                          </span>
                        </div>

                        {card.nextTask ? (
                          <span
                            className={`flex shrink-0 items-center gap-1 text-[10px] font-semibold ${task.className}`}
                            title={card.nextTask.title}
                          >
                            <CalendarClock className="h-3 w-3" />
                            {task.label}
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] text-[var(--text-tertiary)]">No open task</span>
                        )}
                      </div>

                      {(card.kycStatus || card.tradeLicenseNumber) && (
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                          {card.kycStatus && (
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              {String(card.kycStatus).replace(/_/g, ' ')}
                            </span>
                          )}
                          {card.tradeLicenseNumber && (
                            <span className="truncate font-mono">{card.tradeLicenseNumber}</span>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {draggedCard && drag && (
        <div
          className="pointer-events-none fixed z-[60] w-[280px] rounded-lg border border-[var(--navy)] bg-white p-2.5 shadow-lg"
          style={{ left: drag.x + 12, top: drag.y + 12, maxWidth: '280px' }}
        >
          <p className="truncate text-xs font-bold text-[var(--text)]">{draggedCard.title}</p>
          <p className="mt-1 font-mono text-[11px] font-black text-[var(--text)]">
            {formatCurrency(draggedCard.value, draggedCard.currency)}
          </p>
        </div>
      )}
    </div>
  )
}
