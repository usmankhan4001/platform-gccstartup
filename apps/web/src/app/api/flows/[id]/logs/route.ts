import { NextRequest, NextResponse } from 'next/server'
import { desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, flow_enrollments, flow_logs, flow_steps, flows } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'
import type { FlowRun, FlowRunStep } from '@/components/automation/types'

type RouteContext = { params: Promise<{ id: string }> }

const STEP_LABELS = ['Trigger', 'Wait', 'Email 1', 'Email 2', 'Email 3', 'Email 4', 'Email 5', 'Step 8', 'Step 9', 'Step 10'] as const

function stepLabel(stepIndex: number, steps: Array<{ step_index: number; step_type: string }>): string {
  const step = steps.find((entry) => entry.step_index === stepIndex)
  if (step) return step.step_type.replace(/_/g, ' ')
  return STEP_LABELS[stepIndex] ?? `Step ${stepIndex + 1}`
}

/**
 * Real execution history for one flow: `flow_logs` grouped by the enrollment
 * (a "run") that produced them, joined to the contact for context. Empty when
 * the engine has never run the flow — the UI keeps its simulator in that case
 * instead of inventing rows.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'manager', 'agent'])
    const { id } = await params

    const flowRows = await db.select({ id: flows.id, name: flows.name }).from(flows).where(eq(flows.id, id)).limit(1)
    if (!flowRows[0]) return NextResponse.json({ error: 'Flow not found' }, { status: 404 })

    const [enrollments, stepRows] = await Promise.all([
      db
        .select({
          id: flow_enrollments.id,
          status: flow_enrollments.status,
          current_step: flow_enrollments.current_step,
          started_at: flow_enrollments.started_at,
          completed_at: flow_enrollments.completed_at,
          contact_name: contacts.display_name,
          contact_first: contacts.first_name,
          contact_last: contacts.last_name,
          contact_email: contacts.email,
        })
        .from(flow_enrollments)
        .leftJoin(contacts, eq(contacts.id, flow_enrollments.contact_id))
        .where(eq(flow_enrollments.flow_id, id))
        .orderBy(desc(flow_enrollments.started_at))
        .limit(25),
      db.select({ step_index: flow_steps.step_index, step_type: flow_steps.step_type }).from(flow_steps).where(eq(flow_steps.flow_id, id)),
    ])

    if (!enrollments.length) return NextResponse.json({ runs: [], total: 0 })

    const enrollmentIds = enrollments.map((enrollment) => enrollment.id)
    const logs = await db
      .select()
      .from(flow_logs)
      .where(inArray(flow_logs.enrollment_id, enrollmentIds))
      .orderBy(desc(flow_logs.executed_at))
      .limit(500)

    const contactName = (row: (typeof enrollments)[number]) =>
      row.contact_name || [row.contact_first, row.contact_last].filter(Boolean).join(' ') || row.contact_email || 'Unknown contact'

    const runs: FlowRun[] = enrollments.map((enrollment) => {
      const enrollmentLogs = logs
        .filter((log) => log.enrollment_id === enrollment.id)
        .sort((left, right) => left.step_index - right.step_index)

      const steps: FlowRunStep[] = enrollmentLogs.map((log) => {
        const result = (log.result ?? {}) as Record<string, unknown>
        const nodeId = typeof result.nodeId === 'string' ? result.nodeId : null
        const detail = typeof result.detail === 'string' ? result.detail : typeof result.providerOperation === 'string' ? result.providerOperation : ''
        return {
          stepIndex: log.step_index,
          status: log.status,
          nodeId,
          label: stepLabel(log.step_index, stepRows),
          detail,
          error: log.error,
          executedAt: log.executed_at ? log.executed_at.toISOString() : null,
        }
      })

      const failed = enrollmentLogs.find((log) => log.status === 'failed')
      return {
        id: enrollment.id,
        flowId: id,
        flowName: flowRows[0].name,
        contactName: contactName(enrollment),
        contactEmail: enrollment.contact_email,
        status: failed ? 'failed' : enrollment.status,
        currentStep: enrollment.current_step,
        startedAt: enrollment.started_at ? enrollment.started_at.toISOString() : null,
        completedAt: enrollment.completed_at ? enrollment.completed_at.toISOString() : null,
        steps,
      }
    })

    return NextResponse.json({ runs, total: runs.length })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/flows/id/logs] failed', error)
    return NextResponse.json({ error: 'Failed to load flow logs' }, { status: 500 })
  }
}

