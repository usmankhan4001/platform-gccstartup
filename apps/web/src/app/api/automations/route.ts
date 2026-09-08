import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { eq, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { flow_enrollments, flows } from '@gccstartup/db'

// Automations are flows in the platform schema (flows / flow_steps). The wizard's
// actionsJson is stored on flows.nodes; isActive maps to the flow status enum.

const TRIGGER_TYPES = [
  'manual',
  'lead_created',
  'form_submitted',
  'tag_added',
  'deal_stage_changed',
  'date_based',
  'event_based',
] as const

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)

    const rows = await db.select().from(flows).orderBy(sql`${flows.created_at} DESC`).limit(200)
    const [activeRows, enrollmentRows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(flows).where(eq(flows.status, 'active')),
      db.select({ count: sql<number>`count(*)::int` }).from(flow_enrollments),
    ])

    const automations = rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      triggerType: row.trigger_type,
      triggerConfig: row.trigger_config,
      actionsJson: row.nodes || [],
      isActive: row.status === 'active',
      status: row.status,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return NextResponse.json({
      automations,
      stats: {
        totalRules: automations.length,
        activeRules: Number(activeRows[0]?.count) || 0,
        totalExecutions: Number(enrollmentRows[0]?.count) || 0,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[automations] list failed', error)
    return NextResponse.json({ error: 'Failed to list automations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : ''
    const triggerType = TRIGGER_TYPES.find((t) => t === body.triggerType)
    if (!name || !triggerType) {
      return NextResponse.json({ error: 'Name and a valid triggerType are required' }, { status: 400 })
    }

    const triggerConfig =
      body.triggerConfig && typeof body.triggerConfig === 'object' && !Array.isArray(body.triggerConfig)
        ? (body.triggerConfig as Record<string, unknown>)
        : {}
    const actions = Array.isArray(body.actionsJson) ? body.actionsJson : []

    const inserted = await db
      .insert(flows)
      .values({
        id: randomUUID(),
        name,
        description: typeof body.description === 'string' ? body.description : null,
        status: body.isActive === false ? 'draft' : 'active',
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        nodes: actions,
        created_by: user.id,
      })
      .returning()

    const flow = inserted[0]
    return NextResponse.json({
      success: true,
      automation: {
        id: flow.id,
        name: flow.name,
        description: flow.description,
        triggerType: flow.trigger_type,
        triggerConfig: flow.trigger_config,
        actionsJson: flow.nodes || [],
        isActive: flow.status === 'active',
        status: flow.status,
        createdAt: flow.created_at,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[automations] create failed', error)
    return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 })
  }
}

