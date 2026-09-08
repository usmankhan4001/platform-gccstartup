import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, desc, eq, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, crm_activities, events } from '@gccstartup/db'

const ACTIVITY_TYPES = ['call', 'meeting'] as const
const ACTIVITY_DIRECTIONS = ['inbound', 'outbound'] as const

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))

    // type=system feeds the AutomationsView feed: recent platform events rather
    // than per-contact call/meeting logs.
    if (type === 'system') {
      const rows = await db
        .select()
        .from(events)
        .where(sql`${events.event_type} <> 'segment'`)
        .orderBy(desc(events.created_at))
        .limit(limit)

      const activities = rows.map((row) => {
        const payload = (row.payload || {}) as Record<string, unknown>
        return {
          id: row.id,
          title: row.event_type,
          description:
            typeof payload.summary === 'string'
              ? payload.summary
              : Object.keys(payload).length
                ? JSON.stringify(payload).slice(0, 300)
                : row.source || '',
          occurred_at: row.created_at,
          lead_id: typeof payload.leadId === 'string' ? payload.leadId : undefined,
        }
      })
      return NextResponse.json({ data: activities, activities })
    }

    const contactId = searchParams.get('contact_id') || searchParams.get('lead_id')
    const filters = []
    if (contactId) filters.push(eq(crm_activities.contact_id, contactId))
    if (type && (ACTIVITY_TYPES as readonly string[]).includes(type)) {
      filters.push(eq(crm_activities.type, type as (typeof ACTIVITY_TYPES)[number]))
    }

    const rows = await db
      .select({
        id: crm_activities.id,
        contact_id: crm_activities.contact_id,
        deal_id: crm_activities.deal_id,
        type: crm_activities.type,
        direction: crm_activities.direction,
        subject: crm_activities.subject,
        notes: crm_activities.notes,
        occurred_at: crm_activities.occurred_at,
        duration_minutes: crm_activities.duration_minutes,
        logged_by: crm_activities.logged_by,
        contact_name: sql<string>`COALESCE(${contacts.display_name}, NULLIF(CONCAT_WS(' ', ${contacts.first_name}, ${contacts.last_name}), ''), ${contacts.email}, ${contacts.phone})`,
      })
      .from(crm_activities)
      .innerJoin(contacts, eq(contacts.id, crm_activities.contact_id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(crm_activities.occurred_at))
      .limit(limit)

    return NextResponse.json({ data: rows, activities: rows })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/activities] list failed', error)
    return NextResponse.json({ error: 'Failed to list activities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const contactId = typeof body.contact_id === 'string' ? body.contact_id : typeof body.lead_id === 'string' ? body.lead_id : null
    if (!contactId) return NextResponse.json({ error: 'contact_id is required' }, { status: 400 })

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
        contact_id: contactId,
        deal_id: typeof body.deal_id === 'string' ? body.deal_id : null,
        type,
        direction,
        subject: typeof body.subject === 'string' ? body.subject.slice(0, 200) : null,
        notes: typeof body.notes === 'string' ? body.notes : null,
        occurred_at: occurredAt,
        duration_minutes: typeof body.duration_minutes === 'number' ? Math.max(0, Math.round(body.duration_minutes)) : null,
        logged_by: user.id,
      })
      .returning()

    return NextResponse.json({ data: inserted[0] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/activities] create failed', error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}
