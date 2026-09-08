import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, desc, eq } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, crm_activities } from '@gccstartup/db'

const ACTIVITY_TYPES = ['call', 'meeting'] as const
const ACTIVITY_DIRECTIONS = ['inbound', 'outbound'] as const

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request)
    const { id } = await params

    const rows = await db
      .select()
      .from(crm_activities)
      .where(eq(crm_activities.contact_id, id))
      .orderBy(desc(crm_activities.occurred_at))
      .limit(200)

    return NextResponse.json({ data: rows })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads/[id]/activities] list failed', error)
    return NextResponse.json({ error: 'Failed to list activities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await authGuard(request, ['staff'])
    const { id } = await params
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const lead = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.id, id)).limit(1)
    if (!lead[0]) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const type = ACTIVITY_TYPES.find((t) => t === body.type)
    const direction = ACTIVITY_DIRECTIONS.find((d) => d === body.direction)
    if (!type || !direction) {
      return NextResponse.json({ error: 'type must be call|meeting and direction inbound|outbound' }, { status: 400 })
    }

    const occurredAt =
      typeof body.occurred_at === 'string' && !Number.isNaN(Date.parse(body.occurred_at))
        ? new Date(body.occurred_at)
        : new Date()

    const inserted = await db
      .insert(crm_activities)
      .values({
        id: randomUUID(),
        contact_id: id,
        deal_id: typeof body.deal_id === 'string' ? body.deal_id : null,
        type,
        direction,
        subject: typeof body.subject === 'string' ? body.subject.slice(0, 200) : null,
        notes: typeof body.notes === 'string' ? body.notes : null,
        occurred_at: occurredAt,
        duration_minutes:
          typeof body.duration_minutes === 'number' ? Math.max(0, Math.round(body.duration_minutes)) : null,
        logged_by: user.id,
      })
      .returning()

    return NextResponse.json({ data: inserted[0] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads/[id]/activities] create failed', error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request, ['staff'])
    const { id } = await params
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const activityId = typeof body.activity_id === 'string' ? body.activity_id : null
    if (!activityId) return NextResponse.json({ error: 'activity_id is required' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (typeof body.subject === 'string') updates.subject = body.subject.slice(0, 200)
    if (body.notes === null || typeof body.notes === 'string') updates.notes = body.notes ?? null
    if (ACTIVITY_TYPES.find((t) => t === body.type)) updates.type = body.type
    if (ACTIVITY_DIRECTIONS.find((d) => d === body.direction)) updates.direction = body.direction
    if (typeof body.duration_minutes === 'number') {
      updates.duration_minutes = Math.max(0, Math.round(body.duration_minutes))
    }

    const updated = await db
      .update(crm_activities)
      .set(updates)
      .where(and(eq(crm_activities.id, activityId), eq(crm_activities.contact_id, id)))
      .returning()

    if (!updated.length) return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    return NextResponse.json({ data: updated[0] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads/[id]/activities] update failed', error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request, ['admin'])
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activity_id')
    if (!activityId) return NextResponse.json({ error: 'activity_id is required' }, { status: 400 })

    const deleted = await db
      .delete(crm_activities)
      .where(and(eq(crm_activities.id, activityId), eq(crm_activities.contact_id, id)))
      .returning({ id: crm_activities.id })

    if (!deleted.length) return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads/[id]/activities] delete failed', error)
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
  }
}
