'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  GripVertical,
  Mail,
  MessageSquare,
  MoveRight,
  Plus,
  Send,
  Sparkles,
  UserRound,
  Zap,
  MapPin,
  Clock3,
  AlertCircle,
  Phone,
} from 'lucide-react'
import { calculateLeadScore, resolveDeskTag, resolveEstimatedDealValue } from '@/lib/crm/scoring'
import { formatMoney, formatShortDate, isOverdue, type CRMLead, userLabel, type LeadStatus } from './types'

// The canonical stage list lives in `./stages` so the board, the 360 drawer and
// the KPI forecast all weight the same columns. Re-exported for existing callers.
import { PIPELINE_STAGES } from './stages'

export { PIPELINE_STAGES }

const DRAG_THRESHOLD = 6

function stageUnderPoint(x: number, y: number): LeadStatus | null {
  const el = document.elementFromPoint(x, y)
  const section = el?.closest?.('[data-stage]') as HTMLElement | null
  return (section?.dataset.stage as LeadStatus | undefined) ?? null
}

export function PipelineBoard({
  leads,
  movingId,
  onOpen,
  onMove,
  onQuickWhatsApp,
  onQuickEmail,
  onQuickTask,
}: {
  leads: CRMLead[]
  movingId: string | null
  onOpen: (id: string, initialTab?: string) => void
  onMove: (lead: CRMLead, status: LeadStatus) => void
  onQuickWhatsApp?: (lead: CRMLead) => void
  onQuickEmail?: (lead: CRMLead) => void
  onQuickTask?: (lead: CRMLead) => void
}) {
  const [overStage, setOverStage] = useState<LeadStatus | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const dragStart = useRef<{ x: number; y: number; id: string; active: boolean } | null>(null)

  useEffect(() => {
    if (!menuFor) return
    const close = () => setMenuFor(null)
    document.addEventListener('pointerdown', close, true)
    return () => document.removeEventListener('pointerdown', close, true)
  }, [menuFor])

  function commitMove(leadId: string, stage: LeadStatus | null) {
    if (!stage) return
    const lead = leads.find((item) => item.id === leadId)
    if (lead && (lead.status || 'new') !== stage) {
      onMove(lead, stage)
    }
  }

  function onGripPointerDown(event: React.PointerEvent, leadId: string) {
    if (movingId === leadId) return
    event.stopPropagation()
    dragStart.current = { x: event.clientX, y: event.clientY, id: leadId, active: false }
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
    if (!start) return
    if (start.active) {
      commitMove(start.id, stageUnderPoint(event.clientX, event.clientY))
    }
    setDrag(null)
    setOverStage(null)
  }

  const draggedLead = drag ? leads.find((item) => item.id === drag.id) : undefined

  return (
    <div
      className="crm-pipeline"
      aria-label="Formation Deals Pipeline"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, minmax(280px, 1fr))`,
        gap: '12px',
        overflowX: 'auto',
        padding: '16px',
        minHeight: '680px',
        backgroundColor: '#F8FAFC',
      }}
    >
      {PIPELINE_STAGES.map((stage) => {
        const stageLeads = leads.filter((lead) => {
          const s = (lead.status || 'new').toLowerCase()
          if (stage.id === 'won' && (s === 'won' || s === 'closed')) return true
          if (stage.id === 'kyc_processing' && (s === 'kyc_processing' || s === 'kyc_review' || s === 'kyc_received')) return true
          return s === stage.id
        })

        const totalStageValue = stageLeads.reduce((sum, lead) => {
          const val = resolveEstimatedDealValue(lead)
          return sum + val.value
        }, 0)

        const isOver = overStage === stage.id

        return (
          <section
            key={stage.id}
            data-stage={stage.id}
            className={`crm-stage-column rounded-xl border transition-all duration-150 flex flex-col ${
              isOver ? 'border-[#0A142F] bg-blue-50/50 shadow-md ring-2 ring-blue-500/20' : 'border-slate-200 bg-white/80'
            }`}
            style={{ minWidth: '280px', maxHeight: 'calc(100vh - 220px)' }}
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
              const id = drag?.id ?? event.dataTransfer?.getData('text/lead-id') ?? ''
              commitMove(id, stage.id)
            }}
          >
            {/* Stage Column Header */}
            <header className="p-3.5 border-b border-slate-100 bg-white rounded-t-xl shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-bold text-xs text-[#0A142F] uppercase tracking-wide truncate">
                    {stage.label}
                  </h3>
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-black text-slate-600">
                    {stageLeads.length}
                  </span>
                </div>

                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {formatMoney(totalStageValue, 'USD') || '$0'}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400 truncate pl-4.5">
                {stage.cue}
              </p>
            </header>

            {/* Stage Cards Scroll Area */}
            <div className="flex-1 p-2.5 overflow-y-auto space-y-2.5 min-h-[140px]">
              {stageLeads.map((lead) => {
                const scoreInfo = calculateLeadScore(lead)
                const desk = resolveDeskTag(lead)
                const dealVal = resolveEstimatedDealValue(lead)
                const overdue = !['won', 'closed', 'lost'].includes(stage.id) && isOverdue(lead.next_follow_up_at)
                const isMoving = movingId === lead.id
                const isDragging = drag?.id === lead.id

                const tierBg =
                  scoreInfo.tier === 'VIP'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : scoreInfo.tier === 'High'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : scoreInfo.tier === 'Medium'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'

                const deskBg =
                  desk === 'Riyadh Desk'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : desk === 'APAC Desk'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'

                return (
                  <div
                    key={lead.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${lead.name || 'Lead'} — ${stage.label}`}
                    className={`group relative rounded-xl border bg-white p-3.5 shadow-2xs transition-all duration-150 select-none cursor-pointer hover:shadow-md hover:border-slate-300 ${
                      overdue ? 'border-l-4 border-l-red-500' : 'border-slate-200'
                    } ${isMoving ? 'opacity-40 pointer-events-none' : ''} ${
                      isDragging ? 'opacity-25 border-dashed border-blue-400' : ''
                    }`}
                    draggable={!isMoving}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/lead-id', lead.id)
                    }}
                    onClick={() => onOpen(lead.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onOpen(lead.id)
                      }
                    }}
                  >
                    {/* Grip handle for mobile / touch */}
                    <span
                      className="absolute right-2 top-2 p-1 text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing"
                      aria-hidden="true"
                      style={{ touchAction: 'none' }}
                      onPointerDown={(event) => onGripPointerDown(event, lead.id)}
                      onPointerMove={onGripPointerMove}
                      onPointerUp={onGripPointerUp}
                      onPointerCancel={onGripPointerUp}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <GripVertical size={13} />
                    </span>

                    {/* Topline: Desk Badge & AI Lead Score */}
                    <div className="flex items-center gap-1.5 flex-wrap pr-6 mb-2">
                      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold border ${deskBg}`}>
                        <MapPin size={9} /> {desk}
                      </span>

                      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-black border ${tierBg}`}>
                        <Sparkles size={9} /> {scoreInfo.tier} {scoreInfo.score}
                      </span>

                      {lead.order_number && (
                        <span className="text-[9px] font-mono font-semibold text-slate-400">
                          {lead.order_number}
                        </span>
                      )}
                    </div>

                    {/* Lead Name */}
                    <div className="font-bold text-xs text-[#0A142F] leading-tight group-hover:text-blue-600 transition-colors">
                      {lead.name || 'Unnamed Formation Prospect'}
                    </div>

                    {/* Proposed Company Name / Incorporation */}
                    {(lead.company_name_choice_1 || lead.company) && (
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-slate-600 truncate">
                        <Building2 size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate">{lead.company_name_choice_1 || lead.company}</span>
                      </div>
                    )}

                    {/* Jurisdiction Badge */}
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600">
                        {lead.jurisdiction || lead.country || 'UAE · IFZA Freezone'}
                      </span>
                      {lead.package_type && (
                        <span className="text-slate-400 truncate">
                          • {lead.package_type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    {/* Financial Value & Payment Status */}
                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                      <div className="flex items-center gap-1 font-bold text-[#0A142F]">
                        <CircleDollarSign size={13} className="text-emerald-600" />
                        <span>{formatMoney(dealVal.value, dealVal.currency)}</span>
                      </div>

                      {lead.payment_status === 'paid' ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={10} /> Paid
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Retainer Pending
                        </span>
                      )}
                    </div>

                    {/* Footer Row: Assignee & Next Follow-Up */}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 truncate max-w-[120px]">
                        <UserRound size={11} />
                        <span className="truncate">{userLabel(lead.assigned_to)}</span>
                      </span>

                      <span className={`flex items-center gap-1 font-semibold ${overdue ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                        <CalendarClock size={11} />
                        {overdue ? 'Overdue' : formatShortDate(lead.next_follow_up_at, false)}
                      </span>
                    </div>

                    {/* 1-Click Quick Actions Floating Toolbar on Hover */}
                    <div
                      className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 opacity-90 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        {/* Quick WhatsApp Action */}
                        <button
                          type="button"
                          title="Quick WhatsApp Outreach"
                          className="flex h-6 w-6 items-center justify-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs"
                          onClick={() => {
                            if (onQuickWhatsApp) onQuickWhatsApp(lead)
                            else onOpen(lead.id, 'whatsapp')
                          }}
                        >
                          <MessageSquare size={11} />
                        </button>

                        {/* Quick Email Action */}
                        <button
                          type="button"
                          title="Quick Email Dispatch"
                          className="flex h-6 w-6 items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-2xs"
                          onClick={() => {
                            if (onQuickEmail) onQuickEmail(lead)
                            else onOpen(lead.id, 'email')
                          }}
                        >
                          <Mail size={11} />
                        </button>

                        {/* Quick Task Action */}
                        <button
                          type="button"
                          title="Schedule Follow-up Task"
                          className="flex h-6 w-6 items-center justify-center rounded bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-2xs"
                          onClick={() => {
                            if (onQuickTask) onQuickTask(lead)
                            else onOpen(lead.id, 'task')
                          }}
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      {/* 1-Click Quick Stage Move Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-[#0A142F] hover:text-white transition-all shadow-2xs"
                          title="Move stage"
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuFor(menuFor === lead.id ? null : lead.id)
                          }}
                        >
                          <span>Move</span>
                          <MoveRight size={10} />
                        </button>

                        {menuFor === lead.id && (
                          <div
                            className="absolute right-0 bottom-full mb-1 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-left"
                            role="menu"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              Move to Stage
                            </div>
                            {PIPELINE_STAGES.filter((s) => s.id !== stage.id).map((target) => (
                              <button
                                key={target.id}
                                type="button"
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#0A142F] transition-colors"
                                onClick={() => {
                                  setMenuFor(null)
                                  commitMove(lead.id, target.id)
                                }}
                              >
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: target.color }}
                                />
                                <span className="truncate">{target.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {stageLeads.length === 0 && (
                <div className="flex h-24 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center p-3 text-[11px] text-slate-400">
                  <span>Drop deal here</span>
                </div>
              )}
            </div>
          </section>
        )
      })}

      {/* Floating Ghost during Pointer drag */}
      {drag && draggedLead && (
        <div
          className="fixed pointer-events-none z-50 rounded-xl bg-[#0A142F] text-white p-3 shadow-2xl text-xs font-bold ring-4 ring-blue-500/30"
          style={{ left: drag.x + 12, top: drag.y + 12, maxWidth: '240px' }}
          aria-hidden="true"
        >
          <div className="flex items-center gap-1.5 text-amber-400 text-[10px]">
            <Sparkles size={10} /> Moving Deal
          </div>
          <div className="truncate mt-0.5">{draggedLead.name || 'Unnamed Prospect'}</div>
          <div className="text-[10px] text-slate-300 font-mono mt-0.5">
            {formatMoney(resolveEstimatedDealValue(draggedLead).value, 'USD')}
          </div>
        </div>
      )}
    </div>
  )
}
