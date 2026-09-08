// Real dispatcher for the FROZEN automation contract (see contract.ts).
//
// Track A owns the engine and this body. Tracks B/C/D only ever call
// emitAutomationTrigger; they must be able to compile and ship before the engine
// exists, so this function must never throw. It records the event, evaluates the
// matching active workflows, and starts their executions. Returns true when the
// engine ran without error (regardless of whether any workflow matched — an
// uneventful emit is still a successful emit, not a failure the caller can act on).

import type { AutomationTriggerName, TriggerPayload } from './contract'
import { evaluateTriggersForEvent } from './engine'
// Register every cross-track action (email.*, send_whatsapp, create_ticket) before any
// trigger can dispatch, so a workflow can act across all four tracks. Idempotent.
import { registerAllActions } from './register-all'
registerAllActions()

export async function emitAutomationTrigger<N extends AutomationTriggerName>(
  name: N,
  payload: TriggerPayload[N],
): Promise<boolean> {
  try {
    await evaluateTriggersForEvent(name, payload)
    return true
  } catch (error) {
    console.error(`[automation] trigger "${name}" failed to dispatch`, error)
    return false
  }
}
