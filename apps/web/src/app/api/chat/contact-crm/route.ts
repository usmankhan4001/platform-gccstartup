// Contact CRM panel for the chat inbox: reads a contact (by id or phone) with
// their conversations and notes, and applies inline edits from the drawer.
import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts, conversations, crm_notes, deals } from '@gccstartup/db'
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

    const [contactConversations, contactNotes, contactDeals] = await Promise.all([
      db
        .select()
        .from(conversations)
        .where(eq(conversations.contact_id, contact.id))
        .orderBy(desc(conversations.last_message_at))
        .limit(50),
      db
        .select()
        .from(crm_notes)
        .where(eq(crm_notes.contact_id, contact.id))
        .orderBy(desc(crm_notes.created_at))
        .limit(50),
      db.select().from(deals).where(eq(deals.contact_id, contact.id)).limit(50),
    ])

    return NextResponse.json({
      contact,
      conversations: contactConversations,
      notes: contactNotes,
      deals: contactDeals,
    })
  } catch (error) {
    console.error('Error fetching contact CRM data', error)
    return NextResponse.json({ error: 'Failed to retrieve contact CRM data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'staff'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const body = await request.json()
    const { contactId, ...fields } = body as {
      contactId?: string
      first_name?: string
      last_name?: string
      email?: string
      company?: string
      job_title?: string
      lifecycle_stage?: string
      addTags?: string[]
      whatsapp_consent?: 'unknown' | 'granted' | 'denied'
    }

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 })
    }

    const existingRows = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1)
    const existing = existingRows[0]
    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (fields.lifecycle_stage && !LIFECYCLE_STAGES.includes(fields.lifecycle_stage)) {
      return NextResponse.json(
        { error: `lifecycle_stage must be one of: ${LIFECYCLE_STAGES.join(', ')}` },
        { status: 400 }
      )
    }

    const patch: Partial<typeof contacts.$inferInsert> = { updated_at: new Date() }
    if (fields.first_name !== undefined) patch.first_name = fields.first_name
    if (fields.last_name !== undefined) patch.last_name = fields.last_name
    if (fields.email !== undefined) patch.email = fields.email
    if (fields.company !== undefined) patch.company = fields.company
    if (fields.job_title !== undefined) patch.job_title = fields.job_title
    if (fields.lifecycle_stage) patch.lifecycle_stage = fields.lifecycle_stage as typeof existing.lifecycle_stage
    if (fields.whatsapp_consent) {
      patch.whatsapp_consent = fields.whatsapp_consent
      patch.whatsapp_consent_at = fields.whatsapp_consent === 'granted' ? new Date() : null
    }
    if (Array.isArray(fields.addTags) && fields.addTags.length > 0) {
      const tags = Array.isArray(existing.tags) ? [...existing.tags] : []
      for (const tag of fields.addTags.map(String)) {
        if (!tags.includes(tag)) tags.push(tag)
      }
      patch.tags = tags
    }

    const updated = await db.update(contacts).set(patch).where(eq(contacts.id, contactId)).returning()

    return NextResponse.json({ contact: updated[0] })
  } catch (error) {
    console.error('Error updating contact from chat', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}
