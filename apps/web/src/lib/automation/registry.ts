// Action-handler registry for the automation engine.
//
// Track A owns the engine and the built-in CRM/utility handlers (wait, call_webhook,
// create_task, update_lead_field). The email.* actions — and any action owned by
// another track (create_ticket → Support, send_whatsapp → WhatsApp-in-CRM) — are
// registered here by those tracks and dispatched through ACTION_HANDLERS.
//
// The map is Partial so this file compiles and ships before any other track
// self-registers; an unregistered action is a logged no-op in the engine, never a
// crash. That mirrors the fail-safe shape of forwardToN8n() in integrations/n8n.ts.
//
// The registry pattern mirrors EMAIL_BLOCKS in src/puck/email-blocks/index.ts: one
// object is the source of truth and a lookup helper is the only way to read it.

// TODO: Replace with Drizzle queries
type DirectusClient<T> = any
type RestClient<T> = any
import { directus, type DirectusUserSummary } from '@/lib/directus'
import type { AutomationActionName } from './contract'
import type { AutomationGraph, AutomationNode } from './nodes'

// --- Directus access -----------------------------------------------------------
// The shared Schema in src/lib/directus.ts does not yet list the four automation
// collections. Rather than edit that file, this module widens the schema locally and
// hands back the same underlying service-token client — the same trick
// src/lib/email/client.ts uses for the email collections.

export type AutomationWorkflowItem = {
  id: string
  name?: string | null
  status?: 'draft' | 'active' | 'paused' | 'archived' | null
  trigger_name?: string | null
  trigger_config?: Record<string, unknown> | null
  graph?: AutomationGraph | null
  created_by?: string | DirectusUserSummary | null
  date_created?: string
  date_updated?: string
}

export type AutomationEventItem = {
  id: string
  workflow?: string | AutomationWorkflowItem | null
  lead_id?: string | null
  event_name?: string | null
  payload?: Record<string, unknown> | null
  date_created?: string
}

export type AutomationExecutionItem = {
  id: string
  workflow?: string | AutomationWorkflowItem | null
  lead_id?: string | null
  status?: 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled' | null
  started_at?: string | null
  finished_at?: string | null
  last_error?: string | null
  date_created?: string
}

export type AutomationExecutionLogItem = {
  id: string
  execution?: string | AutomationExecutionItem | null
  node_id?: string | null
  status?: 'running' | 'succeeded' | 'failed' | 'waiting' | null
  message?: string | null
  date_created?: string
}

export type AutomationSchema = { [key: string]: any } & {
  automation_workflows: AutomationWorkflowItem[]
  automation_events: AutomationEventItem[]
  automation_executions: AutomationExecutionItem[]
  automation_execution_logs: AutomationExecutionLogItem[]
}

export type AutomationClient = DirectusClient<AutomationSchema> & RestClient<AutomationSchema>

/** Service-token client, widened to the automation collections. Server-only. */
export function automationDirectus(): AutomationClient {
  return directus() as unknown as AutomationClient
}

/** Every Directus read/write in the engine degrades to empty and logs — never a
 * silent catch. Mirrors logDirectusError() in src/lib/directus.ts (which is not
 * exported), so a hiccup is visible instead of looking like a genuinely empty set. */
export function logAutomationError(context: string, error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status
  const errors = (error as { errors?: Array<{ message?: string }> })?.errors
  const message = Array.isArray(errors) && errors.length
    ? errors.map((e) => e?.message ?? 'unknown error').join('; ')
    : error instanceof Error
      ? error.message
      : String(error)
  console.error(`[automation] ${context} failed: ${status ? `${status} ` : ''}${message}`)
}

// --- action-handler registry ---------------------------------------------------

/** What one node's action returned. `waiting` parks the execution until resumeAt. */
export type ActionOutcome = {
  ok: boolean
  status: 'succeeded' | 'failed' | 'waiting'
  resumeAt?: string
  /** For condition nodes: the target node id to jump to, resolved to an index by runGraph. */
  branchTo?: string
  error?: string
}

export type ActionHandlerContext = {
  client: AutomationClient
  execution: AutomationExecutionItem
  node: AutomationNode
}

export type ActionHandler = (
  ctx: ActionHandlerContext,
  payload: Record<string, unknown>,
) => Promise<ActionOutcome>

export const ACTION_HANDLERS: Partial<Record<AutomationActionName, ActionHandler>> = {}

export function registerActionHandler(name: AutomationActionName, handler: ActionHandler) {
  ACTION_HANDLERS[name] = handler
}

export function getActionHandler(name: AutomationActionName): ActionHandler | null {
  return ACTION_HANDLERS[name] ?? null
}
