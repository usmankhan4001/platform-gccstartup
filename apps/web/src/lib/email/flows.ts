/**
 * The drip engine: enrolment, and step advancement.
 *
 * A flow is a list of ordered steps, each with a delay and a template. An enrollment
 * is one lead's position in one flow. `/api/jobs/tick` calls the two functions here
 * once a minute; nothing else moves an enrollment forward.
 *
 * Three things make this safe to run on a schedule against real people:
 *
 *  1. **Enrolment is bounded by the flow's own creation date.** Activating a
 *     `lead_status` flow could otherwise mail the entire historical database on its
 *     first tick. Only leads created at or after the flow was created are enrolled,
 *     unless `trigger_config.include_existing` is explicitly true. That default is
 *     deliberately the boring one.
 *
 *  2. **Advancement is a compare-and-swap on `next_run_at`.** Two ticks running at
 *     once both read the same due enrollment; only the one whose UPDATE still matches
 *     the timestamp it read wins, and the loser does nothing. This is the same
 *     optimistic-lock shape `email_sync_jobs` uses.
 *
 *  3. **The step does not send — it enqueues.** A `flow_step` job carries the
 *     idempotency key `flow:<flow>:lead:<lead>:step:<step>`, so a step can be
 *     enqueued twice and still only ever be sent once.
 *
 * `email_flow_enrollments.enrollment_key` holds `${flow}:${lead}` and is the stand-in
 * for the composite unique constraint the fields API cannot express. It is indexed
 * but — verified against production — NOT actually unique, so `enrollLead` reads
 * before it creates and cancels any duplicate a race manages to produce.
 */
// TODO: Replace with Drizzle queries
const createItem = (...args: any[]) => ({} as any)
const readItems = (...args: any[]) => ([] as any)
const updateItem = (...args: any[]) => ({} as any)
const updateItems = (...args: any[]) => ([] as any)
import type { LeadItem } from '@/lib/directus'
import { normalizeFilter, resolveSegment } from './segments'
import { marketableLeadFilter } from './suppression'
import { enqueueEmailJob } from './send'
import { relationId, type EmailClient, type EmailFlowItem, type EmailFlowStepItem } from './client'

const FLOW_FIELDS = ['id', 'name', 'slug', 'trigger_type', 'trigger_config', 'status', 'date_created'] as const
const STEP_FIELDS = ['id', 'flow', 'sort', 'delay_minutes', 'template', 'subject_override', 'condition'] as const
const ENROLLMENT_FIELDS = ['id', 'flow', 'lead', 'enrollment_key', 'current_step', 'status', 'next_run_at', 'enrolled_at', 'last_step_at'] as const

function integerEnv(name: string, fallback: number, minimum: number, maximum: number) {
  const value = Number(process.env[name])
  return Number.isInteger(value) && value >= minimum && value <= maximum ? value : fallback
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

export function enrollmentKey(flowId: string, leadId: string): string {
  return `${flowId}:${leadId}`.slice(0, 250)
}

/** Ordered steps, lowest `sort` first. A null sort is treated as 0 so a half-configured flow still runs. */
export async function loadFlowSteps(client: EmailClient, flowId: string): Promise<EmailFlowStepItem[]> {
  const steps = await client.request(
    readItems('email_flow_steps', { filter: { flow: { _eq: flowId } }, fields: [...STEP_FIELDS], sort: ['sort'], limit: 100 }),
  )
  return [...steps].sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0))
}

function nextStepFrom(steps: EmailFlowStepItem[], currentStep: number): EmailFlowStepItem | null {
  return steps.find((step) => (step.sort ?? 0) >= currentStep) ?? null
}

// ---------------------------------------------------------------------------
// Enrolment
// ---------------------------------------------------------------------------

export type EnrollResult = { ok: boolean; enrollmentId: string | null; created: boolean; reason?: string }

/**
 * Puts one lead into one flow. Idempotent on `enrollment_key`, and re-activating a
 * cancelled enrollment is a deliberate no-op — someone cancelled it for a reason, and
 * a trigger re-firing must not undo that. Only a caller passing `reenroll` may.
 */
export async function enrollLead(
  client: EmailClient,
  input: { flowId: string; leadId: string; steps?: EmailFlowStepItem[]; reenroll?: boolean },
): Promise<EnrollResult> {
  const key = enrollmentKey(input.flowId, input.leadId)

  const existing = await client.request(
    readItems('email_flow_enrollments', { filter: { enrollment_key: { _eq: key } }, fields: [...ENROLLMENT_FIELDS], sort: ['id'], limit: 5 }),
  )

  // No unique constraint backs enrollment_key, so a race can leave two rows. Keep the
  // first and cancel the rest rather than deleting — the audit trail matters more.
  if (existing.length > 1) {
    for (const duplicate of existing.slice(1)) {
      await client
        .request(updateItem('email_flow_enrollments', duplicate.id, { status: 'cancelled', last_error: 'Duplicate enrollment collapsed' }))
        .catch((error: any) => console.error('[email/flows] could not collapse duplicate enrollment', error))
    }
  }

  if (existing[0]) {
    if (!input.reenroll) return { ok: true, enrollmentId: existing[0].id, created: false, reason: 'already_enrolled' }
    await client.request(
      updateItem('email_flow_enrollments', existing[0].id, {
        status: 'active',
        current_step: 0,
        next_run_at: new Date().toISOString(),
        last_error: null,
        completed_at: null,
      }),
    )
    return { ok: true, enrollmentId: existing[0].id, created: false, reason: 'reenrolled' }
  }

  const steps = input.steps ?? (await loadFlowSteps(client, input.flowId))
  const first = steps[0]
  const now = Date.now()
  // The first step's delay counts from enrolment, so a "wait 1 day, then send" flow
  // does not fire the moment the lead lands.
  const firstRunAt = new Date(now + Math.max(0, first?.delay_minutes ?? 0) * 60_000).toISOString()

  try {
    const created = await client.request(
      createItem('email_flow_enrollments', {
        flow: input.flowId,
        lead: input.leadId,
        enrollment_key: key,
        current_step: 0,
        status: 'active',
        next_run_at: firstRunAt,
        enrolled_at: new Date(now).toISOString(),
      }),
    )
    return { ok: true, enrollmentId: created.id, created: true }
  } catch (error) {
    const raced = await client
      .request(readItems('email_flow_enrollments', { filter: { enrollment_key: { _eq: key } }, fields: ['id'], limit: 1 }))
      .catch(() => [])
    if (raced[0]) return { ok: true, enrollmentId: raced[0].id, created: false, reason: 'raced' }
    console.error('[email/flows] failed to create enrollment', error)
    return { ok: false, enrollmentId: null, created: false, reason: 'create_failed' }
  }
}

/**
 * The candidate audience for one flow's trigger, already AND-ed with the marketable
 * gate so an unsubscribed lead can never be enrolled in the first place.
 *
 * `manual` resolves to nothing — those enrollments come from the CRM's "Enrol in
 * flow" action, not from the tick.
 */
export async function resolveTriggerFilter(client: EmailClient, flow: EmailFlowItem & { date_created?: string }): Promise<Record<string, unknown> | null> {
  const config = objectValue(flow.trigger_config)
  const clauses: Record<string, unknown>[] = [marketableLeadFilter()]

  switch (flow.trigger_type) {
    case 'lead_created':
      break
    case 'lead_status': {
      const status = typeof config.status === 'string' ? config.status.trim() : ''
      if (!status) return null
      clauses.push({ status: { _eq: status } })
      break
    }
    case 'segment': {
      const segment = await resolveSegment(client, {
        segmentId: typeof config.segment === 'string' && config.segment.includes('-') ? config.segment : null,
        segmentSlug: typeof config.segment === 'string' ? config.segment : null,
        filter: config.filter,
      })
      if (!segment.filter) return null
      clauses.push(segment.filter)
      break
    }
    default:
      return null
  }

  const inline = normalizeFilter(config.filter)
  if (inline && flow.trigger_type !== 'segment') clauses.push(inline)

  /**
   * The safety rail. Without it, switching a flow to `active` enrols every lead that
   * has ever matched — years of them — and mails them all on the next tick.
   */
  if (config.include_existing !== true) {
    const since = typeof config.since === 'string' && !Number.isNaN(Date.parse(config.since)) ? config.since : flow.date_created
    if (since) clauses.push({ date_created: { _gte: since } })
  }

  return { _and: clauses }
}

export type EnrollmentSweep = { flows: number; considered: number; enrolled: number; errors: string[] }

/**
 * One pass over every active flow, enrolling whatever its trigger now matches.
 * Bounded per flow so one very broad trigger cannot monopolise a tick; the remainder
 * is picked up on the next run.
 */
export async function enrollLeadsForActiveFlows(client: EmailClient, options: { perFlowLimit?: number; deadlineAt?: number } = {}): Promise<EnrollmentSweep> {
  const perFlowLimit = Math.min(Math.max(Math.trunc(options.perFlowLimit ?? integerEnv('EMAIL_FLOW_ENROLL_BATCH', 100, 1, 500)), 1), 500)
  const sweep: EnrollmentSweep = { flows: 0, considered: 0, enrolled: 0, errors: [] }

  const flows = await client.request(
    readItems('email_flows', {
      filter: { status: { _eq: 'active' }, trigger_type: { _neq: 'manual' } },
      fields: [...FLOW_FIELDS],
      sort: ['date_created'],
      limit: 50,
    }),
  )

  for (const flow of flows) {
    if (options.deadlineAt && Date.now() > options.deadlineAt) break
    sweep.flows += 1

    try {
      const filter = await resolveTriggerFilter(client, flow)
      if (!filter) continue

      const steps = await loadFlowSteps(client, flow.id)
      if (!steps.length) continue

      const candidates = (await client.request(
        readItems('leads', { filter, fields: ['id'], sort: ['-date_created'], limit: perFlowLimit }),
      )) as Array<Pick<LeadItem, 'id'>>
      if (!candidates.length) continue
      sweep.considered += candidates.length

      // One query for the whole page rather than a read per lead.
      const keys = candidates.map((lead) => enrollmentKey(flow.id, lead.id))
      const known = new Set<string>()
      for (let index = 0; index < keys.length; index += 100) {
        const chunk = keys.slice(index, index + 100)
        const rows = await client.request(
          readItems('email_flow_enrollments', { filter: { enrollment_key: { _in: chunk } }, fields: ['enrollment_key'], limit: chunk.length }),
        )
        for (const row of rows) if (row.enrollment_key) known.add(row.enrollment_key)
      }

      for (const lead of candidates) {
        if (known.has(enrollmentKey(flow.id, lead.id))) continue
        const result = await enrollLead(client, { flowId: flow.id, leadId: lead.id, steps })
        if (result.created) sweep.enrolled += 1
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      sweep.errors.push(`${flow.slug ?? flow.id}: ${message.slice(0, 200)}`)
      console.error(`[email/flows] enrolment sweep failed for flow ${flow.id}`, error)
    }
  }

  return sweep
}

// ---------------------------------------------------------------------------
// Advancement
// ---------------------------------------------------------------------------

export type AdvanceSummary = { selected: number; advanced: number; completed: number; skipped: number; failed: number }

async function finishEnrollment(client: EmailClient, enrollmentId: string, status: 'completed' | 'cancelled' | 'failed', error?: string) {
  await client
    .request(
      updateItem('email_flow_enrollments', enrollmentId, {
        status,
        next_run_at: null,
        completed_at: new Date().toISOString(),
        ...(error ? { last_error: error.slice(0, 1000) } : {}),
      }),
    )
    .catch((cause: any) => console.error('[email/flows] could not close enrollment', cause))
}

/**
 * Runs every enrollment whose `next_run_at` has passed.
 *
 * The claim is a compare-and-swap: the UPDATE only matches while `next_run_at` is
 * still the value that was read, and it pushes the timestamp forward by a lease. Two
 * concurrent ticks therefore cannot both enqueue the same step, and a run that dies
 * mid-step leaves the enrollment to be retried once the lease expires.
 */
export async function advanceDueEnrollments(client: EmailClient, options: { limit?: number; deadlineAt?: number } = {}): Promise<AdvanceSummary> {
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? integerEnv('EMAIL_FLOW_ADVANCE_BATCH', 50, 1, 500)), 1), 500)
  const leaseMinutes = integerEnv('EMAIL_FLOW_LEASE_MINUTES', 10, 1, 120)
  const now = new Date().toISOString()

  const due = await client.request(
    readItems('email_flow_enrollments', {
      filter: { status: { _eq: 'active' }, next_run_at: { _nnull: true, _lte: now } as never },
      fields: [...ENROLLMENT_FIELDS],
      sort: ['next_run_at'],
      limit,
    }),
  )

  const summary: AdvanceSummary = { selected: due.length, advanced: 0, completed: 0, skipped: 0, failed: 0 }

  for (const enrollment of due) {
    if (options.deadlineAt && Date.now() > options.deadlineAt) break

    const flowId = relationId(enrollment.flow)
    const leadId = relationId(enrollment.lead)
    if (!flowId || !leadId) {
      await finishEnrollment(client, enrollment.id, 'failed', 'Enrollment is missing its flow or lead')
      summary.failed += 1
      continue
    }

    const claimed = await client.request(
      updateItems(
        'email_flow_enrollments',
        { filter: { id: { _eq: enrollment.id }, status: { _eq: 'active' }, next_run_at: { _eq: enrollment.next_run_at } as never } },
        { next_run_at: new Date(Date.now() + leaseMinutes * 60_000).toISOString() },
        { fields: ['id'] },
      ),
    )
    if (!claimed.length) continue

    try {
      const flows = await client.request(readItems('email_flows', { filter: { id: { _eq: flowId } }, fields: [...FLOW_FIELDS], limit: 1 }))
      const flow = flows[0]
      if (!flow) {
        await finishEnrollment(client, enrollment.id, 'failed', 'Flow no longer exists')
        summary.failed += 1
        continue
      }
      // A paused flow holds its enrollments in place; it does not cancel them.
      if (flow.status !== 'active') {
        await client.request(updateItem('email_flow_enrollments', enrollment.id, { next_run_at: new Date(Date.now() + 3_600_000).toISOString() }))
        summary.skipped += 1
        continue
      }

      const steps = await loadFlowSteps(client, flowId)
      const step = nextStepFrom(steps, enrollment.current_step ?? 0)
      if (!step) {
        await finishEnrollment(client, enrollment.id, 'completed')
        summary.completed += 1
        continue
      }

      const templateId = relationId(step.template)
      const stepSort = step.sort ?? 0
      const condition = normalizeFilter(step.condition)
      let send = Boolean(templateId)

      // Re-checked against the lead immediately before sending, not when the lead was
      // enrolled — a three-day-old enrolment says nothing about today's lead state.
      if (send && condition) {
        const matches = await client.request(
          readItems('leads', { filter: { _and: [{ id: { _eq: leadId } }, condition] }, fields: ['id'], limit: 1 }),
        )
        if (!matches.length) send = false
      }

      if (send && templateId) {
        await enqueueEmailJob(client, {
          jobType: 'flow_step',
          idempotencyKey: `flow:${flowId}:lead:${leadId}:step:${step.id}`,
          leadId,
          payload: {
            enrollmentId: enrollment.id,
            flowId,
            flowName: flow.name ?? flow.slug ?? flowId,
            stepId: step.id,
            leadId,
            templateId,
            ...(step.subject_override ? { subjectOverride: step.subject_override } : {}),
            activityTitle: `Flow step ${stepSort + 1}: ${flow.name ?? flow.slug ?? 'email flow'}`,
          },
        })
        summary.advanced += 1
      } else {
        summary.skipped += 1
      }

      const following = nextStepFrom(steps, stepSort + 1)
      if (!following) {
        await finishEnrollment(client, enrollment.id, 'completed')
        summary.completed += 1
        continue
      }

      await client.request(
        updateItem('email_flow_enrollments', enrollment.id, {
          current_step: stepSort + 1,
          last_step_at: new Date().toISOString(),
          next_run_at: new Date(Date.now() + Math.max(0, following.delay_minutes ?? 0) * 60_000).toISOString(),
          last_error: null,
        }),
      )
    } catch (error) {
      summary.failed += 1
      const message = error instanceof Error ? error.message : 'Unexpected error advancing enrollment'
      console.error(`[email/flows] failed to advance enrollment ${enrollment.id}`, error)
      // Left active with the lease standing, so the next tick retries rather than
      // dropping the lead out of the flow on one bad request.
      await client
        .request(updateItem('email_flow_enrollments', enrollment.id, { last_error: message.slice(0, 1000) }))
        .catch(() => {})
    }
  }

  return summary
}

/**
 * Stops every active flow for one lead. Called by the unsubscribe route: suppression
 * blocks the send anyway, but leaving the enrollments running would keep generating
 * jobs that skip, and would misreport the lead as still being in a flow.
 */
export async function cancelEnrollmentsForLead(client: EmailClient, leadId: string, reason: string): Promise<number> {
  const active = await client.request(
    readItems('email_flow_enrollments', { filter: { lead: { _eq: leadId }, status: { _eq: 'active' } }, fields: ['id'], limit: 200 }),
  )
  let cancelled = 0
  for (const enrollment of active) {
    const claimed = await client.request(
      updateItems(
        'email_flow_enrollments',
        { filter: { id: { _eq: enrollment.id }, status: { _eq: 'active' } } },
        { status: 'cancelled', next_run_at: null, completed_at: new Date().toISOString(), last_error: reason.slice(0, 1000) },
        { fields: ['id'] },
      ),
    )
    if (claimed.length) cancelled += 1
  }
  return cancelled
}

/** Manual cancel, for the CRM drawer. */
export async function cancelEnrollment(client: EmailClient, enrollmentId: string, reason: string): Promise<boolean> {
  const claimed = await client.request(
    updateItems(
      'email_flow_enrollments',
      { filter: { id: { _eq: enrollmentId }, status: { _eq: 'active' } } },
      { status: 'cancelled', next_run_at: null, completed_at: new Date().toISOString(), last_error: reason.slice(0, 1000) },
      { fields: ['id'] },
    ),
  )
  return claimed.length > 0
}
