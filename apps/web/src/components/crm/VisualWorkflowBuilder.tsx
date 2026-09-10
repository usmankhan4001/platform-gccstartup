'use client'

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
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
  type Connection,
  type NodeProps,
  BackgroundVariant,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Play,
  CheckCircle2,
  Check,
  RotateCcw,
  Plus,
  ChevronRight,
  FileCode,
  Bug,
  SkipForward,
  Database,
  Trash2,
  GitBranch,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastProvider'
import {
  NODE_DEFINITIONS,
  KIND_LABEL,
  KIND_ICON,
  getNodeDefinition,
  nodeAccentBar,
  type ConfigField,
  type NodeAccent,
} from '@/components/automation/nodeCatalog'
import { simulateFlow, unreachedNodeIds, type SimulationContext } from '@/components/automation/simulate'
import type { CanvasNode, CanvasEdge, NodeKind, FlowRun } from '@/components/automation/types'

// ==========================================
// 1. CATALOG-DRIVEN CANVAS NODE
// ==========================================
//
// One node renderer for every node the builder can place. The catalog
// (components/automation/nodeCatalog.ts) supplies the icon, accent and the
// `summary(config)` line; replay state rides on `data.runState`. Unknown node
// types (saved by an older engine, or a hand-edited graph) render a placeholder
// rather than disappearing — loading a saved flow must never drop nodes.

const ACCENT_RING: Record<NodeAccent, string> = {
  orange: 'border-orange-400',
  blue: 'border-blue-400',
  violet: 'border-violet-400',
  emerald: 'border-emerald-400',
  amber: 'border-amber-400',
}

const ACCENT_CHIP: Record<NodeAccent, string> = {
  orange: 'bg-orange-50 text-[var(--orange)] border-orange-200',
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  violet: 'bg-violet-50 text-violet-600 border-violet-200',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
}

const KIND_ACCENT: Record<NodeKind, NodeAccent> = {
  trigger: 'orange',
  condition: 'violet',
  action: 'blue',
  delay: 'blue',
}

function FlowNodeView({ data, selected }: NodeProps) {
  const nodeData = (data ?? {}) as Record<string, unknown>
  const nodeType = typeof nodeData.nodeType === 'string' ? nodeData.nodeType : ''
  const config = (nodeData.config && typeof nodeData.config === 'object' ? nodeData.config : {}) as Record<string, unknown>
  const definition = getNodeDefinition(nodeType)
  const kind: NodeKind = definition?.kind ?? (nodeData.kind as NodeKind) ?? 'action'
  const accent = definition?.accent ?? KIND_ACCENT[kind]
  const Icon = definition?.icon ?? KIND_ICON[kind]
  const runState = (nodeData.runState ?? null) as string | null
  const evaluation = nodeData.evaluationResult as boolean | undefined

  const summary = definition
    ? definition.summary(config)
    : String(nodeData.detail || nodeData.description || nodeType || 'Unknown node — re-place it from the palette')

  const ringClass =
    runState === 'running'
      ? 'ring-4 ring-blue-500 ring-offset-2 border-blue-500 shadow-blue-500/20'
      : runState === 'passed'
      ? 'border-emerald-500 shadow-emerald-500/10'
      : runState === 'failed'
      ? 'border-rose-500 shadow-rose-500/10'
      : selected
      ? 'border-[var(--navy)] ring-2 ring-[var(--navy)]'
      : ACCENT_RING[accent]

  return (
    <div className={`w-72 rounded-2xl border bg-[var(--surface)] p-4 shadow-lg transition-all duration-300 ${ringClass}`}>
      {kind !== 'trigger' && <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-[var(--navy)] !border-2 !border-white" />}

      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5 mb-2.5">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${ACCENT_CHIP[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] block">{KIND_LABEL[kind]}</span>
          <span className="text-xs font-bold text-[var(--text)] truncate block">
            {String(nodeData.label || definition?.label || 'Untitled step')}
          </span>
        </div>
        {runState === 'passed' && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
            <Check className="h-2.5 w-2.5" /> OK
          </span>
        )}
        {runState === 'skipped' && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 border border-slate-200">SKIPPED</span>
        )}
        {kind === 'condition' && evaluation !== undefined && (
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
              evaluation ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {evaluation ? 'TRUE' : 'FALSE'}
          </span>
        )}
      </div>

      <div className="rounded-lg bg-[var(--surface-alt)] p-2 text-[11px] text-[var(--navy)] border border-[var(--border)]">
        <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${nodeAccentBar(accent)}`} />
        <span className="font-medium">{summary}</span>
      </div>

      {kind === 'condition' && (
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
      )}

      {kind === 'condition' ? (
        <>
          <Handle type="source" id="yes" position={Position.Bottom} style={{ left: '30%' }} className="!h-3 !w-3 !bg-emerald-500 !border-2 !border-white" />
          <Handle type="source" id="no" position={Position.Bottom} style={{ left: '70%' }} className="!h-3 !w-3 !bg-slate-400 !border-2 !border-white" />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-[var(--navy)] !border-2 !border-white" />
      )}
    </div>
  )
}

const NODE_TYPES = { flowNode: FlowNodeView }

// ==========================================
// 2. LOADING SAVED GRAPHS
// ==========================================

type SavedFlow = {
  id: string
  name: string
  description: string | null
  status: string
  triggerType: string
  version: number
  updatedAt: string | null
  nodeCount: number
}

type RawNode = { id?: unknown; type?: unknown; position?: { x?: unknown; y?: unknown }; data?: Record<string, unknown> }
type RawEdge = { id?: unknown; source?: unknown; target?: unknown; sourceHandle?: unknown }

function toInt(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/**
 * Saved nodes may be catalog-native (data.nodeType/kind/config) or legacy
 * (trigger/message/condition nodes with expression/detail fields). Both map
 * onto the catalog shape; a node the catalog does not know survives as a
 * placeholder with kind 'action' instead of being dropped.
 */
function toCanvasNode(raw: RawNode, index: number): CanvasNode {
  const data = raw.data && typeof raw.data === 'object' ? raw.data : {}
  const nodeType = typeof data.nodeType === 'string' ? data.nodeType : typeof raw.type === 'string' ? raw.type : ''
  const known = getNodeDefinition(nodeType)
  const label = typeof data.label === 'string' && data.label ? data.label : known?.label ?? String(nodeType || `Step ${index + 1}`)

  const config: Record<string, unknown> =
    data.config && typeof data.config === 'object' && !Array.isArray(data.config)
      ? { ...(data.config as Record<string, unknown>) }
      : // Legacy shapes: carry the readable string fields into config so the
        // inspector still shows something editable.
        Object.fromEntries(
          Object.entries(data).filter(([key, value]) => ['text', 'expression', 'detail', 'badge'].includes(key) && typeof value === 'string'),
        )

  const kind: NodeKind =
    known?.kind ??
    (typeof data.kind === 'string' && ['trigger', 'condition', 'action', 'delay'].includes(data.kind) ? (data.kind as NodeKind) : 'action')

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `node-${index}-${Date.now()}`,
    type: 'flowNode',
    position: { x: toInt(raw.position?.x, 250), y: toInt(raw.position?.y, 60 + index * 170) },
    data: { ...data, kind, nodeType, label, config },
  } as CanvasNode
}

function toCanvasEdge(raw: RawEdge, index: number): CanvasEdge {
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `edge-${index}`,
    source: typeof raw.source === 'string' ? raw.source : '',
    target: typeof raw.target === 'string' ? raw.target : '',
    sourceHandle: typeof raw.sourceHandle === 'string' ? raw.sourceHandle : null,
    animated: true,
    style: { stroke: '#2563EB', strokeWidth: 2 },
  } as CanvasEdge
}

function normalizeGraph(nodes: unknown, edges: unknown): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const rawNodes = Array.isArray(nodes) ? (nodes as RawNode[]) : []
  const rawEdges = Array.isArray(edges) ? (edges as RawEdge[]) : []
  return {
    nodes: rawNodes.map(toCanvasNode),
    edges: rawEdges.map(toCanvasEdge).filter((edge) => edge.source && edge.target),
  }
}

// ==========================================
// 3. QUICK-START PRESETS (catalog-native)
// ==========================================

function presetNode(
  id: string,
  nodeType: string,
  label: string,
  position: { x: number; y: number },
  config: Record<string, unknown> = {},
): CanvasNode {
  const definition = getNodeDefinition(nodeType)
  return {
    id,
    type: 'flowNode',
    position,
    data: { kind: definition?.kind ?? 'action', nodeType, label, config },
  } as CanvasNode
}

const EDGE_ORANGE = { stroke: '#F26522', strokeWidth: 2 }
const EDGE_GREEN = { stroke: '#10B981', strokeWidth: 2 }
const EDGE_GREY = { stroke: '#64748B', strokeWidth: 2 }
const EDGE_BLUE = { stroke: '#2563EB', strokeWidth: 2 }

const QUICKSTART_PRESETS: Array<{ id: string; name: string; description: string; nodes: CanvasNode[]; edges: CanvasEdge[] }> = [
  {
    id: 'preset-inbound-omnichannel',
    name: 'Omni-Channel Lead Ingestion & Desk Routing',
    description: 'Routes high-value inbound leads to WhatsApp + desk assignment, everyone else to the SES blueprint email.',
    nodes: [
      presetNode('node-1', 'trigger.lead_created_calculator', 'New Lead Ingested', { x: 300, y: 40 }, { source: 'any', minScore: 0 }),
      presetNode('node-2', 'condition.deal_value', 'Evaluate Deal Priority', { x: 300, y: 210 }, { operator: 'greater_than', amount: 10000 }),
      presetNode('node-3', 'action.send_whatsapp_hsm', 'Send WhatsApp HSM', { x: 110, y: 400 }, { template: 'kyc_documents_v3', language: 'en' }),
      presetNode('node-4', 'action.send_ses_email', 'Send SES Blueprint Email', { x: 520, y: 400 }, {
        subject: 'Your UAE formation blueprint is ready',
        templateName: 'uae-freezone-blueprint',
      }),
      presetNode('node-5', 'action.assign_desk', 'Assign Dubai Desk', { x: 110, y: 580 }, { desk: 'dubai', notifyOwner: true }),
      presetNode('node-6', 'action.create_task', 'Create Follow-up Task', { x: 520, y: 580 }, { title: 'Call lead about KYC documents', dueInDays: 1, priority: 'high' }),
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: EDGE_ORANGE },
      { id: 'e2-3', source: 'node-2', sourceHandle: 'yes', target: 'node-3', animated: true, style: EDGE_GREEN },
      { id: 'e2-4', source: 'node-2', sourceHandle: 'no', target: 'node-4', animated: true, style: EDGE_GREY },
      { id: 'e3-5', source: 'node-3', target: 'node-5', animated: true, style: EDGE_BLUE },
      { id: 'e4-6', source: 'node-4', target: 'node-6', animated: true, style: EDGE_BLUE },
    ],
  },
  {
    id: 'preset-annual-renewal',
    name: 'Annual Trade License Renewal Radar',
    description: 'Watches license expiry windows and runs the statutory reminder ladder before the government does.',
    nodes: [
      presetNode('node-r1', 'trigger.license_expiring', 'License Expiring Soon', { x: 300, y: 40 }, { daysAhead: 30, jurisdiction: 'any' }),
      presetNode('node-r2', 'condition.consent', 'Email Consent Guard', { x: 300, y: 210 }, { channel: 'email', required: 'granted' }),
      presetNode('node-r3', 'action.send_ses_email', 'Send SES Renewal Notice', { x: 140, y: 400 }, {
        subject: 'Renew your trade license before expiry',
        templateName: 'annual-renewal-notice',
      }),
      presetNode('node-r4', 'action.send_whatsapp_hsm', 'Send WhatsApp Reminder', { x: 520, y: 400 }, { template: 'renewal_reminder_v2', language: 'en' }),
      presetNode('node-r5', 'action.create_task', 'Escalate to Desk', { x: 140, y: 580 }, { title: 'Call client about license renewal', dueInDays: 2, priority: 'high' }),
      presetNode('node-r6', 'action.wait', 'Grace Period', { x: 520, y: 580 }, { duration: 7, unit: 'days' }),
    ],
    edges: [
      { id: 'er1-2', source: 'node-r1', target: 'node-r2', animated: true, style: EDGE_ORANGE },
      { id: 'er2-3', source: 'node-r2', sourceHandle: 'yes', target: 'node-r3', animated: true, style: EDGE_GREEN },
      { id: 'er2-4', source: 'node-r2', sourceHandle: 'no', target: 'node-r4', animated: true, style: EDGE_GREY },
      { id: 'er3-5', source: 'node-r3', target: 'node-r5', animated: true, style: EDGE_BLUE },
      { id: 'er4-6', source: 'node-r4', target: 'node-r6', animated: true, style: EDGE_BLUE },
    ],
  },
]

// Mock lead payloads for the step-by-step replay debugger — each maps to the
// SimulationContext the real simulator consumes (jurisdiction codes, consent).
const MOCK_SCENARIOS: Array<{ id: string; name: string; context: SimulationContext }> = [
  {
    id: 'lead-rashid',
    name: 'Rashid Al-Maktoum (Dubai South — Score 92)',
    context: { jurisdiction: 'uae_freezone', dealValue: 14700, leadScore: 92, emailConsent: 'granted', whatsappConsent: 'granted' },
  },
  {
    id: 'lead-alexander',
    name: 'Alexander Wright (DMCC — email consent denied)',
    context: { jurisdiction: 'uae_freezone', dealValue: 18500, leadScore: 78, emailConsent: 'denied', whatsappConsent: 'granted' },
  },
  {
    id: 'lead-faisal',
    name: 'Faisal Al-Saud (Riyadh RHQ — WhatsApp unknown)',
    context: { jurisdiction: 'saudi_misa', dealValue: 38000, leadScore: 96, emailConsent: 'granted', whatsappConsent: 'unknown' },
  },
]

const KIND_SECTIONS: Array<{ kind: NodeKind; title: string }> = [
  { kind: 'trigger', title: 'Triggers' },
  { kind: 'condition', title: 'Conditions' },
  { kind: 'action', title: 'Actions' },
  { kind: 'delay', title: 'Delays' },
]

// ==========================================
// 4. THE BUILDER
// ==========================================

export function VisualWorkflowBuilder() {
  const [savedFlows, setSavedFlows] = useState<SavedFlow[]>([])
  const [flowsLoading, setFlowsLoading] = useState(true)
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null)
  const [flowName, setFlowName] = useState(QUICKSTART_PRESETS[0].name)
  const [flowDescription, setFlowDescription] = useState(QUICKSTART_PRESETS[0].description)
  const [activePresetId, setActivePresetId] = useState<string | null>(QUICKSTART_PRESETS[0].id)
  const [isLoadingFlow, setIsLoadingFlow] = useState(false)

  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(QUICKSTART_PRESETS[0].nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>(QUICKSTART_PRESETS[0].edges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Replay debugger — driven by the real simulator (simulate.ts), so the walk
  // follows edges and consent gates instead of node array order.
  const [selectedScenario, setSelectedScenario] = useState(MOCK_SCENARIOS[0])
  const [debugStepIndex, setDebugStepIndex] = useState(-1)
  const [isPlayingDebug, setIsPlayingDebug] = useState(false)
  const [showLogsDrawer, setShowLogsDrawer] = useState(false)
  const [logView, setLogView] = useState<'simulator' | 'engine'>('simulator')
  const traceTimesRef = useRef<string[]>([])

  // Real execution history (flow_logs) for the selected saved flow.
  const [engineRuns, setEngineRuns] = useState<FlowRun[]>([])
  const [engineRunsLoading, setEngineRunsLoading] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const autoLoadedRef = useRef(false)

  const { success: showSuccess, error: showError } = useToast()

  const simulation = useMemo(() => simulateFlow(nodes, edges, selectedScenario.context), [nodes, edges, selectedScenario])

  // The simulator log is derived: everything up to the current step, newest first.
  const debugLogs = useMemo(
    () =>
      simulation
        .slice(0, debugStepIndex + 1)
        .map((step, index) => ({
          step: step.label,
          status: step.status === 'skipped' ? 'SKIPPED' : 'COMPLETED',
          detail: step.detail,
          timestamp: traceTimesRef.current[index] ?? '',
        }))
        .reverse(),
    [simulation, debugStepIndex],
  )

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#2563EB', strokeWidth: 2 } }, eds)),
    [setEdges],
  )

  // ---------------------------------------------------------------- flows API

  const refreshFlowList = useCallback(async () => {
    setFlowsLoading(true)
    try {
      const res = await fetch('/api/flows')
      if (!res.ok) throw new Error('Failed to load flows')
      const rows = (await res.json()) as Array<Record<string, unknown>>
      setSavedFlows(
        (Array.isArray(rows) ? rows : []).map((row) => ({
          id: String(row.id),
          name: String(row.name ?? 'Untitled'),
          description: typeof row.description === 'string' ? row.description : null,
          status: String(row.status ?? 'draft'),
          triggerType: String(row.trigger_type ?? 'manual'),
          version: typeof row.version === 'number' ? row.version : 1,
          updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
          nodeCount: Array.isArray(row.nodes) ? row.nodes.length : 0,
        })),
      )
    } catch (err) {
      console.error('[flows] list failed', err)
      // Graceful: the builder still works with presets when /api/flows is down.
    } finally {
      setFlowsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshFlowList()
  }, [refreshFlowList])

  const loadEngineRuns = useCallback(async (flowId: string) => {
    setEngineRunsLoading(true)
    try {
      const res = await fetch(`/api/flows/${flowId}/logs`)
      if (!res.ok) throw new Error('Failed to load flow logs')
      const data = (await res.json()) as { runs?: FlowRun[] }
      setEngineRuns(Array.isArray(data.runs) ? data.runs : [])
    } catch (err) {
      console.error('[flows] engine logs failed', err)
      setEngineRuns([])
    } finally {
      setEngineRunsLoading(false)
    }
  }, [])

  const resetDebugger = useCallback(() => {
    setDebugStepIndex(-1)
    setIsPlayingDebug(false)
    traceTimesRef.current = []
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, runState: null, runNote: undefined, evaluationResult: undefined } })))
  }, [setNodes])

  const applyGraph = useCallback(
    (nextNodes: CanvasNode[], nextEdges: CanvasEdge[]) => {
      setNodes(nextNodes)
      setEdges(nextEdges)
      setSelectedNodeId(null)
      setEngineRuns([])
      resetDebugger()
    },
    [setNodes, setEdges, resetDebugger],
  )

  const handleSelectFlow = useCallback(
    async (flowId: string) => {
      setIsLoadingFlow(true)
      try {
        const res = await fetch(`/api/flows/${flowId}`)
        if (!res.ok) throw new Error('Failed to load flow')
        const flow = (await res.json()) as Record<string, unknown>
        const graph = normalizeGraph(flow.nodes, flow.edges)
        setActiveFlowId(String(flow.id))
        setFlowName(String(flow.name ?? 'Untitled flow'))
        setFlowDescription(typeof flow.description === 'string' ? flow.description : '')
        setActivePresetId(null)
        setLogView('engine')
        applyGraph(graph.nodes, graph.edges)
        void loadEngineRuns(String(flow.id))
        showSuccess(`Loaded flow: ${String(flow.name)}`)
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to load flow')
      } finally {
        setIsLoadingFlow(false)
      }
    },
    [applyGraph, loadEngineRuns, showError, showSuccess],
  )

  // Deep link support: /crm/flows?flow=<id> opens a saved flow directly.
  useEffect(() => {
    if (autoLoadedRef.current || flowsLoading) return
    autoLoadedRef.current = true
    const requested = new URLSearchParams(window.location.search).get('flow')
    if (requested && savedFlows.some((flow) => flow.id === requested)) void handleSelectFlow(requested)
  }, [flowsLoading, savedFlows, handleSelectFlow])

  const handleSelectPreset = (preset: (typeof QUICKSTART_PRESETS)[number]) => {
    setActiveFlowId(null)
    setActivePresetId(preset.id)
    setFlowName(preset.name)
    setFlowDescription(preset.description)
    setLogView('simulator')
    applyGraph(
      preset.nodes.map((node) => ({ ...node, data: { ...node.data } })),
      preset.edges.map((edge) => ({ ...edge })),
    )
    showSuccess(`Loaded workflow template: ${preset.name}`)
  }

  const handleNewFlow = () => {
    const triggerDef = NODE_DEFINITIONS.find((definition) => definition.kind === 'trigger') ?? NODE_DEFINITIONS[0]
    setActiveFlowId(null)
    setActivePresetId(null)
    setFlowName('Untitled flow')
    setFlowDescription('')
    setLogView('simulator')
    applyGraph(
      [
        {
          id: `trigger-${Date.now()}`,
          type: 'flowNode',
          position: { x: 250, y: 60 },
          data: { kind: 'trigger', nodeType: triggerDef.type, label: triggerDef.label, config: { ...triggerDef.defaults } },
        } as CanvasNode,
      ],
      [],
    )
  }

  const handleSaveFlow = async () => {
    const name = flowName.trim()
    if (!name) {
      showError('Give the workflow a name before saving')
      return
    }
    setIsSaving(true)
    try {
      // POST creates a new flow row; PUT updates the one already loaded.
      const res = await fetch(activeFlowId ? `/api/flows/${activeFlowId}` : '/api/flows', {
        method: activeFlowId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: flowDescription,
          nodes: JSON.stringify(nodes),
          edges: JSON.stringify(edges),
          triggerType: 'lead_created',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save flow')
      const flow = data.flow as Record<string, unknown> | undefined
      if (flow?.id) {
        setActiveFlowId(String(flow.id))
        setLogView('engine')
        void loadEngineRuns(String(flow.id))
      }
      void refreshFlowList()
      showSuccess(`Workflow "${name}" saved to the automation engine`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save workflow')
    } finally {
      setIsSaving(false)
    }
  }

  // ------------------------------------------------------------ node editing

  const addNode = (definitionType: string) => {
    const definition = getNodeDefinition(definitionType)
    if (!definition) return
    const newNode: CanvasNode = {
      id: `${definitionType.replace(/\./g, '-')}-${Date.now()}`,
      type: 'flowNode',
      position: { x: 220 + Math.round(Math.random() * 120), y: 120 + Math.round(Math.random() * 160) },
      data: { kind: definition.kind, nodeType: definition.type, label: definition.label, config: { ...definition.defaults } },
    } as CanvasNode
    setNodes((nds) => nds.concat(newNode))
    setSelectedNodeId(newNode.id)
    showSuccess(`Added ${definition.label}`)
  }

  const updateSelectedConfig = (key: string, value: unknown) => {
    if (!selectedNode) return
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? ({ ...node, data: { ...node.data, config: { ...(node.data.config ?? {}), [key]: value } } } as CanvasNode)
          : node,
      ),
    )
  }

  const renameSelectedNode = (label: string) => {
    if (!selectedNode) return
    setNodes((nds) => nds.map((node) => (node.id === selectedNode.id ? ({ ...node, data: { ...node.data, label } } as CanvasNode) : node)))
  }

  const deleteSelectedNode = () => {
    if (!selectedNode) return
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id))
    setSelectedNodeId(null)
    showSuccess('Node removed')
  }

  // ---------------------------------------------------------- replay debugger

  // One effect paints the run state for the current step (used by both manual
  // stepping and autoplay). Trace timestamps are captured once per step.
  useEffect(() => {
    if (debugStepIndex < 0 || debugStepIndex >= simulation.length) return
    if (!traceTimesRef.current[debugStepIndex]) {
      traceTimesRef.current[debugStepIndex] = new Date().toLocaleTimeString()
    }

    const step = simulation[debugStepIndex]
    const reached = new Map(simulation.slice(0, debugStepIndex + 1).map((entry) => [entry.nodeId, entry]))
    const unreached = new Set(unreachedNodeIds(nodes, simulation.slice(0, debugStepIndex + 1)))

    setNodes((nds) =>
      nds.map((node) => {
        const entry = reached.get(node.id)
        const data = { ...node.data } as Record<string, unknown>
        if (node.id === step.nodeId && step.kind === 'condition') {
          data.evaluationResult = /→ yes$/.test(step.detail)
        }
        data.runState = entry ? (entry.status === 'skipped' ? 'skipped' : 'passed') : unreached.has(node.id) ? 'skipped' : null
        return { ...node, data } as CanvasNode
      }),
    )
    // simulation/nodes are the render inputs; re-running on every canvas drag
    // would repaint mid-edit, so only the step index triggers painting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debugStepIndex])

  // Autoplay timer — advances one simulated step per tick.
  useEffect(() => {
    if (!isPlayingDebug) return
    const interval = setInterval(() => {
      setDebugStepIndex((prev) => {
        const next = prev + 1
        if (next >= simulation.length) {
          setIsPlayingDebug(false)
          showSuccess('Workflow simulation completed successfully!')
          return prev
        }
        return next
      })
    }, 1200)
    return () => clearInterval(interval)
  }, [isPlayingDebug, simulation, showSuccess])

  const stepForward = () => {
    if (!simulation.length) {
      showSuccess('Add nodes to the canvas before simulating')
      return
    }
    const nextIndex = debugStepIndex + 1
    if (nextIndex >= simulation.length) {
      showSuccess('Workflow simulation completed!')
      setIsPlayingDebug(false)
      return
    }
    setDebugStepIndex(nextIndex)
  }

  const togglePlayDebug = () => {
    if (isPlayingDebug) {
      setIsPlayingDebug(false)
      return
    }
    setIsPlayingDebug(true)
    if (debugStepIndex >= simulation.length - 1) resetDebugger()
  }

  const selectedDefinition = selectedNode
    ? getNodeDefinition((selectedNode.data as Record<string, unknown>).nodeType as string)
    : null

  return (
    <div className="space-y-4">
      {/* Top Header: presets, saved flows, new flow */}
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

        <div className="flex flex-wrap items-center gap-2">
          {QUICKSTART_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activePresetId === preset.id
                  ? 'bg-[var(--navy)] text-white shadow-xs'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {preset.name.split('&')[0]}
            </button>
          ))}

          <select
            value={activeFlowId ?? ''}
            onChange={(e) => {
              if (e.target.value) void handleSelectFlow(e.target.value)
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1.5 text-xs text-[var(--text)] font-medium focus:ring-1 focus:ring-[var(--orange)]"
            title="Load a saved flow from the database"
          >
            <option value="">{flowsLoading ? 'Loading saved flows…' : `Saved flows (${savedFlows.length})`}</option>
            {savedFlows.map((flow) => (
              <option key={flow.id} value={flow.id}>
                {flow.name} · {flow.status}
              </option>
            ))}
          </select>

          <Button size="sm" variant="outline" onClick={handleNewFlow} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Toolbar: flow identity + replay debugger + save */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="Workflow name"
              className="flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1.5 text-sm font-semibold text-[var(--text)] focus:ring-1 focus:ring-[var(--orange)]"
            />
            <input
              value={flowDescription}
              onChange={(e) => setFlowDescription(e.target.value)}
              placeholder="Short description (optional)"
              className="hidden md:block flex-1 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1.5 text-xs text-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--orange)]"
            />
            {activeFlowId ? (
              <span
                className="shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700 flex items-center gap-1"
                title="Saving updates this flow"
              >
                <Database className="h-3 w-3" /> SAVED
              </span>
            ) : (
              <span
                className="shrink-0 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-bold text-amber-700 flex items-center gap-1"
                title="Saving will create a new flow"
              >
                <Database className="h-3 w-3" /> NEW
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1">
              <Bug className="h-3.5 w-3.5 text-indigo-600" />
              Scenario:
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
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border)]">
          <Button size="sm" onClick={resetDebugger} variant="outline" className="text-xs" title="Reset Simulation">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>

          <Button size="sm" onClick={stepForward} className="bg-[var(--navy)] text-white text-xs">
            <SkipForward className="h-3.5 w-3.5 mr-1" />
            Step Next ({Math.min(Math.max(debugStepIndex + 1, 0), simulation.length)}/{simulation.length})
          </Button>

          <Button size="sm" onClick={togglePlayDebug} className={`${isPlayingDebug ? 'bg-amber-600' : 'bg-emerald-600'} text-white text-xs`}>
            <Play className="h-3.5 w-3.5 mr-1" />
            {isPlayingDebug ? 'Pause Debugger' : 'Run Full Simulation'}
          </Button>

          <Button size="sm" variant="outline" onClick={() => setShowLogsDrawer(!showLogsDrawer)} className="text-xs">
            <FileCode className="h-3.5 w-3.5 mr-1" />
            Logs ({debugLogs.length})
          </Button>

          <span className="flex-1" />

          <Button size="sm" onClick={handleSaveFlow} disabled={isSaving || isLoadingFlow} className="bg-[var(--orange)] text-white text-xs">
            <Check className="h-3.5 w-3.5 mr-1" />
            {isSaving ? 'Saving…' : activeFlowId ? 'Update Workflow' : 'Save Workflow'}
          </Button>
        </div>
      </div>

      {/* Palette + Canvas + Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[720px]">
        {/* Node Palette (from the catalog) */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-y-auto p-3 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] block sticky top-0 bg-[var(--surface)] pb-1 z-10">
            Node Palette
          </span>
          {KIND_SECTIONS.map(({ kind, title }) => {
            const definitions = NODE_DEFINITIONS.filter((definition) => definition.kind === kind)
            if (!definitions.length) return null
            const SectionIcon = KIND_ICON[kind]
            return (
              <div key={kind} className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] flex items-center gap-1">
                  <SectionIcon className="h-3 w-3" /> {title}
                </span>
                {definitions.map((definition) => {
                  const Icon = definition.icon
                  return (
                    <button
                      key={definition.type}
                      onClick={() => addNode(definition.type)}
                      title={definition.description}
                      className="w-full flex items-start gap-2 p-2 rounded-lg border border-[var(--border)] hover:border-[var(--orange)] hover:bg-orange-50/50 text-left transition-all group"
                    >
                      <Icon className="h-3.5 w-3.5 mt-0.5 text-[var(--text-tertiary)] group-hover:text-[var(--orange)] shrink-0" />
                      <span className="min-w-0">
                        <span className="text-[11px] font-bold text-[var(--text)] group-hover:text-[var(--orange)] block truncate">{definition.label}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)] block truncate">{definition.summary(definition.defaults)}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Center: React Flow Canvas */}
        <div
          className={`transition-all duration-200 rounded-2xl border border-[var(--border)] bg-slate-50/50 shadow-inner overflow-hidden relative ${
            showLogsDrawer ? 'lg:col-span-6' : 'lg:col-span-7'
          }`}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
          >
            <Background color="#CBD5E1" gap={20} size={1} variant={BackgroundVariant.Dots} />
            <Controls className="!bg-white !border !border-[var(--border)] !shadow-sm !rounded-xl" />
            <MiniMap
              className="!border !border-[var(--border)] !rounded-xl !bg-white/90"
              nodeColor={(n) => {
                const kind = (n.data as Record<string, unknown>)?.kind
                if (kind === 'trigger') return '#F26522'
                if (kind === 'condition') return '#6366F1'
                if (kind === 'delay') return '#0EA5E9'
                return '#2563EB'
              }}
            />
            <Panel
              position="top-left"
              className="bg-white/80 backdrop-blur-xs border border-[var(--border)] rounded-lg p-2 text-xs font-semibold text-[var(--text-secondary)] shadow-xs max-w-xs truncate"
            >
              {flowName}
            </Panel>
          </ReactFlow>
        </div>

        {/* Right: Node Inspector / Live Logs Panel */}
        <div className={`space-y-4 overflow-y-auto ${showLogsDrawer ? 'lg:col-span-4' : 'lg:col-span-3'}`}>
          {selectedNode ? (
            (() => {
              const nodeData = (selectedNode.data ?? {}) as Record<string, unknown>
              const config = (nodeData.config && typeof nodeData.config === 'object' ? nodeData.config : {}) as Record<string, unknown>
              return (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)] truncate">
                      {selectedDefinition ? selectedDefinition.label : 'Unknown node'}
                    </span>
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text)] shrink-0 ml-2"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block">Node label</span>
                    <input
                      value={String(nodeData.label ?? '')}
                      onChange={(e) => renameSelectedNode(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:ring-1 focus:ring-[var(--orange)]"
                    />
                  </div>

                  {selectedDefinition ? (
                    <>
                      <p className="text-[11px] text-[var(--text-secondary)]">{selectedDefinition.description}</p>

                      <div className="rounded-lg bg-[var(--surface-alt)] border border-[var(--border)] p-2 text-[11px] text-[var(--navy)] font-medium">
                        <GitBranch className="h-3 w-3 inline mr-1 -mt-0.5" />
                        {selectedDefinition.summary(config)}
                      </div>

                      <div className="space-y-2.5 pt-1">
                        {selectedDefinition.fields.map((field) => (
                          <ConfigFieldInput
                            key={field.key}
                            field={field}
                            value={config[field.key]}
                            onChange={(value) => updateSelectedConfig(field.key, value)}
                          />
                        ))}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={deleteSelectedNode}
                        className="w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete Node
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-700">
                      This node uses type <span className="font-mono">{String(nodeData.nodeType || selectedNode.type)}</span> which is not in the
                      catalog. Delete it and re-add the equivalent from the palette.
                    </div>
                  )}
                </div>
              )
            })()
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-center text-xs text-[var(--text-tertiary)]">
              Click any node on the canvas to edit its configuration, or add one from the palette on the left.
            </div>
          )}

          {/* Execution logs: simulator trace + real engine runs */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden flex flex-col h-[480px]">
            <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-alt)] flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-blue-600" />
                Execution Logs
              </span>
              <div className="flex items-center rounded-lg border border-[var(--border)] overflow-hidden">
                <button
                  onClick={() => setLogView('simulator')}
                  className={`px-2 py-1 text-[10px] font-bold ${logView === 'simulator' ? 'bg-[var(--navy)] text-white' : 'text-[var(--text-secondary)]'}`}
                >
                  Simulator ({debugLogs.length})
                </button>
                <button
                  onClick={() => {
                    setLogView('engine')
                    if (activeFlowId) void loadEngineRuns(activeFlowId)
                  }}
                  className={`px-2 py-1 text-[10px] font-bold ${logView === 'engine' ? 'bg-[var(--navy)] text-white' : 'text-[var(--text-secondary)]'}`}
                >
                  Engine ({engineRuns.length})
                </button>
              </div>
            </div>

            {logView === 'engine' ? (
              <div className="p-3 overflow-y-auto space-y-2 flex-1 divide-y divide-[var(--border)] text-xs">
                {!activeFlowId ? (
                  <div className="text-center py-10 text-xs text-[var(--text-tertiary)]">
                    Save this workflow, then its real <span className="font-mono">flow_logs</span> runs appear here.
                  </div>
                ) : engineRunsLoading ? (
                  <div className="text-center py-10 text-xs text-[var(--text-tertiary)]">Loading engine runs…</div>
                ) : engineRuns.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[var(--text-tertiary)]">
                    No engine runs yet for this flow — enrollments appear once contacts enter it.
                  </div>
                ) : (
                  engineRuns.map((run) => (
                    <div key={run.id} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-[var(--text)] truncate">{run.contactName}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                            run.status === 'active'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : run.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : run.status === 'failed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        step {run.currentStep} · started {run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}
                      </p>
                      {run.steps.length > 0 && (
                        <div className="space-y-0.5">
                          {run.steps.map((step, i) => (
                            <p key={i} className="text-[10px] text-[var(--text-secondary)] font-mono leading-relaxed">
                              {step.status === 'failed' ? '✕' : step.status === 'skipped' ? '◌' : '✓'} {step.label}
                              {step.detail ? ` — ${step.detail}` : ''}
                              {step.error ? ` — ${step.error}` : ''}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-3 overflow-y-auto space-y-2 flex-1 divide-y divide-[var(--border)] text-xs">
                {debugLogs.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[var(--text-tertiary)]">
                    Click <span className="font-bold text-[var(--navy)]">&ldquo;Step Next&rdquo;</span> or{' '}
                    <span className="font-bold text-emerald-600">&ldquo;Run Full Simulation&rdquo;</span> to trace execution step-by-step.
                  </div>
                ) : (
                  debugLogs.map((log, i) => (
                    <div key={i} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[var(--text)] flex items-center gap-1 truncate">
                          {log.status === 'SKIPPED' ? (
                            <SkipForward className="h-3 w-3 text-slate-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                          )}
                          {log.step}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-tertiary)] shrink-0 ml-2">{log.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] font-mono leading-relaxed bg-[var(--surface-alt)] p-1.5 rounded border border-[var(--border)]">
                        {log.detail}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Flow metadata strip */}
          {activeFlowId && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[10px] text-[var(--text-tertiary)] font-mono flex items-center gap-2">
              <ChevronRight className="h-3 w-3" />
              flow {activeFlowId.slice(0, 8)}… · {nodes.length} nodes · {edges.length} edges
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 5. INSPECTOR FIELD RENDERER
// ==========================================

function ConfigFieldInput({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (value: unknown) => void }) {
  const inputClass =
    'w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:ring-1 focus:ring-[var(--orange)]'

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] block">{field.label}</label>
      {field.type === 'text' && (
        <input type="text" value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
      {field.type === 'textarea' && (
        <textarea
          rows={field.rows ?? 3}
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} resize-none`}
        />
      )}
      {field.type === 'number' && (
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={typeof value === 'number' && Number.isFinite(value) ? value : Number(value ?? 0) || 0}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className={inputClass}
        />
      )}
      {field.type === 'select' && (
        <select value={String(value ?? field.options[0]?.value ?? '')} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {field.type === 'switch' && (() => {
        const on = value === undefined ? true : Boolean(value)
        return (
          <button
            type="button"
            onClick={() => onChange(!on)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}
            aria-pressed={on}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                on ? 'translate-x-[18px]' : 'translate-x-[3px]'
              }`}
            />
          </button>
        )
      })()}
      {field.help && <span className="text-[10px] text-[var(--text-tertiary)] block">{field.help}</span>}
    </div>
  )
}