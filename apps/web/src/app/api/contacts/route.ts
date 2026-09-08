import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts } from '@gccstartup/db'

type ContactRow = typeof contacts.$inferSelect

const LIFECYCLE_STAGES = ['lead', 'subscriber', 'prospect', 'client', 'churned'] as const

function parseLifecycle(value: unknown): (typeof LIFECYCLE_STAGES)[number] | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return (LIFECYCLE_STAGES as readonly string[]).includes(normalized)
    ? (normalized as (typeof LIFECYCLE_STAGES)[number])
    : null
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toLowerCase()
  return trimmed || null
}

function serializeContact(row: ContactRow) {
  return {
    id: row.id,
    phoneNumber: row.phone,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    email: row.email,
    company: row.company,
    jobTitle: row.job_title,
    status: row.lifecycle_stage,
    lifecycleStage: row.lifecycle_stage,
    ownerId: row.owner_id,
    source: row.source,
    tags: row.tags || [],
    customAttributes: row.custom_fields || {},
    emailConsent: row.email_consent,
    whatsappConsent: row.whatsapp_consent,
    unsubscribedAt: row.unsubscribed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || null
    const stage = parseLifecycle(searchParams.get('lifecycle_stage') || searchParams.get('status'))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10))

    const filters = [isNull(contacts.deleted_at)]
    if (stage) filters.push(eq(contacts.lifecycle_stage, stage))
    if (search) {
      const pattern = `%${search}%`
      const searchFilter = or(
        ilike(contacts.phone, pattern),
        ilike(contacts.first_name, pattern),
        ilike(contacts.last_name, pattern),
        ilike(contacts.email, pattern),
        ilike(contacts.display_name, pattern),
      )
      if (searchFilter) filters.push(searchFilter)
    }

    const rows = await db
      .select()
      .from(contacts)
      .where(and(...filters))
      .orderBy(desc(contacts.created_at))
      .limit(limit)
      .offset(offset)

    return NextResponse.json(rows.map(serializeContact))
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[contacts] list failed', error)
    return NextResponse.json({ error: 'Failed to list contacts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const phone = normalizePhone(body.phoneNumber ?? body.phone)
    const email = normalizeEmail(body.email)
    if (!phone && !email) {
      return NextResponse.json({ error: 'Phone number or email is required' }, { status: 400 })
    }

    const firstName = typeof body.firstName === 'string' ? body.firstName.trim().slice(0, 100) : null
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim().slice(0, 100) : null
    const company = typeof body.company === 'string' ? body.company.trim().slice(0, 200) : null
    const source = typeof body.source === 'string' ? body.source.trim().slice(0, 100) : 'manual'
    const customAttributes =
      body.customAttributes && typeof body.customAttributes === 'object' && !Array.isArray(body.customAttributes)
        ? (body.customAttributes as Record<string, unknown>)
        : {}
    const incomingTags = [
      ...(Array.isArray(body.tagIds) ? (body.tagIds as unknown[]) : []),
      ...(Array.isArray(body.groupIds) ? (body.groupIds as unknown[]) : []),
    ].filter((t): t is string => typeof t === 'string' && t.trim() !== '')
    const tags = [...new Set(incomingTags)]

    // Upsert by phone first, then email — the same contact may arrive on either key.
    const matchCondition = phone
      ? or(eq(contacts.phone, phone), email ? eq(contacts.email, email) : undefined)
      : eq(contacts.email, email as string)

    const existing = await db
      .select()
      .from(contacts)
      .where(and(matchCondition, isNull(contacts.deleted_at)))
      .limit(1)

    if (existing[0]) {
      const row = await db
        .update(contacts)
        .set({
          phone: existing[0].phone || phone,
          email: existing[0].email || email,
          first_name: existing[0].first_name || firstName,
          last_name: existing[0].last_name || lastName,
          company: existing[0].company || company,
          source: existing[0].source || source,
          tags: sql`(
            SELECT COALESCE(jsonb_agg(DISTINCT t), '[]'::jsonb)
            FROM jsonb_array_elements_text(COALESCE(${contacts.tags}, '[]'::jsonb) || ${JSON.stringify(tags)}::jsonb) AS t
          )`,
          updated_at: new Date(),
        })
        .where(eq(contacts.id, existing[0].id))
        .returning()
      return NextResponse.json({ success: true, contact: serializeContact(row[0]) })
    }

    const inserted = await db
      .insert(contacts)
      .values({
        id: randomUUID(),
        phone,
        email,
        first_name: firstName,
        last_name: lastName,
        display_name: [firstName, lastName].filter(Boolean).join(' ') || null,
        company,
        source,
        tags,
        custom_fields: customAttributes,
      })
      .returning()

    return NextResponse.json({ success: true, contact: serializeContact(inserted[0]) })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[contacts] create failed', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const { ids, id, status, addGroupId, removeGroupId, addTagId, removeTagId, customAttributes, ownerId } = body
    const targetIds: string[] = id
      ? [String(id)]
      : Array.isArray(ids)
        ? ids.filter((v): v is string => typeof v === 'string')
        : []
    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'Target contact ID or IDs required' }, { status: 400 })
    }

    const stage = parseLifecycle(status)
    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (stage) updates.lifecycle_stage = stage
    if (ownerId === null || typeof ownerId === 'string') updates.owner_id = ownerId
    if (customAttributes && typeof customAttributes === 'object' && !Array.isArray(customAttributes)) {
      updates.custom_fields = sql`COALESCE(${contacts.custom_fields}, '{}'::jsonb) || ${JSON.stringify(customAttributes)}::jsonb`
    }

    const addTags = [addGroupId, addTagId].filter((t): t is string => typeof t === 'string' && t.trim() !== '')
    const removeTags = [removeGroupId, removeTagId].filter((t): t is string => typeof t === 'string' && t.trim() !== '')
    if (addTags.length) {
      updates.tags = sql`(
        SELECT COALESCE(jsonb_agg(DISTINCT t), '[]'::jsonb)
        FROM jsonb_array_elements_text(COALESCE(${contacts.tags}, '[]'::jsonb) || ${JSON.stringify(addTags)}::jsonb) AS t
      )`
    }
    for (const tag of removeTags) {
      updates.tags = sql`(
        SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
        FROM jsonb_array_elements_text(COALESCE(${contacts.tags}, '[]'::jsonb)) AS t
        WHERE t <> ${tag}
      )`
    }

    const updated = await db
      .update(contacts)
      .set(updates)
      .where(and(inArray(contacts.id, targetIds), isNull(contacts.deleted_at)))
      .returning({ id: contacts.id })

    return NextResponse.json({ success: true, count: updated.length })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[contacts] update failed', error)
    return NextResponse.json({ error: 'Failed to update contacts' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authGuard(request, ['admin'])
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const idsParam = searchParams.get('ids')
    const idsToDelete = id
      ? [id]
      : (idsParam || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: 'Contact ID or IDs are required' }, { status: 400 })
    }

    // Soft delete — contacts are never hard-deleted, matching the CRM invariant.
    const deleted = await db
      .update(contacts)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(and(inArray(contacts.id, idsToDelete), isNull(contacts.deleted_at)))
      .returning({ id: contacts.id })

    return NextResponse.json({ success: true, count: deleted.length })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[contacts] delete failed', error)
    return NextResponse.json({ error: 'Failed to delete contacts' }, { status: 500 })
  }
}
