import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, users } from '@gccstartup/db'

// Leads are contacts in the CRM schema — the pipeline operates on
// contacts.lifecycle_stage, so the leads list is a staged view over contacts.

const LIFECYCLE_STAGES = ['lead', 'subscriber', 'prospect', 'client', 'churned'] as const

function parseStage(value: unknown): (typeof LIFECYCLE_STAGES)[number] | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return (LIFECYCLE_STAGES as readonly string[]).includes(normalized)
    ? (normalized as (typeof LIFECYCLE_STAGES)[number])
    : null
}

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)
    const { searchParams } = new URL(request.url)
    const stage = parseStage(searchParams.get('status') || searchParams.get('stage') || 'lead')
    const search = searchParams.get('search')?.trim() || null
    const ownerId = searchParams.get('assigned_to') || searchParams.get('owner_id')
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10))

    const filters = [isNull(contacts.deleted_at)]
    if (stage) filters.push(eq(contacts.lifecycle_stage, stage))
    if (ownerId) filters.push(eq(contacts.owner_id, ownerId))
    if (search) {
      const pattern = `%${search}%`
      const searchFilter = or(
        ilike(contacts.first_name, pattern),
        ilike(contacts.last_name, pattern),
        ilike(contacts.email, pattern),
        ilike(contacts.phone, pattern),
        ilike(contacts.company, pattern),
      )
      if (searchFilter) filters.push(searchFilter)
    }
    const where = and(...filters)

    const rows = await db
      .select({
        id: contacts.id,
        name: sql<string>`COALESCE(NULLIF(CONCAT_WS(' ', ${contacts.first_name}, ${contacts.last_name}), ''), ${contacts.display_name}, ${contacts.email}, ${contacts.phone})`,
        email: contacts.email,
        phone: contacts.phone,
        company: contacts.company,
        job_title: contacts.job_title,
        status: contacts.lifecycle_stage,
        source: contacts.source,
        tags: contacts.tags,
        owner_id: contacts.owner_id,
        owner_name: users.name,
        created_at: contacts.created_at,
        updated_at: contacts.updated_at,
      })
      .from(contacts)
      .leftJoin(users, eq(users.id, contacts.owner_id))
      .where(where)
      .orderBy(desc(contacts.created_at))
      .limit(limit)
      .offset(offset)

    const totalRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(where)

    return NextResponse.json({ data: rows, total: Number(totalRows[0]?.count) || 0 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads] list failed', error)
    return NextResponse.json({ error: 'Failed to list leads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() || null : null
    const phone = typeof body.phone === 'string' ? body.phone.trim() || null : null
    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 })
    }

    const firstName = typeof body.first_name === 'string' ? body.first_name.trim().slice(0, 100) : null
    const lastName = typeof body.last_name === 'string' ? body.last_name.trim().slice(0, 100) : null
    const stage = parseStage(body.status) || 'lead'

    const inserted = await db
      .insert(contacts)
      .values({
        id: randomUUID(),
        email,
        phone,
        first_name: firstName,
        last_name: lastName,
        display_name:
          typeof body.name === 'string' && body.name.trim()
            ? body.name.trim().slice(0, 200)
            : [firstName, lastName].filter(Boolean).join(' ') || null,
        company: typeof body.company === 'string' ? body.company.trim().slice(0, 200) : null,
        lifecycle_stage: stage,
        source: typeof body.source === 'string' ? body.source.trim().slice(0, 100) : 'crm_manual',
        owner_id: typeof body.owner_id === 'string' ? body.owner_id : user.id,
        tags: Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === 'string') : [],
      })
      .returning()

    return NextResponse.json({ data: inserted[0] })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads] create failed', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const targetIds = Array.isArray(body.ids)
      ? body.ids.filter((v): v is string => typeof v === 'string')
      : typeof body.id === 'string'
        ? [body.id]
        : []
    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'Lead ID or IDs required' }, { status: 400 })
    }

    const stage = parseStage(body.status ?? body.stage)
    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (stage) updates.lifecycle_stage = stage
    if (body.owner_id === null || typeof body.owner_id === 'string') updates.owner_id = body.owner_id
    if (body.email === null || typeof body.email === 'string') {
      updates.email = typeof body.email === 'string' ? body.email.trim().toLowerCase() || null : null
    }
    if (body.phone === null || typeof body.phone === 'string') {
      updates.phone = typeof body.phone === 'string' ? body.phone.trim() || null : null
    }
    if (body.company === null || typeof body.company === 'string') {
      updates.company = typeof body.company === 'string' ? body.company.trim().slice(0, 200) || null : null
    }

    const updated = await db
      .update(contacts)
      .set(updates)
      .where(and(inArray(contacts.id, targetIds), isNull(contacts.deleted_at)))
      .returning({ id: contacts.id })

    return NextResponse.json({ data: { count: updated.length }, success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[crm/leads] update failed', error)
    return NextResponse.json({ error: 'Failed to update leads' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authGuard(request, ['admin'])
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })

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
    console.error('[crm/leads] delete failed', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
