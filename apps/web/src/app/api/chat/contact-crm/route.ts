// Contact CRM panel for the chat inbox: reads a contact (by id or phone) with
// their conversations, notes, deals, and agents, and applies inline edits from the drawer.
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, conversations, crm_notes, deals, pipelines, pipeline_stages, users, crm_activities } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

const LIFECYCLE_STAGES = ['lead', 'subscriber', 'prospect', 'client', 'churned']

async function findContact(contactId?: string, phone?: string) {
  if (contactId) {
    const rows = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1)
    return rows[0] ?? null
  }
  if (phone) {
    const normalized = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`
    const rows = await db.select().from(contacts).where(eq(contacts.phone, normalized)).limit(1)
    return rows[0] ?? null
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'staff'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId') ?? undefined
    const phone = searchParams.get('phone') ?? undefined

    const contact = await findContact(contactId, phone)
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const [contactConversations, contactNotes, contactDeals, allAgentsList, activitiesList] = await Promise.all([
      db
        .select()
        .from(conversations)
        .where(eq(conversations.contact_id, contact.id))
        .orderBy(desc(conversations.last_message_at))
        .limit(10),
      db
        .select()
        .from(crm_notes)
        .where(eq(crm_notes.contact_id, contact.id))
        .orderBy(desc(crm_notes.created_at))
        .limit(50),
      db
        .select()
        .from(deals)
        .where(eq(deals.contact_id, contact.id))
        .orderBy(desc(deals.created_at))
        .limit(10),
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role_id,
        })
        .from(users)
        .where(eq(users.is_active, true))
        .limit(100),
      db
        .select()
        .from(crm_activities)
        .where(eq(crm_activities.contact_id, contact.id))
        .orderBy(desc(crm_activities.created_at))
        .limit(20),
    ])

    const primaryConv = contactConversations[0] || null
    const primaryDeal = contactDeals[0] || null
    const customFields = (contact.custom_fields || {}) as Record<string, any>

    return NextResponse.json({
      contact: {
        ...contact,
        leadStage: customFields.lead_stage || customFields.leadStage || (primaryDeal ? 'PROPOSAL' : 'NEW_LEAD'),
        dealValue: Number(primaryDeal?.value || customFields.deal_value || customFields.dealValue || 0),
        city: customFields.city || customFields.jurisdiction || '',
        conversation: {
          id: primaryConv?.id,
          assignedToId: primaryConv?.assigned_to || contact.owner_id,
          notes: contactNotes.map((n) => ({
            id: n.id,
            body: n.body,
            createdAt: n.created_at,
            author: { name: n.author_name || 'Agent' },
          })),
          events: activitiesList.map((a) => ({
            id: a.id,
            type: a.type.toUpperCase(),
            actor: { name: a.logged_by || 'Staff' },
            createdAt: a.created_at,
          })),
        },
      },
      conversations: contactConversations,
      notes: contactNotes,
      deals: contactDeals,
      allAgents: allAgentsList,
    })
  } catch (error) {
    console.error('Error fetching contact CRM data', error)
    return NextResponse.json({ error: 'Failed to retrieve contact CRM data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let user: { id: string; email?: string }
  try {
    user = await authGuard(request, ['admin', 'super_admin', 'staff'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const body = await request.json()
    const {
      contactId,
      first_name,
      last_name,
      email,
      company,
      city,
      leadStage,
      dealValue,
      assignToId,
      noteText,
      addTags,
      whatsapp_consent,
    } = body

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 })
    }

    const existingRows = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1)
    const existing = existingRows[0]
    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // 1. Add Note if provided
    if (typeof noteText === 'string' && noteText.trim()) {
      const userRow = await db.select({ name: users.name }).from(users).where(eq(users.id, user.id)).limit(1)
      const authorName = userRow[0]?.name || user.email || 'Sales Agent'

      await db.insert(crm_notes).values({
        id: randomUUID(),
        contact_id: contactId,
        body: noteText.trim(),
        author_id: user.id,
        author_name: authorName,
      })
    }

    // 2. Update Contact Properties
    const customFields = ((existing.custom_fields || {}) as Record<string, any>)
    if (leadStage !== undefined) customFields.lead_stage = leadStage
    if (dealValue !== undefined) customFields.deal_value = dealValue
    if (city !== undefined) customFields.city = city

    const patch: Partial<typeof contacts.$inferInsert> = {
      updated_at: new Date(),
      custom_fields: customFields,
    }

    if (first_name !== undefined) patch.first_name = first_name
    if (last_name !== undefined) patch.last_name = last_name
    if (email !== undefined) patch.email = email
    if (company !== undefined) patch.company = company
    if (assignToId !== undefined) patch.owner_id = assignToId || null

    if (whatsapp_consent) {
      patch.whatsapp_consent = whatsapp_consent
      patch.whatsapp_consent_at = whatsapp_consent === 'granted' ? new Date() : null
    }

    if (Array.isArray(addTags) && addTags.length > 0) {
      const tags = Array.isArray(existing.tags) ? [...existing.tags] : []
      for (const tag of addTags.map(String)) {
        if (!tags.includes(tag)) tags.push(tag)
      }
      patch.tags = tags
    }

    const updatedContact = await db.update(contacts).set(patch).where(eq(contacts.id, contactId)).returning()

    // 3. Update Conversation assigned agent if specified
    if (assignToId !== undefined) {
      await db
        .update(conversations)
        .set({
          assigned_to: assignToId || null,
          updated_at: new Date(),
        })
        .where(eq(conversations.contact_id, contactId))
    }

    return NextResponse.json({ success: true, contact: updatedContact[0] })
  } catch (error) {
    console.error('Error updating contact from chat', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

