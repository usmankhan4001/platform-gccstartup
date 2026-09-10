// A pure, dependency-free dry-run of a saved flow graph.
//
// The execution log panel needs a debugger that works on day one, before any
// enrollment has ever run. Rather than inventing rows, this walks the real saved
// graph with a sample contact and reports what *would* happen — including the two
// branches the engine is required to respect: consent gating and condition
// routing. It never touches the database and never throws.

import { getNodeDefinition, num, str } from './nodeCatalog'
import type { CanvasEdge, CanvasNode, NodeKind } from './types'

export type SimulationContext = {
  jurisdiction: string
  dealValue: number
  leadScore: number
  emailConsent: 'granted' | 'unknown' | 'denied'
  whatsappConsent: 'granted' | 'unknown' | 'denied'
}

export const DEFAULT_SIMULATION_CONTEXT: SimulationContext = {
  jurisdiction: 'uae_freezone',
  dealValue: 12500,
  leadScore: 88,
  emailConsent: 'granted',
  whatsappConsent: 'granted',
}

export type SimulatedStep = {
  nodeId: string
  label: string
  kind: NodeKind
  status: 'passed' | 'failed' | 'skipped'
  detail: string
}

/** Guards against a cycle in a hand-edited graph: no run may visit a node twice. */
const MAX_STEPS = 64

function outgoing(edges: CanvasEdge[], nodeId: string, handle?: string | null): CanvasEdge | null {
  const matches = edges.filter((edge) => edge.source === nodeId)
  if (!matches.length) return null
  if (handle) {
    const exact = matches.find((edge) => (edge.sourceHandle ?? null) === handle)
    if (exact) return exact
  }
  return matches[0]
}

function evaluateCondition(nodeType: string, config: Record<string, unknown>, context: SimulationContext): { result: boolean; detail: string } {
  if (nodeType === 'condition.jurisdiction') {
    const expected = str(config, 'value', 'uae_freezone')
    const actual = context.jurisdiction
    const equals = expected === actual
    const result = str(config, 'operator', 'equals') === 'not_equals' ? !equals : equals
    return { result, detail: `jurisdiction "${actual}" ${str(config, 'operator', 'equals') === 'not_equals' ? 'is not' : 'is'} "${expected}" → ${result ? 'yes' : 'no'}` }
  }

  if (nodeType === 'condition.deal_value') {
    const amount = num(config, 'amount', 5000)
    const operator = str(config, 'operator', 'greater_than')
    const result =
      operator === 'less_than' ? context.dealValue < amount : operator === 'equals' ? context.dealValue === amount : context.dealValue > amount
    const symbol = operator === 'less_than' ? '<' : operator === 'equals' ? '=' : '>'
    return { result, detail: `deal value $${context.dealValue.toLocaleString('en-US')} ${symbol} $${amount.toLocaleString('en-US')} → ${result ? 'yes' : 'no'}` }
  }

  if (nodeType === 'condition.consent') {
    const channel = str(config, 'channel', 'email')
    const required = str(config, 'required', 'granted')
    const actual = channel === 'whatsapp' ? context.whatsappConsent : context.emailConsent
    const result = required === 'not_denied' ? actual !== 'denied' : actual === 'granted'
    return { result, detail: `${channel} consent "${actual}" (needs ${required}) → ${result ? 'yes' : 'no'}` }
  }

  return { result: true, detail: 'unknown condition — treated as yes' }
}

/** Consent is explicit in this platform: a denied channel never produces a send. */
function consentBlocked(nodeType: string, context: SimulationContext): string | null {
  if (nodeType === 'action.send_ses_email' && context.emailConsent !== 'granted') {
    return `skipped — email consent is "${context.emailConsent}", not "granted"`
  }
  if (nodeType === 'action.send_whatsapp_hsm' && context.whatsappConsent !== 'granted') {
    return `skipped — WhatsApp consent is "${context.whatsappConsent}", not "granted"`
  }
  return null
}

function actionDetail(nodeType: string, config: Record<string, unknown>, context: SimulationContext): string {
  switch (nodeType) {
    case 'action.send_whatsapp_hsm':
      return `queued HSM ${str(config, 'template', 'kyc_documents_v3')} (${str(config, 'language', 'en')})`
    case 'action.send_ses_email':
      return `queued SES send — subject "${str(config, 'subject', 'Your GCC formation update')}"`
    case 'action.assign_desk':
      return `routed to ${str(config, 'desk', 'dubai')} desk`
    case 'action.create_task':
      return `task "${str(config, 'title', 'Follow-up task')}" due in ${num(config, 'dueInDays', 1)}d`
    case 'action.wait':
      return `paused ${num(config, 'duration', 1)} ${str(config, 'unit', 'days')}`
    default:
      return context.leadScore >= 0 ? 'executed' : 'executed'
  }
}

export function simulateFlow(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  context: SimulationContext = DEFAULT_SIMULATION_CONTEXT,
): SimulatedStep[] {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const start = nodes.find((node) => node.data?.kind === 'trigger') ?? nodes[0]
  if (!start) return []

  const steps: SimulatedStep[] = []
  const visited = new Set<string>()
  let currentId: string | null = start.id

  while (currentId && !visited.has(currentId) && steps.length < MAX_STEPS) {
    visited.add(currentId)
    const node = byId.get(currentId)
    if (!node) break

    const definition = getNodeDefinition(node.data?.nodeType)
    const label = node.data?.label || definition?.label || 'Step'
    const kind: NodeKind = node.data?.kind ?? 'action'
    const config = node.data?.config ?? {}

    if (kind === 'condition') {
      const { result, detail } = evaluateCondition(node.data?.nodeType ?? '', config, context)
      steps.push({ nodeId: node.id, label, kind, status: 'passed', detail })
      const next = outgoing(edges, node.id, result ? 'yes' : 'no') ?? outgoing(edges, node.id)
      currentId = next?.target ?? null
      continue
    }

    const blocked = kind === 'action' ? consentBlocked(node.data?.nodeType ?? '', context) : null
    if (blocked) {
      steps.push({ nodeId: node.id, label, kind, status: 'skipped', detail: blocked })
    } else {
      steps.push({ nodeId: node.id, label, kind, status: 'passed', detail: actionDetail(node.data?.nodeType ?? '', config, context) })
    }

    const next = outgoing(edges, node.id)
    currentId = next?.target ?? null
  }

  return steps
}

/** Nodes the run never reached — shown greyed out so a dead branch is obvious. */
export function unreachedNodeIds(nodes: CanvasNode[], steps: SimulatedStep[]): string[] {
  const reached = new Set(steps.map((step) => step.nodeId))
  return nodes.filter((node) => !reached.has(node.id)).map((node) => node.id)
}
