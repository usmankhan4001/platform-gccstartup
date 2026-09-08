import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { flows } from '@gccstartup/db'

const TRIGGER_TYPES = [
  'manual',
  'lead_created',
  'form_submitted',
  'tag_added',
  'deal_stage_changed',
  'date_based',
  'event_based',
] as const

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request, ['staff'])
    const { id } = await params
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim().slice(0, 200)
    if (body.description === null || typeof body.description === 'string') updates.description = body.description ?? null
    if (TRIGGER_TYPES.find((t) => t === body.triggerType)) updates.trigger_type = body.triggerType
    if (body.triggerConfig && typeof body.triggerConfig === 'object' && !Array.isArray(body.triggerConfig)) {
      updates.trigger_config = body.triggerConfig
    }
    if (Array.isArray(body.actionsJson)) updates.nodes = body.actionsJson
    if (typeof body.isActive === 'boolean') updates.status = body.isActive ? 'active' : 'paused'

    const updated = await db.update(flows).set(updates).where(eq(flows.id, id)).returning()
    if (!updated.length) return NextResponse.json({ error: 'Automation not found' }, { status: 404 })

    const flow = updated[0]
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
        updatedAt: flow.updated_at,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[automations/[id]] update failed', error)
    return NextResponse.json({ error: 'Failed to update automation' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request, ['admin'])
    const { id } = await params

    const deleted = await db.delete(flows).where(eq(flows.id, id)).returning({ id: flows.id })
    if (!deleted.length) return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[automations/[id]] delete failed', error)
    return NextResponse.json({ error: 'Failed to delete automation' }, { status: 500 })
  }
}
