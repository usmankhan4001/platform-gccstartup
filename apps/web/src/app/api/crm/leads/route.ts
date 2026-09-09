import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, users } from '@gccstartup/db'

const LIFECYCLE_STAGES = [
  'lead',
  'subscriber',
  'prospect',
  'client',
  'churned',
  'new',
  'paid_application',
  'kyc_processing',
  'kyc_review',
  'kyc_received',
  'applied',
  'registered',
  'banking_filed',
  'won',
  'closed',
  'lost',
] as const

function parseStage(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (normalized === 'all' || normalized === '') return null
  return normalized
}

export async function GET(request: NextRequest) {
  try {
    await authGuard(request)
    const { searchParams } = new URL(request.url)
    const rawStatus = searchParams.get('status') || searchParams.get('stage')
    const stage = rawStatus && rawStatus !== 'all' ? parseStage(rawStatus) : null
    const search = searchParams.get('search')?.trim() || searchParams.get('q')?.trim() || null
    const ownerId = searchParams.get('assigned_to') || searchParams.get('owner_id')
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || searchParams.get('page_size') || '100', 10)))
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || String((page - 1) * limit), 10))

    const filters = [isNull(contacts.deleted_at)]
    if (stage) {
      if (['lead', 'subscriber', 'prospect', 'client', 'churned'].includes(stage)) {
        filters.push(eq(contacts.lifecycle_stage, stage as any))
      } else {
        // If stage is stored in custom_fields or mapped
        filters.push(
          or(
            sql`${contacts.custom_fields}->>'status' = ${stage}`,
            sql`${contacts.custom_fields}->>'stage' = ${stage}`
          )!
        )
      }
    }
    if (ownerId && ownerId !== 'all' && ownerId !== 'unassigned') {
      filters.push(eq(contacts.owner_id, ownerId))
    } else if (ownerId === 'unassigned') {
      filters.push(isNull(contacts.owner_id))
    }
    if (search) {
      const pattern = `%${search}%`
      const searchFilter = or(
        ilike(contacts.first_name, pattern),
        ilike(contacts.last_name, pattern),
        ilike(contacts.email, pattern),
        ilike(contacts.phone, pattern),
        ilike(contacts.company, pattern),
        sql`${contacts.custom_fields}->>'company_name_choice_1' ILIKE ${pattern}`,
        sql`${contacts.custom_fields}->>'trade_license_number' ILIKE ${pattern}`,
        sql`${contacts.custom_fields}->>'jurisdiction' ILIKE ${pattern}`
      )
      if (searchFilter) filters.push(searchFilter)
    }
    const where = and(...filters)

    const rows = await db
      .select({
        id: contacts.id,
        name: sql<string>`COALESCE(NULLIF(CONCAT_WS(' ', ${contacts.first_name}, ${contacts.last_name}), ''), ${contacts.display_name}, ${contacts.email}, ${contacts.phone})`,
        first_name: contacts.first_name,
        last_name: contacts.last_name,
        email: contacts.email,
        phone: contacts.phone,
        company: contacts.company,
        job_title: contacts.job_title,
        status: sql<string>`COALESCE(${contacts.custom_fields}->>'status', ${contacts.lifecycle_stage}::text, 'new')`,
        lifecycle_stage: contacts.lifecycle_stage,
        source: contacts.source,
        tags: contacts.tags,
        custom_fields: contacts.custom_fields,
        owner_id: contacts.owner_id,
        owner_name: users.name,
        created_at: contacts.created_at,
        date_created: sql<string>`${contacts.created_at}::text`,
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

    const total = Number(totalRows[0]?.count) || 0

    // Enhance records with mapped custom fields for full typed compatibility
    const enhanced = rows.map((r) => {
      const cf = (r.custom_fields || {}) as Record<string, any>
      return {
        ...r,
        ...cf,
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        company: r.company || cf.company_name_choice_1 || null,
        status: cf.status || r.status || 'new',
        priority: cf.priority || 'normal',
        assigned_to: r.owner_id ? { id: r.owner_id, name: r.owner_name } : null,
        estimated_value: cf.deal_value || cf.estimated_value || 5800,
        deal_value: cf.deal_value || cf.estimated_value || 5800,
        currency: cf.currency || 'USD',
        jurisdiction: cf.jurisdiction || 'UAE · IFZA',
        desk: cf.desk || 'Dubai Desk',
        tax_regime: cf.tax_regime || '0% QFZP Qualified',
        kyc_status: cf.kyc_status || 'pending',
        order_number: cf.order_number || `GCC-${r.id.slice(0, 6).toUpperCase()}`,
        trade_license_number: cf.trade_license_number || null,
        trade_license_expiry: cf.trade_license_expiry || null,
        visa_eid_expiry: cf.visa_eid_expiry || null,
        tax_filing_deadline: cf.tax_filing_deadline || null,
        vat_deadline: cf.vat_deadline || null,
        annual_retainer_fee: cf.annual_retainer_fee || 8500,
      }
    })

    return NextResponse.json({
      data: enhanced,
      leads: enhanced,
      total,
      hasNext: offset + limit < total,
    })
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
    const stage = (typeof body.status === 'string' ? body.status : 'new') || 'new'

    const customFields: Record<string, unknown> = {
      ...(body.custom_fields && typeof body.custom_fields === 'object' ? (body.custom_fields as any) : {}),
      status: stage,
      priority: body.priority || 'normal',
      jurisdiction: body.jurisdiction || 'UAE · IFZA',
      desk: body.desk || 'Dubai Desk',
      deal_value: body.deal_value || body.estimated_value || 5800,
      currency: body.currency || 'USD',
      tax_regime: body.tax_regime || '0% QFZP Qualified',
      kyc_status: body.kyc_status || 'pending',
      company_name_choice_1: body.company_name_choice_1 || body.company || null,
      company_name_choice_2: body.company_name_choice_2 || null,
      order_number: `GCC-${Math.floor(100000 + Math.random() * 900000)}`,
      trade_license_number: body.trade_license_number || null,
      trade_license_expiry: body.trade_license_expiry || null,
      visa_eid_expiry: body.visa_eid_expiry || null,
      tax_filing_deadline: body.tax_filing_deadline || null,
      vat_deadline: body.vat_deadline || null,
      annual_retainer_fee: body.annual_retainer_fee || 8500,
    }

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
        lifecycle_stage: ['lead', 'subscriber', 'prospect', 'client', 'churned'].includes(stage) ? (stage as any) : 'lead',
        source: typeof body.source === 'string' ? body.source.trim().slice(0, 100) : 'crm_manual',
        owner_id: typeof body.owner_id === 'string' ? body.owner_id : user.id,
        tags: Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === 'string') : [],
        custom_fields: customFields,
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

    for (const id of targetIds) {
      const existing = await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.id, id), isNull(contacts.deleted_at)))
        .limit(1)
      if (!existing.length) continue

      const current = existing[0]
      const currentCf = (current.custom_fields || {}) as Record<string, any>
      const nextCf = { ...currentCf }

      if (body.status !== undefined) nextCf.status = body.status
      if (body.stage !== undefined) nextCf.status = body.stage
      if (body.priority !== undefined) nextCf.priority = body.priority
      if (body.jurisdiction !== undefined) nextCf.jurisdiction = body.jurisdiction
      if (body.desk !== undefined) nextCf.desk = body.desk
      if (body.tax_regime !== undefined) nextCf.tax_regime = body.tax_regime
      if (body.kyc_status !== undefined) nextCf.kyc_status = body.kyc_status
      if (body.deal_value !== undefined) nextCf.deal_value = body.deal_value
      if (body.estimated_value !== undefined) nextCf.deal_value = body.estimated_value
      if (body.currency !== undefined) nextCf.currency = body.currency
      if (body.company_name_choice_1 !== undefined) nextCf.company_name_choice_1 = body.company_name_choice_1
      if (body.company_name_choice_2 !== undefined) nextCf.company_name_choice_2 = body.company_name_choice_2
      if (body.trade_license_number !== undefined) nextCf.trade_license_number = body.trade_license_number
      if (body.trade_license_expiry !== undefined) nextCf.trade_license_expiry = body.trade_license_expiry
      if (body.visa_eid_expiry !== undefined) nextCf.visa_eid_expiry = body.visa_eid_expiry
      if (body.tax_filing_deadline !== undefined) nextCf.tax_filing_deadline = body.tax_filing_deadline
      if (body.vat_deadline !== undefined) nextCf.vat_deadline = body.vat_deadline
      if (body.annual_retainer_fee !== undefined) nextCf.annual_retainer_fee = body.annual_retainer_fee
      if (body.reminders_sent !== undefined) nextCf.reminders_sent = body.reminders_sent
      if (body.documents !== undefined) nextCf.documents = body.documents
      if (body.official_documents !== undefined) nextCf.official_documents = body.official_documents

      const updates: Record<string, unknown> = {
        updated_at: new Date(),
        custom_fields: nextCf,
      }

      if (body.owner_id !== undefined) updates.owner_id = body.owner_id
      if (typeof body.email === 'string') updates.email = body.email.trim().toLowerCase() || null
      if (typeof body.phone === 'string') updates.phone = body.phone.trim() || null
      if (typeof body.company === 'string') updates.company = body.company.trim().slice(0, 200) || null
      if (typeof body.first_name === 'string') updates.first_name = body.first_name.trim().slice(0, 100) || null
      if (typeof body.last_name === 'string') updates.last_name = body.last_name.trim().slice(0, 100) || null

      const nextStage = body.status ?? body.stage
      if (typeof nextStage === 'string' && ['lead', 'subscriber', 'prospect', 'client', 'churned'].includes(nextStage)) {
        updates.lifecycle_stage = nextStage as any
      }

      await db
        .update(contacts)
        .set(updates)
        .where(eq(contacts.id, id))
    }

    return NextResponse.json({ success: true, count: targetIds.length })
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
