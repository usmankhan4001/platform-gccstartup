// Shared shapes for the automation canvas and the email engine.
//
// Everything here is a plain type alias (never an interface) on purpose: the
// canvas hands these objects to `@xyflow/react`, whose `Node`/`Edge` generics are
// constrained to `Record<string, unknown>`. Type aliases get an implicit index
// signature, interfaces do not, so an interface here would fail to satisfy the
// constraint at every `useNodesState` call site.

import type { Edge, Node } from '@xyflow/react'

/* ------------------------------------------------------------------ canvas */

export type NodeKind = 'trigger' | 'condition' | 'action' | 'delay'

/** How a node fared the last time the flow ran — drives the replay highlight. */
export type RunState = 'passed' | 'failed' | 'skipped' | 'running' | null

export type FlowNodeData = {
  kind: NodeKind
  /** Catalog key, e.g. `trigger.lead_created_calculator`. */
  nodeType: string
  label: string
  config: Record<string, unknown>
  runState?: RunState
  runNote?: string
}

export type CanvasNode = Node<FlowNodeData, 'flowNode'>
export type CanvasEdge = Edge

export type FlowGraph = {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

/* ------------------------------------------------------------- flow records */

export type FlowSummary = {
  id: string
  name: string
  description: string | null
  status: string
  triggerType: string
  nodeCount: number
  version: number
  updatedAt: string | null
  enrolled: number
  active: number
  completed: number
}

export type FlowRunStep = {
  stepIndex: number
  status: 'pending' | 'completed' | 'failed' | 'skipped'
  /** Resolved from `flow_logs.result.nodeId` when the engine wrote one, otherwise
   * matched by ordinal position in the saved graph. */
  nodeId: string | null
  label: string
  detail: string
  error: string | null
  executedAt: string | null
}

export type FlowRun = {
  id: string
  flowId: string
  flowName: string
  contactName: string
  contactEmail: string | null
  status: string
  currentStep: number
  startedAt: string | null
  completedAt: string | null
  steps: FlowRunStep[]
}

/* ------------------------------------------------------------ email engine */

export type DeliverabilityStats = {
  total: number
  queued: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  failed: number
  /** All ratios are 0–1 fractions; the UI formats them. Zero denominators yield 0
   * rather than NaN so a fresh workspace renders "0.0%" instead of "NaN%". */
  deliveryRate: number
  openRate: number
  clickRate: number
  bounceRate: number
  complaintRate: number
  trend: DeliverabilityPoint[]
}

export type DeliverabilityPoint = {
  date: string
  sent: number
  delivered: number
  opened: number
}

export type SesConfig = {
  configured: boolean
  region: string | null
  fromEmail: string | null
  fromName: string | null
  missing: string[]
}

export type SuppressionRow = {
  id: string
  email: string
  reason: 'hard_bounce' | 'complaint' | 'manual' | 'invalid'
  source: string | null
  detail: string | null
  createdAt: string | null
}

export type EmailTemplateSummary = {
  id: string
  name: string
  subject: string
  category: string
  updatedAt: string | null
  /** Raw Puck document (`{ content, root }`) so the builder can reopen a template. */
  document: unknown
  html: string
}

/* --------------------------------------------------------------- sequences */

export type SequenceStep = {
  id: string
  title: string
  delay: string
  channel: string
  template: string
  subject: string
}

export type SequenceStatus = 'active' | 'paused' | 'draft' | 'archived' | 'unprovisioned'

export type EmailSequence = {
  key: string
  name: string
  description: string
  triggerLabel: string
  triggerType: string
  status: SequenceStatus
  enrolledCount: number
  activeCount: number
  completedCount: number
  openRate: number | null
  clickRate: number | null
  flowId: string | null
  steps: SequenceStep[]
}

/* ------------------------------------------------------------------ payloads */

export type LoadResult<T> = {
  data: T
  error: string | null
}
