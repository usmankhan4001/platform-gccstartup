import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  contacts,
  crm_activities,
  crm_notes,
  crm_tasks,
  deals,
  conversations,
  messages,
  email_sends,
  users,
} from '@gccstartup/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await authGuard(request)
    const { id } = await params

    const leadRows = await db
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
      .where(and(eq(contacts.id, id), isNull(contacts.deleted_at)))
      .limit(1)

    const rawLead = leadRows[0]
    if (!rawLead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const cf = (rawLead.custom_fields || {}) as Record<string, any>
    const lead = {
      ...rawLead,
      ...cf,
      id: rawLead.id,
      name: rawLead.name,
      email: rawLead.email,
      phone: rawLead.phone,
      company: rawLead.company || cf.company_name_choice_1 || null,
      status: cf.status || rawLead.status || 'new',
      priority: cf.priority || 'normal',
      assigned_to: rawLead.owner_id ? { id: rawLead.owner_id, name: rawLead.owner_name } : null,
      estimated_value: cf.deal_value || cf.estimated_value || 5800,
      deal_value: cf.deal_value || cf.estimated_value || 5800,
      currency: cf.currency || 'USD',
      jurisdiction: cf.jurisdiction || 'UAE · IFZA',
      desk: cf.desk || 'Dubai Desk',
      tax_regime: cf.tax_regime || '0% QFZP Qualified',
      kyc_status: cf.kyc_status || 'pending',
      order_number: cf.order_number || `GCC-${rawLead.id.slice(0, 6).toUpperCase()}`,
      trade_license_number: cf.trade_license_number || null,
      trade_license_expiry: cf.trade_license_expiry || null,
      visa_eid_expiry: cf.visa_eid_expiry || null,
      tax_filing_deadline: cf.tax_filing_deadline || null,
      vat_deadline: cf.vat_deadline || null,
      annual_retainer_fee: cf.annual_retainer_fee || 8500,
      official_documents: Array.isArray(cf.official_documents) ? cf.official_documents : [],
      preliminary_documents: Array.isArray(cf.preliminary_documents) ? cf.preliminary_documents : [],
      documents: Array.isArray(cf.documents) ? cf.documents : [],
    }

    const [activities, tasks, notes, deals_, convs, emailSends] = await Promise.all([
      db
        .select()
        .from(crm_activities)
        .where(eq(crm_activities.contact_id, id))
        .orderBy(desc(crm_activities.occurred_at))
        .limit(100),
      db
        .select({
          id: crm_tasks.id,
          title: crm_tasks.title,
          details: crm_tasks.details,
          due_at: crm_tasks.due_at,
          completed_at: crm_tasks.completed_at,
          completed_by: crm_tasks.completed_by,
          priority: crm_tasks.priority,
          assignee_id: crm_tasks.assignee_id,
          assignee_name: users.name,
          contact_id: crm_tasks.contact_id,
          deal_id: crm_tasks.deal_id,
          created_at: crm_tasks.created_at,
          status: sql<string>`CASE WHEN ${crm_tasks.completed_at} IS NOT NULL THEN 'completed' ELSE 'active' END`,
        })
        .from(crm_tasks)
        .leftJoin(users, eq(users.id, crm_tasks.assignee_id))
        .where(eq(crm_tasks.contact_id, id))
        .orderBy(desc(crm_tasks.created_at))
        .limit(100),
      db
        .select()
        .from(crm_notes)
        .where(eq(crm_notes.contact_id, id))
        .orderBy(desc(crm_notes.created_at))
        .limit(100),
      db
        .select()
        .from(deals)
        .where(eq(deals.contact_id, id))
        .orderBy(desc(deals.created_at))
        .limit(50),
      db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.contact_id, id))
        .limit(10),
      db
        .select()
        .from(email_sends)
        .where(eq(email_sends.contact_id, id))
        .orderBy(desc(email_sends.created_at))
        .limit(50),
    ])

    // Load WhatsApp messages if conversation exists
    let rawMessages: any[] = []
    if (convs.length > 0) {
      const convIds = convs.map((c) => c.id)
      rawMessages = await db
        .select()
        .from(messages)
        .where(sql`${messages.conversation_id} IN ${convIds}`)
        .orderBy(desc(messages.occurred_at))
        .limit(100)
    }

    return NextResponse.json({
      data: {
        lead,
        activities,
        tasks,
        notes,
        deals: deals_,
        messages: rawMessages,
        emailEvents: emailSends,
      },
      lead,
      activities,
      tasks,
      stageHistory: [],
      consents: [],
      emailEvents: emailSends,
      messages: rawMessages,
      notes,
      deals: deals_,
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
    const user = await authGuard(request, ['staff'])
    const { id } = await params
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const existing = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), isNull(contacts.deleted_at)))
      .limit(1)
    if (!existing.length) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

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
    if (body.incorporation_date !== undefined) nextCf.incorporation_date = body.incorporation_date
    if (body.trade_license_expiry !== undefined) nextCf.trade_license_expiry = body.trade_license_expiry
    if (body.annual_renewal_date !== undefined) nextCf.annual_renewal_date = body.annual_renewal_date
    if (body.visa_eid_expiry !== undefined) nextCf.visa_eid_expiry = body.visa_eid_expiry
    if (body.tax_filing_deadline !== undefined) nextCf.tax_filing_deadline = body.tax_filing_deadline
    if (body.vat_deadline !== undefined) nextCf.vat_deadline = body.vat_deadline
    if (body.annual_retainer_fee !== undefined) nextCf.annual_retainer_fee = body.annual_retainer_fee
    if (body.reminders_sent !== undefined) nextCf.reminders_sent = body.reminders_sent
    if (body.documents !== undefined) nextCf.documents = body.documents
    if (body.official_documents !== undefined) nextCf.official_documents = body.official_documents
    if (body.notes !== undefined) nextCf.notes = body.notes
    if (body.lost_reason !== undefined) nextCf.lost_reason = body.lost_reason

    const updates: Record<string, unknown> = {
      updated_at: new Date(),
      custom_fields: nextCf,
    }

    if (body.assigned_to !== undefined) updates.owner_id = body.assigned_to || null
    if (body.owner_id !== undefined) updates.owner_id = body.owner_id || null
    if (typeof body.email === 'string') updates.email = body.email.trim().toLowerCase() || null
    if (typeof body.phone === 'string') updates.phone = body.phone.trim() || null
    if (typeof body.company === 'string') updates.company = body.company.trim().slice(0, 200) || null
    if (typeof body.first_name === 'string') updates.first_name = body.first_name.trim().slice(0, 100) || null
    if (typeof body.last_name === 'string') updates.last_name = body.last_name.trim().slice(0, 100) || null
    if (typeof body.name === 'string') updates.display_name = body.name.trim().slice(0, 200) || null

    const nextStage = body.status ?? body.stage
    if (typeof nextStage === 'string' && ['lead', 'subscriber', 'prospect', 'client', 'churned'].includes(nextStage)) {
      updates.lifecycle_stage = nextStage as any
    }

    const updated = await db
      .update(contacts)
      .set(updates)
      .where(and(eq(contacts.id, id), isNull(contacts.deleted_at)))
      .returning()

    if (!updated.length) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const r = updated[0]
    const enhancedLead = {
      ...r,
      ...nextCf,
      id: r.id,
      name: r.display_name || [r.first_name, r.last_name].filter(Boolean).join(' ') || r.email || r.phone,
      email: r.email,
      phone: r.phone,
      company: r.company || nextCf.company_name_choice_1 || null,
      status: nextCf.status || r.lifecycle_stage || 'new',
      priority: nextCf.priority || 'normal',
      assigned_to: r.owner_id,
      estimated_value: nextCf.deal_value || nextCf.estimated_value || 5800,
      deal_value: nextCf.deal_value || nextCf.estimated_value || 5800,
      currency: nextCf.currency || 'USD',
      jurisdiction: nextCf.jurisdiction || 'UAE · IFZA',
      desk: nextCf.desk || 'Dubai Desk',
      tax_regime: nextCf.tax_regime || '0% QFZP Qualified',
      kyc_status: nextCf.kyc_status || 'pending',
    }

    return NextResponse.json({ data: enhancedLead, lead: enhancedLead })
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
