import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, crm_activities, crm_notes, crm_tasks, deals } from '@gccstartup/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request)
    const { id } = await params

    const leadRows = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), isNull(contacts.deleted_at)))
      .limit(1)
    const lead = leadRows[0]
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const [activities, tasks, notes, deals_] = await Promise.all([
      db
        .select()
        .from(crm_activities)
        .where(eq(crm_activities.contact_id, id))
        .orderBy(desc(crm_activities.occurred_at))
        .limit(100),
      db
        .select()
        .from(crm_tasks)
        .where(eq(crm_tasks.contact_id, id))
        .orderBy(desc(crm_tasks.created_at))
        .limit(100),
      db
        .select()
        .from(crm_notes)
        .where(eq(crm_notes.contact_id, id))
        .orderBy(desc(crm_notes.created_at))
        .limit(100),
      db.select().from(deals).where(eq(deals.contact_id, id)).orderBy(desc(deals.created_at)).limit(50),
    ])

    return NextResponse.json({
      data: {
        lead,
        activities,
        tasks,
        notes,
        deals: deals_,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads/[id]] detail failed', error)
    return NextResponse.json({ error: 'Failed to load lead' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request, ['staff'])
    const { id } = await params
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (body.email === null || typeof body.email === 'string') {
      updates.email = typeof body.email === 'string' ? body.email.trim().toLowerCase() || null : null
    }
    if (body.phone === null || typeof body.phone === 'string') {
      updates.phone = typeof body.phone === 'string' ? body.phone.trim() || null : null
    }
    if (body.first_name === null || typeof body.first_name === 'string') updates.first_name = body.first_name ?? null
    if (body.last_name === null || typeof body.last_name === 'string') updates.last_name = body.last_name ?? null
    if (body.company === null || typeof body.company === 'string') {
      updates.company = typeof body.company === 'string' ? body.company.trim().slice(0, 200) || null : null
    }
    if (body.owner_id === null || typeof body.owner_id === 'string') updates.owner_id = body.owner_id
    if (typeof body.source === 'string') updates.source = body.source.trim().slice(0, 100)
    if (Array.isArray(body.tags)) updates.tags = body.tags.filter((t): t is string => typeof t === 'string')
    if (body.custom_fields && typeof body.custom_fields === 'object' && !Array.isArray(body.custom_fields)) {
      updates.custom_fields = body.custom_fields
    }

    const updated = await db
      .update(contacts)
      .set(updates)
      .where(and(eq(contacts.id, id), isNull(contacts.deleted_at)))
      .returning()

    if (!updated.length) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    return NextResponse.json({ data: updated[0] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads/[id]] update failed', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request, ['admin'])
    const { id } = await params

    const deleted = await db
      .update(contacts)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(eq(contacts.id, id), isNull(contacts.deleted_at)))
      .returning({ id: contacts.id })

    if (!deleted.length) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads/[id]] delete failed', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
