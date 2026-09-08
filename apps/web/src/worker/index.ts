// Background worker for the GCC Startup Platform.
// Runs as its own container (docker-compose `worker` service) and processes:
//   - the durable outbox (email + WhatsApp + webhook deliveries)
//   - scheduled campaign dispatch (email and WhatsApp)
//   - flow enrollment + advancement
//   - compliance reminders
//
// Every stage delegates to the lib implementations so the API routes and the
// worker share one code path. A stage failure is logged and never kills the loop.

import { setInterval } from 'timers/promises'
import { reapStaleJobs, drainOutbox, dispatchDueCampaigns } from '../lib/email/send'
import { enrollLeadsForActiveFlows, advanceDueEnrollments } from '../lib/email/flows'
import { evaluateUpcomingRenewals } from '../lib/crm/automation'
import { dispatchDueWhatsappCampaigns, drainWhatsappJobs } from './dispatcher'
import { processOutboundWebhooks } from './outbound-webhooks'

const TICK_INTERVAL_MS = 60_000 // Run every 60 seconds
const BUDGET_MS = 45_000 // 45 seconds per tick (leave buffer)

async function tick() {
  const start = Date.now()
  console.log(`[worker] Tick started at ${new Date().toISOString()}`)

  const stages = [
    { name: 'reap', fn: () => reapStaleJobs(null) },
    { name: 'drain', fn: drainAll },
    { name: 'campaigns', fn: dispatchCampaigns },
    { name: 'flows', fn: advanceFlows },
    { name: 'compliance', fn: checkCompliance },
    { name: 'webhooks', fn: () => processOutboundWebhooks() },
  ]

  for (const stage of stages) {
    if (Date.now() - start > BUDGET_MS) {
      console.log(`[worker] Budget exceeded, skipping remaining stages`)
      break
    }
    try {
      await stage.fn()
      console.log(`[worker] ${stage.name} completed`)
    } catch (err) {
      console.error(`[worker] ${stage.name} failed:`, err)
    }
  }

  console.log(`[worker] Tick completed in ${Date.now() - start}ms`)
}

// Email jobs (send_email / flow_email / log_event) are drained by the email
// lib; WhatsApp jobs (send_whatsapp / campaign_dispatch) by the dispatcher.
async function drainAll() {
  const email = await drainOutbox(null)
  const whatsapp = await drainWhatsappJobs()
  console.log(
    `[worker] drain: email ${email.succeeded}/${email.selected} ok, whatsapp ${whatsapp.succeeded}/${whatsapp.selected} ok`,
  )
}

async function dispatchCampaigns() {
  await dispatchDueCampaigns(null)
  await dispatchDueWhatsappCampaigns()
}

async function advanceFlows() {
  await enrollLeadsForActiveFlows(null)
  await advanceDueEnrollments(null)
}

async function checkCompliance() {
  await evaluateUpcomingRenewals()
}

// Start worker loop
console.log('[worker] Background worker started')
console.log(`[worker] Tick interval: ${TICK_INTERVAL_MS}ms`)
console.log(`[worker] Budget per tick: ${BUDGET_MS}ms`)

for await (const _ of setInterval(TICK_INTERVAL_MS)) {
  await tick()
}
