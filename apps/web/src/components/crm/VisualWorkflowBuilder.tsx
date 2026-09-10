'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  MessageSquare,
  Building2,
  CalendarCheck,
  Tag,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Plus,
  Sliders,
  ChevronRight,
  FileCode,
  ShieldCheck,
  Check,
  Copy,
  Bug,
  SkipForward,
  RotateCcw,
  Eye,
  Settings,
  Database,
  Users,
  GitBranch,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastProvider'

// ==========================================
// 1. CUSTOM REACT FLOW NODE COMPONENTS
// ==========================================

// Trigger Node
export function TriggerNode({ data, selected }: { data: Record<string, any>; selected?: boolean }) {
  const isExecuting = data.isExecuting
  const isPassed = data.isPassed

  return (
    <div
      className={`w-72 rounded-2xl border bg-[var(--surface)] p-4 shadow-lg transition-all duration-300 ${
        isExecuting
          ? 'ring-4 ring-blue-500 ring-offset-2 border-blue-500 shadow-blue-500/20'
          : isPassed
          ? 'border-emerald-500 shadow-emerald-500/10'
          : selected
          ? 'border-[var(--navy)] ring-2 ring-[var(--navy)]'
          : 'border-[var(--border)]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-[var(--orange)] border border-orange-500/20">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--orange)] block">
              TRIGGER EVENT
            </span>
            <span className="text-xs font-bold text-[var(--text)]">{data.label || 'Trigger'}</span>
          </div>
        </div>
        {isPassed && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
            <Check className="h-2.5 w-2.5" /> 12ms
          </span>
        )}
      </div>

      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{data.description}</p>

      {data.badge && (
        <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-[var(--border)]">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Event:</span>
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-[var(--navy)] font-medium">
            {data.badge}
          </span>
        </div>
      )}

      {/* Output Port */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-[var(--orange)] !border-2 !border-white"
      />
    </div>
  )
}

// Condition Node (Branching)
export function ConditionNode({ data, selected }: { data: Record<string, any>; selected?: boolean }) {
  const isExecuting = data.isExecuting
  const isPassed = data.isPassed
  const evaluation = data.evaluationResult // true | false | null

  return (
    <div
      className={`w-76 rounded-2xl border bg-[var(--surface)] p-4 shadow-lg transition-all duration-300 ${
        isExecuting
          ? 'ring-4 ring-blue-500 ring-offset-2 border-blue-500 shadow-blue-500/20'
          : isPassed
          ? 'border-indigo-500'
          : selected
          ? 'border-[var(--navy)] ring-2 ring-[var(--navy)]'
          : 'border-[var(--border)]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-[var(--navy)] !border-2 !border-white"
      />

      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
              LOGIC CONDITION
            </span>
            <span className="text-xs font-bold text-[var(--text)]">{data.label || 'Evaluate'}</span>
          </div>
        </div>
        {evaluation !== undefined && (
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
              evaluation
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {evaluation ? 'MATCH (TRUE)' : 'FALSE'}
          </span>
        )}
      </div>

      <div className="rounded-lg bg-[var(--surface-alt)] p-2 font-mono text-[11px] text-[var(--navy)] border border-[var(--border)]">
        {data.expression || 'jurisdiction == "freezone"'}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] font-bold pt-2 border-t border-[var(--border)]">
        <span className="text-emerald-600 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          YES / MATCH
        </span>
        <span className="text-slate-500 flex items-center gap-1">
          NO / FALLBACK
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        </span>
      </div>

      {/* Output Port 1: YES */}
      <Handle
        type="source"
        id="yes"
        position={Position.Bottom}
        style={{ left: '30%' }}
        className="!h-3 !w-3 !bg-emerald-500 !border-2 !border-white"
      />
      {/* Output Port 2: NO */}
      <Handle
        type="source"
        id="no"
        position={Position.Bottom}
        style={{ left: '70%' }}
        className="!h-3 !w-3 !bg-slate-400 !border-2 !border-white"
      />
    </div>
  )
}

// Action Node
export function ActionNode({ data, selected }: { data: Record<string, any>; selected?: boolean }) {
  const isExecuting = data.isExecuting
  const isPassed = data.isPassed
  const actionType = data.actionType || 'send_email'

  const getIcon = () => {
    switch (actionType) {
      case 'send_whatsapp':
        return <MessageSquare className="h-4 w-4 text-emerald-600" />
      case 'send_email':
        return <Send className="h-4 w-4 text-[var(--orange)]" />
      case 'update_stage':
        return <Sliders className="h-4 w-4 text-blue-600" />
      case 'assign_desk':
        return <Building2 className="h-4 w-4 text-purple-600" />
      case 'schedule_renewal':
        return <CalendarCheck className="h-4 w-4 text-amber-600" />
      case 'delay_timer':
        return <Clock className="h-4 w-4 text-slate-600" />
      default:
        return <Zap className="h-4 w-4 text-[var(--navy)]" />
    }
  }

  const getBadgeColor = () => {
    switch (actionType) {
      case 'send_whatsapp':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'send_email':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'update_stage':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'assign_desk':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'schedule_renewal':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  return (
    <div
      className={`w-72 rounded-2xl border bg-[var(--surface)] p-4 shadow-lg transition-all duration-300 ${
        isExecuting
          ? 'ring-4 ring-blue-500 ring-offset-2 border-blue-500 shadow-blue-500/20'
          : isPassed
          ? 'border-emerald-500 shadow-emerald-500/10'
          : selected
          ? 'border-[var(--navy)] ring-2 ring-[var(--navy)]'
          : 'border-[var(--border)]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-[var(--navy)] !border-2 !border-white"
      />

      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-alt)] border border-[var(--border)]">
            {getIcon()}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] block">
              ACTION DISPATCH
            </span>
            <span className="text-xs font-bold text-[var(--text)]">{data.label}</span>
          </div>
        </div>
        {isPassed && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
            <Check className="h-2.5 w-2.5" /> OK
          </span>
        )}
      </div>

      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{data.description}</p>

      {data.detail && (
        <div className="mt-3 rounded bg-[var(--surface-alt)] p-2 text-[10px] font-mono text-[var(--text-secondary)] border border-[var(--border)]">
          {data.detail}
        </div>
      )}

      {/* Output Port */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-[var(--navy)] !border-2 !border-white"
      />
    </div>
  )
}

// End Node
export function EndNode({ data, selected }: { data: Record<string, any>; selected?: boolean }) {
  const isPassed = data.isPassed

  return (
    <div
      className={`w-64 rounded-2xl border bg-[var(--surface)] p-3 shadow-md text-center transition-all duration-300 ${
        isPassed ? 'border-emerald-500 bg-emerald-50/20' : selected ? 'border-[var(--navy)]' : 'border-[var(--border)]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-emerald-600 !border-2 !border-white"
      />
      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        {data.label || 'Workflow Completed'}
      </div>
      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Session recorded in CRM audit ledger</p>
    </div>
  )
}

const NODE_TYPES = {
  triggerNode: TriggerNode,
  conditionNode: ConditionNode,
  actionNode: ActionNode,
  endNode: EndNode,
}

// ==========================================
// 2. PRE-BUILT FLOW TEMPLATES
// ==========================================

const FLOW_PRESETS = [
  {
    id: 'preset-inbound-omnichannel',
    name: 'Omni-Channel Instant Lead Ingestion & Dubai Desk Assignment',
    description: 'Instant WhatsApp HSM + SES Tax Blueprint email + Auto Deal Scoring & Desk Routing on tool submission.',
    nodes: [
      {
        id: 'node-1',
        type: 'triggerNode',
        position: { x: 300, y: 50 },
        data: {
          label: 'New Lead Ingested',
          description: 'Fires when user submits Tax Calculator, Banking Odds, or Jurisdiction Quiz on gccstartup.com',
          badge: '/api/lead/submit',
        },
      },
      {
        id: 'node-2',
        type: 'conditionNode',
        position: { x: 300, y: 220 },
        data: {
          label: 'Evaluate Deal Priority',
          description: 'Route high-value leads to VIP Fast-Track Desk',
          expression: 'lead_score >= 75 || deal_value >= 10000',
        },
      },
      {
        id: 'node-3',
        type: 'actionNode',
        position: { x: 120, y: 400 },
        data: {
          label: 'Send WhatsApp HSM',
          actionType: 'send_whatsapp',
          description: 'Dispatches personalized Meta WhatsApp calculation summary with PDF download token.',
          detail: 'Template: uae_tax_calculation_v2 (Vars: first_name, jurisdiction, tax_savings)',
        },
      },
      {
        id: 'node-4',
        type: 'actionNode',
        position: { x: 480, y: 400 },
        data: {
          label: 'Send SES Email',
          actionType: 'send_email',
          description: 'Dispatches branded UAE Freezone Setup Blueprint via AWS SES dedicated pool.',
          detail: 'Template: UAE Freezone Formation Blueprint',
        },
      },
      {
        id: 'node-5',
        type: 'actionNode',
        position: { x: 120, y: 580 },
        data: {
          label: 'Assign Dubai Desk',
          actionType: 'assign_desk',
          description: 'Assigns lead to senior Dubai Desk advisor with high-priority SLA follow-up task.',
          detail: 'Desk: Dubai Desk (Emaar Square)',
        },
      },
      {
        id: 'node-6',
        type: 'actionNode',
        position: { x: 480, y: 580 },
        data: {
          label: 'Update Deal Stage',
          actionType: 'update_stage',
          description: 'Advances deal in CRM Kanban board to Paid App / Discovery Call queue.',
          detail: 'Target Stage: Paid App (Discovery)',
        },
      },
      {
        id: 'node-7',
        type: 'endNode',
        position: { x: 320, y: 760 },
        data: {
          label: 'Lead Enrolled & Routed',
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#F26522', strokeWidth: 2 } },
      { id: 'e2-3', source: 'node-2', sourceHandle: 'yes', target: 'node-3', animated: true, style: { stroke: '#10B981', strokeWidth: 2 } },
      { id: 'e2-4', source: 'node-2', sourceHandle: 'no', target: 'node-4', animated: true, style: { stroke: '#64748B', strokeWidth: 2 } },
      { id: 'e3-5', source: 'node-3', target: 'node-5', animated: true, style: { stroke: '#2563EB', strokeWidth: 2 } },
      { id: 'e4-6', source: 'node-4', target: 'node-6', animated: true, style: { stroke: '#2563EB', strokeWidth: 2 } },
      { id: 'e5-7', source: 'node-5', target: 'node-7', style: { stroke: '#10B981', strokeWidth: 2 } },
      { id: 'e6-7', source: 'node-6', target: 'node-7', style: { stroke: '#10B981', strokeWidth: 2 } },
    ],
  },
  {
    id: 'preset-annual-renewal',
    name: 'Annual Trade License 60d / 30d / 7d Renewal Radar',
    description: 'Autonomous statutory renewal radar monitoring registry deadlines to protect bank accounts & licenses.',
    nodes: [
      {
        id: 'node-r1',
        type: 'triggerNode',
        position: { x: 300, y: 50 },
        data: {
          label: 'Annual Renewal Radar Trigger',
          description: 'Daily midnight cron scans entity license expiry dates in PostgreSQL.',
          badge: 'Daily Radar (00:00 UTC)',
        },
      },
      {
        id: 'node-r2',
        type: 'conditionNode',
        position: { x: 300, y: 220 },
        data: {
          label: 'Check Expiry Window',
          description: 'Evaluates days until statutory trade license expiration',
          expression: 'days_until_expiry <= 30 && renewal_status != "paid"',
        },
      },
      {
        id: 'node-r3',
        type: 'actionNode',
        position: { x: 120, y: 400 },
        data: {
          label: 'Send WhatsApp Renewal Notice',
          actionType: 'send_whatsapp',
          description: 'Sends proactive WhatsApp alert to company owner with 1-click renewal authorization link.',
          detail: 'Template: trade_license_renewal_alert',
        },
      },
      {
        id: 'node-r4',
        type: 'actionNode',
        position: { x: 480, y: 400 },
        data: {
          label: 'Send SES Renewal Invoice',
          actionType: 'send_email',
          description: 'Dispatches detailed statutory fee breakdown & invoice via Amazon SES.',
          detail: 'Template: Annual License & Compliance Renewal',
        },
      },
      {
        id: 'node-r5',
        type: 'actionNode',
        position: { x: 300, y: 580 },
        data: {
          label: 'Schedule Renewal Task',
          actionType: 'schedule_renewal',
          description: 'Creates CRM compliance ledger entry and alerts dedicated desk account manager.',
          detail: 'Task: Call client for DED lease attestation',
        },
      },
      {
        id: 'node-r6',
        type: 'endNode',
        position: { x: 320, y: 740 },
        data: {
          label: 'Renewal Notice Logged',
        },
      },
    ],
    edges: [
      { id: 'er1-2', source: 'node-r1', target: 'node-r2', animated: true, style: { stroke: '#F26522', strokeWidth: 2 } },
      { id: 'er2-3', source: 'node-r2', sourceHandle: 'yes', target: 'node-r3', animated: true, style: { stroke: '#10B981', strokeWidth: 2 } },
      { id: 'er2-4', source: 'node-r2', sourceHandle: 'no', target: 'node-r4', animated: true, style: { stroke: '#64748B', strokeWidth: 2 } },
      { id: 'er3-5', source: 'node-r3', target: 'node-r5', style: { stroke: '#2563EB', strokeWidth: 2 } },
      { id: 'er4-5', source: 'node-r4', target: 'node-r5', style: { stroke: '#2563EB', strokeWidth: 2 } },
      { id: 'er5-6', source: 'node-r5', target: 'node-r6', style: { stroke: '#10B981', strokeWidth: 2 } },
    ],
  },
]

// Sample Mock Lead Payloads for the Step-by-Step Replay Debugger
const MOCK_SCENARIOS = [
  {
    id: 'lead-rashid',
    name: 'Rashid Al-Maktoum (Dubai South — Score 92)',
    payload: {
      first_name: 'Rashid',
      last_name: 'Al-Maktoum',
      company_name: 'Al-Maktoum Global Tech FZ-LLC',
      jurisdiction: 'Dubai South (DWC Freezone)',
      deal_value: 14700,
      lead_score: 92,
      tax_savings_aed: '185,000 AED',
      phone: '+971501234567',
      email: 'rashid@almaktoum-holdings.ae',
      days_until_expiry: 28,
    },
  },
  {
    id: 'lead-alexander',
    name: 'Alexander Wright (DMCC — Score 78)',
    payload: {
      first_name: 'Alexander',
      last_name: 'Wright',
      company_name: 'Wright Fintech Consultancy',
      jurisdiction: 'Dubai Multi Commodities Centre (DMCC)',
      deal_value: 18500,
      lead_score: 78,
      tax_savings_aed: '94,000 AED',
      phone: '+971529876543',
      email: 'alex@wrightfintech.co',
      days_until_expiry: 14,
    },
  },
  {
    id: 'lead-faisal',
    name: 'Faisal Al-Saud (Riyadh RHQ — Score 96)',
    payload: {
      first_name: 'Faisal',
      last_name: 'Al-Saud',
      company_name: 'Saudi Horizon Trading Company',
      jurisdiction: 'Riyadh Regional HQ (MISA Mainland)',
      deal_value: 38000,
      lead_score: 96,
      tax_savings_aed: '320,000 SAR',
      phone: '+966501112233',
      email: 'faisal@horizon.sa',
      days_until_expiry: 60,
    },
  },
]

export function VisualWorkflowBuilder() {
  const [currentPreset, setCurrentPreset] = useState(FLOW_PRESETS[0])
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(FLOW_PRESETS[0].nodes as unknown as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(FLOW_PRESETS[0].edges as unknown as Edge[])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  // Replay Debugger State
  const [selectedScenario, setSelectedScenario] = useState(MOCK_SCENARIOS[0])
  const [debugStepIndex, setDebugStepIndex] = useState<number>(-1)
  const [isPlayingDebug, setIsPlayingDebug] = useState(false)
  const [debugLogs, setDebugLogs] = useState<Array<{ step: string; status: string; detail: string; timestamp: string }>>([])
  const [showLogsDrawer, setShowLogsDrawer] = useState(false)

  const { success: showSuccess, error: showError } = useToast()

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: '#2563EB', strokeWidth: 2 } }, eds),
      ),
    [setEdges],
  )

  const handleSelectPreset = (preset: typeof FLOW_PRESETS[0]) => {
    setCurrentPreset(preset)
    setNodes(preset.nodes)
    setEdges(preset.edges)
    setSelectedNode(null)
    resetDebugger()
    showSuccess(`Loaded workflow template: ${preset.name}`)
  }

  // Persist the current canvas to the `flows` table via /api/flows. The API
  // accepts nodes/edges as arrays or JSON strings and owns validation.
  const [isSaving, setIsSaving] = useState(false)
  const handleSaveFlow = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentPreset.name,
          description: currentPreset.description,
          nodes: JSON.stringify(nodes),
          edges: JSON.stringify(edges),
          triggerType: 'lead_created',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save flow')
      showSuccess(`Workflow "${currentPreset.name}" saved to the automation engine`)
    } catch (err: any) {
      showError(err.message || 'Failed to save workflow')
    } finally {
      setIsSaving(false)
    }
  }

  // Debugger: Reset
  const resetDebugger = () => {
    setDebugStepIndex(-1)
    setIsPlayingDebug(false)
    setDebugLogs([])
    // Reset node visual execution states
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, isExecuting: false, isPassed: false, evaluationResult: undefined },
      })),
    )
  }

  // Debugger: Step Forward
  const stepForward = () => {
    const totalSteps = nodes.length
    const nextIndex = debugStepIndex + 1
    if (nextIndex >= totalSteps) {
      showSuccess('Workflow simulation completed!')
      setIsPlayingDebug(false)
      return
    }

    setDebugStepIndex(nextIndex)
    const targetNode = nodes[nextIndex]

    // Simulate node logic execution
    let evalRes: boolean | undefined = undefined
    if (targetNode.type === 'conditionNode') {
      const score = selectedScenario.payload.lead_score || 0
      const val = selectedScenario.payload.deal_value || 0
      evalRes = score >= 75 || val >= 10000
    }

    // Update nodes visual state
    setNodes((nds) =>
      nds.map((n, idx) => {
        const nodeData = n.data as Record<string, any>
        if (idx === nextIndex) {
          return {
            ...n,
            data: {
              ...nodeData,
              isExecuting: true,
              isPassed: true,
              evaluationResult: evalRes !== undefined ? evalRes : nodeData?.evaluationResult,
            },
          } as any
        }
        if (idx < nextIndex) {
          return {
            ...n,
            data: { ...nodeData, isExecuting: false, isPassed: true },
          } as any
        }
        return {
          ...n,
          data: { ...nodeData, isExecuting: false, isPassed: false },
        } as any
      })
    )

    // Add execution log
    const newLog = {
      step: targetNode.data.label as string,
      status: 'COMPLETED',
      detail:
        targetNode.type === 'triggerNode'
          ? `Ingested lead payload: ${selectedScenario.payload.first_name} ${selectedScenario.payload.last_name} (${selectedScenario.payload.company_name})`
          : targetNode.type === 'conditionNode'
          ? `Condition evaluated: ${evalRes ? 'TRUE (MATCH)' : 'FALSE (FALLBACK)'} [Score: ${selectedScenario.payload.lead_score}, Value: AED ${selectedScenario.payload.deal_value}]`
          : targetNode.type === 'actionNode'
          ? `Action executed: ${targetNode.data.label} -> Dispatched with 200 OK (Latency: 24ms)`
          : `Workflow reached completion node. Audit log committed to Postgres.`,
      timestamp: new Date().toLocaleTimeString(),
    }
    setDebugLogs((prev) => [newLog, ...prev])
  }

  // Handle Play/Pause Replay
  const togglePlayDebug = () => {
    if (isPlayingDebug) {
      setIsPlayingDebug(false)
    } else {
      setIsPlayingDebug(true)
      if (debugStepIndex >= nodes.length - 1) {
        resetDebugger()
      }
      runAutoPlay()
    }
  }

  const runAutoPlay = () => {
    const interval = setInterval(() => {
      setDebugStepIndex((prev) => {
        const next = prev + 1
        if (next >= nodes.length) {
          clearInterval(interval)
          setIsPlayingDebug(false)
          showSuccess('Workflow simulation completed successfully!')
          return prev
        }
        stepForward()
        return next
      })
    }, 1200)
  }

  return (
    <div className="space-y-4">
      {/* Top Header & Presets Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Visual Flow Automations</h1>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-700 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Event Engine Online
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Node-based trigger, condition, and action orchestration with real-time replay debugger and durable execution logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {FLOW_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentPreset.id === preset.id
                  ? 'bg-[var(--navy)] text-white shadow-xs'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {preset.name.split('&')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Step-by-Step Replay Debugger Toolbar */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Scenario Payload Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1">
            <Bug className="h-3.5 w-3.5 text-indigo-600" />
            Mock Scenario:
          </span>
          <select
            value={selectedScenario.id}
            onChange={(e) => {
              const found = MOCK_SCENARIOS.find((s) => s.id === e.target.value)
              if (found) {
                setSelectedScenario(found)
                resetDebugger()
                showSuccess(`Loaded test payload: ${found.name}`)
              }
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1.5 text-xs text-[var(--text)] font-medium focus:ring-1 focus:ring-[var(--orange)]"
          >
            {MOCK_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Debugger Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={resetDebugger}
            variant="outline"
            className="text-xs"
            title="Reset Simulation"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>

          <Button
            size="sm"
            onClick={stepForward}
            className="bg-[var(--navy)] text-white text-xs"
          >
            <SkipForward className="h-3.5 w-3.5 mr-1" />
            Step Next Node ({debugStepIndex + 1}/{nodes.length})
          </Button>

          <Button
            size="sm"
            onClick={togglePlayDebug}
            className={`${isPlayingDebug ? 'bg-amber-600' : 'bg-emerald-600'} text-white text-xs`}
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            {isPlayingDebug ? 'Pause Debugger' : 'Run Full Simulation'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLogsDrawer(!showLogsDrawer)}
            className="text-xs"
          >
            <FileCode className="h-3.5 w-3.5 mr-1" />
            Logs ({debugLogs.length})
          </Button>

          <Button
            size="sm"
            onClick={handleSaveFlow}
            disabled={isSaving}
            className="bg-[var(--orange)] text-white text-xs"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            {isSaving ? 'Saving...' : 'Save Workflow'}
          </Button>
        </div>
      </div>

      {/* Main Canvas + Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[720px]">
        {/* Left/Center: React Flow Canvas */}
        <div className={`transition-all duration-200 rounded-2xl border border-[var(--border)] bg-slate-50/50 shadow-inner overflow-hidden relative ${showLogsDrawer ? 'lg:col-span-8' : 'lg:col-span-9'}`}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            onNodeClick={(_, node) => setSelectedNode(node)}
            fitView
          >
            <Background color="#CBD5E1" gap={20} size={1} variant={BackgroundVariant.Dots} />
            <Controls className="!bg-white !border !border-[var(--border)] !shadow-sm !rounded-xl" />
            <MiniMap
              className="!border !border-[var(--border)] !rounded-xl !bg-white/90"
              nodeColor={(n) => {
                if (n.type === 'triggerNode') return '#F26522'
                if (n.type === 'conditionNode') return '#6366F1'
                if (n.type === 'actionNode') return '#2563EB'
                return '#10B981'
              }}
            />
            <Panel position="top-left" className="bg-white/80 backdrop-blur-xs border border-[var(--border)] rounded-lg p-2 text-xs font-semibold text-[var(--text-secondary)] shadow-xs">
              {currentPreset.name}
            </Panel>
          </ReactFlow>
        </div>

        {/* Right: Node Inspector / Live Logs Panel */}
        <div className={`space-y-4 ${showLogsDrawer ? 'lg:col-span-4' : 'lg:col-span-3'}`}>
          {selectedNode ? (() => {
            const nodeData = (selectedNode.data || {}) as Record<string, any>
            return (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                    Node Inspector: {String(nodeData.label || '')}
                  </span>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text)]"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block">Type</span>
                    <span className="font-mono text-[var(--navy)] font-semibold">{selectedNode.type}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block">Description</span>
                    <p className="text-[var(--text-secondary)] text-[11px] mt-0.5">{String(nodeData.description || '')}</p>
                  </div>

                  {nodeData.expression ? (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block">Evaluation Rule</span>
                      <div className="rounded bg-slate-100 p-2 font-mono text-[10px] text-[var(--navy)] mt-1">
                        {String(nodeData.expression)}
                      </div>
                    </div>
                  ) : null}

                  {nodeData.detail ? (
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block">Configuration</span>
                      <div className="rounded bg-slate-100 p-2 font-mono text-[10px] text-[var(--navy)] mt-1">
                        {String(nodeData.detail)}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })() : (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-center text-xs text-[var(--text-tertiary)]">
              Click any node on the canvas to inspect its configuration and payload bindings.
            </div>
          )}

          {/* Real-Time Step Execution Logs */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden flex flex-col h-[480px]">
            <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-blue-600" />
                Execution Log Stream
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">
                {debugLogs.length} Events
              </span>
            </div>

            <div className="p-3 overflow-y-auto space-y-2 flex-1 divide-y divide-[var(--border)] text-xs">
              {debugLogs.length === 0 ? (
                <div className="text-center py-12 text-xs text-[var(--text-tertiary)]">
                  Click <span className="font-bold text-[var(--navy)]">&ldquo;Step Next Node&rdquo;</span> or <span className="font-bold text-emerald-600">&ldquo;Run Full Simulation&rdquo;</span> to trace execution step-by-step.
                </div>
              ) : (
                debugLogs.map((log, i) => (
                  <div key={i} className="pt-2 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[var(--text)] flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        {log.step}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] font-mono leading-relaxed bg-[var(--surface-alt)] p-1.5 rounded border border-[var(--border)]">
                      {log.detail}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
