import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { flow_enrollments, flows } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'
import { SEQUENCE_DEFINITIONS } from '@/components/automation/sequences'
import type { EmailSequence, SequenceStatus } from '@/components/automation/types'

type FlowRow = typeof flows.$inferSelect
type EnrollmentCount = { flow_id: string; total: number; active: number; completed: number }

function sequenceStatus(flow: FlowRow | undefined): SequenceStatus {
  if (!flow) return 'unprovisioned'
  if (flow.status === 'active' || flow.status === 'paused' || flow.status === 'archived') return flow.status
  return 'draft'
}

/**
 * The four canonical drip sequences the platform ships with, joined against the
 * `flows` rows that provision them (via `trigger_config.sequenceKey`) and real
 * `flow_enrollments` counts. A sequence that no operator has provisioned yet
 * reports `unprovisioned` — the definition is the programme of record, the flow
 * row is the live instance.
 */
export async function GET(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'manager', 'agent'])

    const [flowRows, enrollmentRows] = await Promise.all([
      db.select().from(flows).limit(500),
      db
        .select({
          flow_id: flow_enrollments.flow_id,
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) filter (where ${flow_enrollments.status} = 'active')::int`,
          completed: sql<number>`count(*) filter (where ${flow_enrollments.status} = 'completed')::int`,
        })
        .from(flow_enrollments)
        .groupBy(flow_enrollments.flow_id),
    ])

    const countByFlow = new Map<string, EnrollmentCount>(enrollmentRows.map((row) => [row.flow_id, row]))
    const flowByKey = new Map<string, FlowRow>()
    for (const row of flowRows) {
      const key = row.trigger_config && typeof row.trigger_config === 'object' ? (row.trigger_config as Record<string, unknown>).sequenceKey : null
      if (typeof key === 'string') flowByKey.set(key, row)
    }

    const sequences: EmailSequence[] = SEQUENCE_DEFINITIONS.map((definition) => {
      const flow = flowByKey.get(definition.key)
      const counts = flow ? countByFlow.get(flow.id) : undefined
      return {
        key: definition.key,
        name: definition.name,
        description: definition.description,
        triggerLabel: definition.triggerLabel,
        triggerType: definition.triggerType,
        status: sequenceStatus(flow),
        enrolledCount: Number(counts?.total) || 0,
        activeCount: Number(counts?.active) || 0,
        completedCount: Number(counts?.completed) || 0,
        // Open/click rates are only tracked for campaign sends today; flow sends
        // report null rather than a fabricated benchmark.
        openRate: null,
        clickRate: null,
        flowId: flow?.id ?? null,
        steps: definition.steps,
      }
    })

    return NextResponse.json({ data: sequences, total: sequences.length })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/sequences] list failed', error)
    return NextResponse.json({ error: 'Failed to list email sequences' }, { status: 500 })
  }
}

const TRIGGER_TO_NODE_TYPE: Record<SequenceDefinitionTrigger, string> = {
  lead_created: 'trigger.lead_created_calculator',
  deal_stage_changed: 'trigger.deal_stage_moved',
  date_based: 'trigger.license_expiring',
  manual: 'trigger.lead_created_calculator',
  form_submitted: 'trigger.lead_created_calculator',
  tag_added: 'trigger.lead_created_calculator',
  event_based: 'trigger.lead_created_calculator',
}

type SequenceDefinitionTrigger = (typeof SEQUENCE_DEFINITIONS)[number]['triggerType']

/** '+1 day' / 'Immediate on stage move' → the leading number, else 0. */
function parseDelayDays(delay: string): number {
  const match = /(\d+)\s*day/i.exec(delay ?? '')
  return match ? Number(match[1]) : 0
}

/**
 * Provisions a sequence definition into a real `flows` row. The canvas nodes use
 * the catalog keys from `components/automation/nodeCatalog.ts` (trigger.<x>,
 * action.send_ses_email, action.wait) so the flow opens in the visual builder
 * with editable config, and `trigger_config.sequenceKey` ties the row back to
 * its definition.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authGuard(request, ['admin', 'super_admin'])
    const body = await request.json().catch(() => ({}))
    const key = typeof body.key === 'string' ? body.key : ''

    const definition = SEQUENCE_DEFINITIONS.find((entry) => entry.key === key)
    if (!definition) return NextResponse.json({ error: 'Unknown sequence key' }, { status: 400 })

    // One live flow per sequence definition — trigger_config.sequenceKey is the link.
    const allFlows = await db.select().from(flows).limit(500)
    const existing = allFlows.find(
      (row) => row.trigger_config && (row.trigger_config as Record<string, unknown>).sequenceKey === key,
    )
    if (existing) return NextResponse.json({ error: 'Sequence is already provisioned', flowId: existing.id }, { status: 409 })

    let cursorY = 40
    const nodes: Array<Record<string, unknown>> = []
    const edges: Array<Record<string, unknown>> = []

    const nodeType = TRIGGER_TO_NODE_TYPE[definition.triggerType] ?? 'trigger.lead_created_calculator'
    nodes.push({
      id: 'seq-trigger',
      type: 'flowNode',
      position: { x: 250, y: cursorY },
      data: { kind: 'trigger', nodeType, label: definition.triggerLabel, config: {} },
    })
    cursorY += 170

    let previousId = 'seq-trigger'
    definition.steps.forEach((step, index) => {
      const delayDays = parseDelayDays(step.delay)
      if (delayDays > 0) {
        const waitId = `seq-wait-${index}`
        nodes.push({
          id: waitId,
          type: 'flowNode',
          position: { x: 250, y: cursorY },
          data: { kind: 'delay', nodeType: 'action.wait', label: `Wait ${delayDays}d`, config: { duration: delayDays, unit: 'days' } },
        })
        edges.push({ id: `e-${previousId}-${waitId}`, source: previousId, target: waitId })
        previousId = waitId
        cursorY += 170
      }

      const stepId = `seq-step-${index}`
      nodes.push({
        id: stepId,
        type: 'flowNode',
        position: { x: 250, y: cursorY },
        data: {
          kind: 'action',
          nodeType: 'action.send_ses_email',
          label: step.title,
          config: { subject: step.subject, templateName: step.template, preheader: '' },
        },
      })
      edges.push({ id: `e-${previousId}-${stepId}`, source: previousId, target: stepId })
      previousId = stepId
      cursorY += 170
    })

    const created = await db
      .insert(flows)
      .values({
        id: randomUUID(),
        name: definition.name,
        description: definition.description,
        status: 'draft',
        trigger_type: definition.triggerType,
        trigger_config: { sequenceKey: definition.key },
        nodes,
        edges,
        created_by: user.id,
      })
      .returning()

    return NextResponse.json({ success: true, flow: created[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/sequences] provision failed', error)
    return NextResponse.json({ error: 'Failed to provision sequence' }, { status: 500 })
  }
}

