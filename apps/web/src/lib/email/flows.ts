/**
 * The drip engine: enrolment, and step advancement.
 *
 * A flow is a list of ordered `flow_steps`, each with a delay and a template in its
 * `config`. An enrollment is one contact's position in one flow. The outbox drainer
 * calls the two sweep functions here once a tick; nothing else moves an enrollment
 * forward.
 *
 * Three things make this safe to run on a schedule against real people:
 *
 *  1. **Enrolment is bounded by the flow's own creation date.** Activating a trigger
 *     could otherwise enrol the entire historical database on its first tick. Only
 *     contacts created at or after the flow was created are enrolled, unless
 *     `trigger_config.include_existing` is explicitly true.
 *
 *  2. **Advancement is a compare-and-swap on `next_run_at`.** Two ticks racing on the
 *     same due enrollment: only the one whose UPDATE still matches the timestamp it
 *     read wins, and the loser does nothing.
 *
 *  3. **The step does not send — it enqueues.** A `flow_email` outbox job carries the
 *     idempotency key `flow:<flow>:contact:<contact>:step:<step>`, so a step can be
 *     enqueued twice and still only ever be sent once.
 *
 * `flow_enrollments.enrollment_key` is UNIQUE in the database, so a race to enrol the
 * same contact twice loses cleanly instead of producing duplicates.
 */
import { randomUUID } from 'node:crypto'
import { and, asc, eq, gte, inArray, isNull, ne, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, flow_enrollments, flow_logs, flow_steps, flows } from '@gccstartup/db'
import { loadFlowStepsById, type EmailFlowItem, type EmailFlowStepItem } from './client'
import { normalizeFilter } from './segments'
import { marketableContactWhere } from './suppression'
import { enqueueEmailJob } from './send'

function integerEnv(name: string, fallback: number, minimum: number, maximum: number) {
  const value = Number(process.env[name])
  return Number.isInteger(value) && value >= minimum && value <= maximum ? value : fallback
}

export function enrollmentKey(flowId: string, contactId: string): string {
  return `${flowId}:${contactId}`.slice(0, 200)
}

/** Ordered steps, lowest `step_index` first. */
export async function loadFlowSteps(_client: unknown, flowId: string): Promise<EmailFlowStepItem[]> {
  return loadFlowStepsById(flowId)
}

function stepDelayMinutes(step: EmailFlowStepItem): number {
  const raw = step.config?.delay_minutes
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : 0
}

function stepTemplateId(step: EmailFlowStepItem): string | null {
  const raw = step.config?.templateId
  return typeof raw === 'string' && raw ? raw : null
}

function nextStepFrom(steps: EmailFlowStepItem[], currentStep: number): EmailFlowStepItem | null {
  return steps.find((step) => step.step_index >= currentStep) ?? null
}

// ---------------------------------------------------------------------------
// Enrolment
// ---------------------------------------------------------------------------

export type EnrollResult = { ok: boolean; enrollmentId: string | null; created: boolean; reason?: string }

/**
 * Puts one contact into one flow. Idempotent on the unique `enrollment_key`, and
 * re-activating a cancelled enrollment is a deliberate no-op — someone cancelled it
 * for a reason, and a trigger re-firing must not undo that. Only a caller passing
 * `reenroll` may.
 */
export async function enrollLead(
  _client: unknown,
  input: { flowId: string; leadId: string; steps?: EmailFlowStepItem[]; reenroll?: boolean },
): Promise<EnrollResult> {
  const key = enrollmentKey(input.flowId, input.leadId)

  const existingRows = await db
    .select()
    .from(flow_enrollments)
    .where(eq(flow_enrollments.enrollment_key, key))
    .limit(1)
  const existing = existingRows[0]

  if (existing) {
    if (!input.reenroll) return { ok: true, enrollmentId: existing.id, created: false, reason: 'already_enrolled' }
    await db
      .update(flow_enrollments)
      .set({
        status: 'active',
        current_step: 0,
        next_run_at: new Date(),
        completed_at: null,
        updated_at: new Date(),
      })
      .where(eq(flow_enrollments.id, existing.id))
    return { ok: true, enrollmentId: existing.id, created: false, reason: 'reenrolled' }
  }

  const steps = input.steps ?? (await loadFlowStepsById(input.flowId))
  const first = steps[0]
  // The first step's delay counts from enrolment, so a "wait 1 day, then send" flow
  // does not fire the moment the contact lands.
  const firstRunAt = new Date(Date.now() + Math.max(0, first ? stepDelayMinutes(first) : 0) * 60_000)

  try {
    const created = await db
      .insert(flow_enrollments)
      .values({
        id: randomUUID(),
        flow_id: input.flowId,
        contact_id: input.leadId,
        enrollment_key: key,
        current_step: 0,
        status: 'active',
        next_run_at: firstRunAt,
        variables: {},
      })
      .returning({ id: flow_enrollments.id })
    return { ok: true, enrollmentId: created[0]?.id ?? null, created: true }
  } catch (error) {
    const raced = await db
      .select({ id: flow_enrollments.id })
      .from(flow_enrollments)
      .where(eq(flow_enrollments.enrollment_key, key))
      .limit(1)
    if (raced[0]) return { ok: true, enrollmentId: raced[0].id, created: false, reason: 'raced' }
    console.error('[email/flows] failed to create enrollment', error)
    return { ok: false, enrollmentId: null, created: false, reason: 'create_failed' }
  }
}

/**
 * The candidate audience for one flow's trigger, already AND-ed with the marketable
 * gate so an unsubscribed contact can never be enrolled in the first place.
 *
 * `manual` resolves to nothing — those enrollments come from the CRM action, not
 * from the tick. Trigger types the platform models as events (`form_submitted`,
 * `tag_added`, `deal_stage_changed`, `event_based`, `date_based`) are fired by the
 * automation engine directly and resolve to nothing here either; only
 * `lead_created` is a sweepable audience.
 */
export async function resolveTriggerFilter(
  _client: unknown,
  flow: EmailFlowItem,
): Promise<ReturnType<typeof marketableContactWhere> | null> {
  const config = flow.trigger_config ?? {}

  switch (flow.trigger_type) {
    case 'lead_created':
      break
    default:
      return null
  }

  const clauses = [marketableContactWhere()]

  /**
   * The safety rail. Without it, switching a flow to `active` enrols every contact
   * that has ever matched — years of them — and mails them all on the next tick.
   */
  if (config.include_existing !== true) {
    const since =
      typeof config.since === 'string' && !Number.isNaN(Date.parse(config.since))
        ? new Date(config.since)
        : flow.created_at
    if (since) clauses.push(gte(contacts.created_at, since))
  }

  const inline = normalizeFilter(config.filter)
  if (inline) {
    for (const [key, value] of Object.entries(inline)) {
      if (key === 'source' && typeof value === 'string' && value) clauses.push(eq(contacts.source, value))
      if (key === 'company' && typeof value === 'string' && value) clauses.push(eq(contacts.company, value))
    }
  }

  return and(...clauses)
}

export type EnrollmentSweep = { flows: number; considered: number; enrolled: number; errors: string[] }

/**
 * One pass over every active sweepable flow, enrolling whatever its trigger now
 * matches. Bounded per flow so one very broad trigger cannot monopolise a tick; the
 * remainder is picked up on the next run.
 */
export async function enrollLeadsForActiveFlows(
  _client: unknown,
  options: { perFlowLimit?: number; deadlineAt?: number } = {},
): Promise<EnrollmentSweep> {
  const perFlowLimit = Math.min(Math.max(Math.trunc(options.perFlowLimit ?? integerEnv('EMAIL_FLOW_ENROLL_BATCH', 100, 1, 500)), 1), 500)
  const sweep: EnrollmentSweep = { flows: 0, considered: 0, enrolled: 0, errors: [] }

  const activeFlows = await db
    .select()
    .from(flows)
    .where(and(eq(flows.status, 'active'), ne(flows.trigger_type, 'manual')))
    .orderBy(asc(flows.created_at))
    .limit(50)

  for (const row of activeFlows) {
    if (options.deadlineAt && Date.now() > options.deadlineAt) break
    sweep.flows += 1

    const flow: EmailFlowItem = {
      id: row.id,
      name: row.name,
      description: row.description,
      trigger_type: row.trigger_type,
      trigger_config: row.trigger_config ?? {},
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }

    try {
      const where = await resolveTriggerFilter(null, flow)
      if (!where) continue

      const steps = await loadFlowStepsById(flow.id)
      if (!steps.length) continue

      const candidates = await db
        .select({ id: contacts.id })
        .from(contacts)
        .where(where)
        .orderBy(asc(contacts.created_at))
        .limit(perFlowLimit)
      if (!candidates.length) continue
      sweep.considered += candidates.length

      // One query for the whole page rather than a read per contact.
      const keys = candidates.map((contact) => enrollmentKey(flow.id, contact.id))
      const known = new Set<string>()
      for (let index = 0; index < keys.length; index += 100) {
        const chunk = keys.slice(index, index + 100)
        const rows = await db
          .select({ enrollment_key: flow_enrollments.enrollment_key })
          .from(flow_enrollments)
          .where(inArray(flow_enrollments.enrollment_key, chunk))
        for (const knownRow of rows) known.add(knownRow.enrollment_key)
      }

      for (const contact of candidates) {
        if (known.has(enrollmentKey(flow.id, contact.id))) continue
        const result = await enrollLead(null, { flowId: flow.id, leadId: contact.id, steps })
        if (result.created) sweep.enrolled += 1
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      sweep.errors.push(`${flow.id}: ${message.slice(0, 200)}`)
      console.error(`[email/flows] enrolment sweep failed for flow ${flow.id}`, error)
    }
  }

  return sweep
}

// ---------------------------------------------------------------------------
// Advancement
// ---------------------------------------------------------------------------

export type AdvanceSummary = { selected: number; advanced: number; completed: number; skipped: number; failed: number }

type EnrollmentRow = typeof flow_enrollments.$inferSelect

async function finishEnrollment(enrollmentId: string, status: 'completed' | 'cancelled', error?: string) {
  await db
    .update(flow_enrollments)
    .set({
      status,
      next_run_at: null,
      completed_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(flow_enrollments.id, enrollmentId))
    .catch((cause) => console.error('[email/flows] could not close enrollment', cause))

  if (error) {
    await db
      .insert(flow_logs)
      .values({
        id: randomUUID(),
        enrollment_id: enrollmentId,
        step_index: -1,
        status: 'failed',
        result: {},
        error: error.slice(0, 1000),
      })
      .catch((cause) => console.error('[email/flows] could not write failure log', cause))
  }
}

/**
 * Runs every enrollment whose `next_run_at` has passed.
 *
 * The claim is a compare-and-swap: the UPDATE only matches while `next_run_at` is
 * still the value that was read, and it pushes the timestamp forward by a lease. Two
 * concurrent ticks therefore cannot both enqueue the same step, and a run that dies
 * mid-step leaves the enrollment to be retried once the lease expires.
 */
export async function advanceDueEnrollments(
  _client: unknown,
  options: { limit?: number; deadlineAt?: number } = {},
): Promise<AdvanceSummary> {
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? integerEnv('EMAIL_FLOW_ADVANCE_BATCH', 50, 1, 500)), 1), 500)
  const leaseMinutes = integerEnv('EMAIL_FLOW_LEASE_MINUTES', 10, 1, 120)

  const due = await db
    .select()
    .from(flow_enrollments)
    .where(and(eq(flow_enrollments.status, 'active'), isNull(flow_enrollments.completed_at), sql`${flow_enrollments.next_run_at} is not null and ${flow_enrollments.next_run_at} <= now()`))
    .orderBy(asc(flow_enrollments.next_run_at))
    .limit(limit)

  const summary: AdvanceSummary = { selected: due.length, advanced: 0, completed: 0, skipped: 0, failed: 0 }

  for (const enrollment of due) {
    if (options.deadlineAt && Date.now() > options.deadlineAt) break
    const claimed = await advanceEnrollment(enrollment, leaseMinutes)
    summary[claimed.outcome] += 1
  }

  return summary
}

async function advanceEnrollment(enrollment: EnrollmentRow, leaseMinutes: number): Promise<{ outcome: 'advanced' | 'completed' | 'skipped' | 'failed' }> {
  // The claim: only the tick that still sees the read `next_run_at` wins.
  const leaseUntil = new Date(Date.now() + leaseMinutes * 60_000)
  const claimed = await db
    .update(flow_enrollments)
    .set({ next_run_at: leaseUntil, updated_at: new Date() })
    .where(
      and(
        eq(flow_enrollments.id, enrollment.id),
        eq(flow_enrollments.status, 'active'),
        enrollment.next_run_at ? eq(flow_enrollments.next_run_at, enrollment.next_run_at) : isNull(flow_enrollments.next_run_at),
      ),
    )
    .returning({ id: flow_enrollments.id })
  if (!claimed.length) return { outcome: 'skipped' }

  try {
    const flowRows = await db.select().from(flows).where(eq(flows.id, enrollment.flow_id)).limit(1)
    const flow = flowRows[0]
    if (!flow) {
      await finishEnrollment(enrollment.id, 'cancelled', 'Flow no longer exists')
      return { outcome: 'failed' }
    }
    // A paused flow holds its enrollments in place; it does not cancel them.
    if (flow.status !== 'active') {
      await db
        .update(flow_enrollments)
        .set({ next_run_at: new Date(Date.now() + 3_600_000), updated_at: new Date() })
        .where(eq(flow_enrollments.id, enrollment.id))
      return { outcome: 'skipped' }
    }

    const steps = await loadFlowStepsById(flow.id)
    const step = nextStepFrom(steps, enrollment.current_step)
    if (!step) {
      await finishEnrollment(enrollment.id, 'completed')
      return { outcome: 'completed' }
    }

    const templateId = stepTemplateId(step)
    let send = Boolean(templateId)

    // Re-checked against the contact immediately before sending, not when the contact
    // was enrolled — a three-day-old enrolment says nothing about today's consent.
    if (send) {
      const contactRows = await db.select().from(contacts).where(eq(contacts.id, enrollment.contact_id)).limit(1)
      const contact = contactRows[0]
      if (!contact || contact.deleted_at || contact.unsubscribed_at || contact.email_consent !== 'granted') send = false
    }

    if (send && templateId) {
      await enqueueEmailJob(null, {
        jobType: 'flow_email',
        idempotencyKey: `flow:${flow.id}:contact:${enrollment.contact_id}:step:${step.id}`,
        payload: {
          enrollmentId: enrollment.id,
          flowId: flow.id,
          flowName: flow.name,
          stepId: step.id,
          stepIndex: step.step_index,
          contactId: enrollment.contact_id,
          templateId,
          ...(typeof step.config?.subjectOverride === 'string' ? { subjectOverride: step.config.subjectOverride } : {}),
          activityTitle: `Flow step ${step.step_index + 1}: ${flow.name || 'email flow'}`,
        },
      })
      await db
        .update(flow_enrollments)
        .set({
          current_step: step.step_index + 1,
          next_run_at: nextRunAtFor(steps, step),
          updated_at: new Date(),
        })
        .where(eq(flow_enrollments.id, enrollment.id))
      await db.insert(flow_logs).values({
        id: randomUUID(),
        enrollment_id: enrollment.id,
        step_index: step.step_index,
        status: 'pending',
        result: { stepId: step.id, templateId, jobType: 'flow_email' },
      })
      return { outcome: 'advanced' }
    }

    // Not sendable (no template or the contact lost consent): record, advance past.
    await db.insert(flow_logs).values({
      id: randomUUID(),
      enrollment_id: enrollment.id,
      step_index: step.step_index,
      status: 'skipped',
      result: { reason: templateId ? 'not_marketable' : 'no_template' },
    })
    await db
      .update(flow_enrollments)
      .set({ current_step: step.step_index + 1, next_run_at: new Date(), updated_at: new Date() })
      .where(eq(flow_enrollments.id, enrollment.id))
    return { outcome: 'skipped' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    console.error(`[email/flows] advancement failed for enrollment ${enrollment.id}`, error)
    await finishEnrollment(enrollment.id, 'cancelled', message)
    return { outcome: 'failed' }
  }
}

export async function cancelEnrollmentsForLead(_client: unknown, contactId: string, reason: string): Promise<number> {
  const cancelled = await db
    .update(flow_enrollments)
    .set({ status: 'cancelled', next_run_at: null, completed_at: new Date(), updated_at: new Date() })
    .where(and(eq(flow_enrollments.contact_id, contactId), eq(flow_enrollments.status, 'active')))
    .returning({ id: flow_enrollments.id })

  for (const row of cancelled) {
    await db
      .insert(flow_logs)
      .values({
        id: randomUUID(),
        enrollment_id: row.id,
        step_index: -1,
        status: 'skipped',
        result: {},
        error: reason.slice(0, 1000),
      })
      .catch((cause) => console.error('[email/flows] could not write cancellation log', cause))
  }

  return cancelled.length
}

export async function cancelEnrollment(_client: unknown, enrollmentId: string, reason: string): Promise<boolean> {
  const cancelled = await db
    .update(flow_enrollments)
    .set({ status: 'cancelled', next_run_at: null, completed_at: new Date(), updated_at: new Date() })
    .where(and(eq(flow_enrollments.id, enrollmentId), eq(flow_enrollments.status, 'active')))
    .returning({ id: flow_enrollments.id })
  if (!cancelled.length) return false

  await db
    .insert(flow_logs)
    .values({
      id: randomUUID(),
      enrollment_id: enrollmentId,
      step_index: -1,
      status: 'skipped',
      result: {},
      error: reason.slice(0, 1000),
    })
    .catch((cause) => console.error('[email/flows] could not write cancellation log', cause))
  return true
}

/** The next step's delay counts from the moment the previous step fired. */
function nextRunAtFor(steps: EmailFlowStepItem[], current: EmailFlowStepItem): Date {
  const next = steps[steps.indexOf(current) + 1]
  return new Date(Date.now() + Math.max(0, next ? stepDelayMinutes(next) : 0) * 60_000)
}
