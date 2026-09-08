import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { flows } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

function parseCanvas(value: unknown, fallback: unknown[]): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : fallback
    } catch {
      return fallback
    }
  }
  return fallback
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
    const { id } = await params

    const rows = await db.select().from(flows).where(eq(flows.id, id)).limit(1)
    if (!rows[0]) return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/flows/id] get failed', error)
    return NextResponse.json({ error: 'Failed to retrieve flow' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await authGuard(request, ['admin', 'super_admin'])
    const { id } = await params
    const body = await request.json()

    const existing = await db.select().from(flows).where(eq(flows.id, id)).limit(1)
    if (!existing[0]) return NextResponse.json({ error: 'Flow not found' }, { status: 404 })

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim().slice(0, 200)
    if (typeof body.description === 'string' || body.description === null) updates.description = body.description ?? null
    if (['draft', 'paused', 'archived'].includes(body.status)) updates.status = body.status
    if (['manual', 'lead_created', 'form_submitted', 'tag_added', 'deal_stage_changed', 'date_based', 'event_based'].includes(body.triggerType)) {
      updates.trigger_type = body.triggerType
    }
    if (body.triggerConfig && typeof body.triggerConfig === 'object') updates.trigger_config = body.triggerConfig

    const nodes = body.nodes ?? body.nodesJson
    const edges = body.edges ?? body.edgesJson
    if (nodes !== undefined) updates.nodes = parseCanvas(nodes, existing[0].nodes ?? [])
    if (edges !== undefined) updates.edges = parseCanvas(edges, existing[0].edges ?? [])
    // Canvas changes bump the version; publish is the only path that activates.
    if (nodes !== undefined || edges !== undefined) updates.version = existing[0].version + 1

    const updated = await db.update(flows).set(updates).where(eq(flows.id, id)).returning()
    return NextResponse.json({ success: true, flow: updated[0] })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/flows/id] update failed', error)
    return NextResponse.json({ error: 'Failed to update flow' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
    const { id } = await params

    // Active flows must be paused or archived before deletion — an active flow may
    // have live enrollments that a delete would orphan.
    const existing = await db.select().from(flows).where(eq(flows.id, id)).limit(1)
    if (!existing[0]) return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    if (existing[0].status === 'active') {
      return NextResponse.json({ error: 'Pause or archive the flow before deleting it' }, { status: 409 })
    }

    await db.delete(flows).where(eq(flows.id, id))
    return NextResponse.json({ success: true, message: 'Flow deleted successfully' })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/flows/id] delete failed', error)
    return NextResponse.json({ error: 'Failed to delete flow' }, { status: 500 })
  }
}
