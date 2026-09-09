import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { eq, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  contacts,
  deals,
  crm_tasks,
  crm_activities,
  conversations,
  messages,
  events,
  pipelines,
  pipeline_stages,
} from '@gccstartup/db'
import { calculateLeadScore } from '@/lib/crm/scoring'
import { emitAutomationTrigger } from '@/lib/automation/emit'

export interface LeadSubmissionPayload {
  email?: string | null
  phone?: string | null
  name?: string | null
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  job_title?: string | null
  country?: string | null
  jurisdiction?: string | null
  country_intent?: string | null
  service?: string | null
  package_type?: string | null
  source?: string | null
  tool_slug?: string | null
  lead_score?: number | null
  estimated_value?: number | null
  calculator_data?: Record<string, unknown> | null
  notes?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_term?: string | null
  utm_content?: string | null
  gclid?: string | null
}

function normalizePhoneE164(rawPhone?: string | null): string | null {
  if (!rawPhone) return null
  const cleaned = rawPhone.trim().replace(/[^\d+]/g, '')
  if (!cleaned) return null

  // Replace leading 00 with +
  let normalized = cleaned.replace(/^00/, '+')

  // UAE local number starting with 05 (e.g. 0501234567 -> +971501234567)
  if (/^05\d{8}$/.test(normalized)) {
    return `+971${normalized.slice(1)}`
  }

  // UAE 9 digits starting with 5 (e.g. 501234567 -> +971501234567)
  if (/^5\d{8}$/.test(normalized)) {
    return `+971${normalized}`
  }

  // If digits only without +, prepend +
  if (!normalized.startsWith('+')) {
    normalized = `+${normalized}`
  }

  return normalized.length >= 8 ? normalized : null
}

function calculateDynamicDealValue(payload: LeadSubmissionPayload): number {
  if (payload.estimated_value && payload.estimated_value >= 1000) {
    return Math.min(50000, Math.max(4500, Math.round(payload.estimated_value)))
  }

  const pkg = (payload.package_type || payload.service || '').toLowerCase()
  const jur = (payload.jurisdiction || payload.country || payload.country_intent || '').toLowerCase()

  if (pkg.includes('nominee') || pkg.includes('ubo') || pkg.includes('fiduciary')) {
    return 12500
  }
  if (pkg.includes('shelf') || pkg.includes('aged')) {
    return 11000
  }
  if (jur.includes('ksa') || jur.includes('saudi') || jur.includes('misa')) {
    return 14500
  }
  if (jur.includes('qatar') || jur.includes('qfc')) {
    return 9800
  }
  if (jur.includes('bahrain') || jur.includes('oman')) {
    return 7500
  }
  if (pkg.includes('multi_visa') || pkg.includes('investor_visa') || (payload.calculator_data?.visas && Number(payload.calculator_data.visas) > 2)) {
    return 8900
  }
  if (pkg.includes('premium') || pkg.includes('vip')) {
    return 7200
  }

  // Default standard formation deal value
  return 4800
}

function resolveDesk(payload: LeadSubmissionPayload): 'Dubai Desk' | 'Riyadh Desk' | 'Global Desk' {
  const target = `${payload.country || ''} ${payload.jurisdiction || ''} ${payload.country_intent || ''}`.toLowerCase()
  if (target.includes('ksa') || target.includes('saudi') || target.includes('riyadh')) {
    return 'Riyadh Desk'
  }
  if (target.includes('uae') || target.includes('dubai') || target.includes('abu dhabi') || target.includes('ifza') || target.includes('meydan') || target.includes('rakez') || target.includes('shams') || target.includes('dmcc')) {
    return 'Dubai Desk'
  }
  return 'Dubai Desk'
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = (await request.json().catch(() => null)) as LeadSubmissionPayload | null
    if (!rawBody) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const email = rawBody.email ? rawBody.email.trim().toLowerCase() : null
    const phone = normalizePhoneE164(rawBody.phone)

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'At least an email address or valid phone number is required' },
        { status: 400 }
      )
    }

    const firstName = rawBody.first_name?.trim() || rawBody.name?.split(' ')[0]?.trim() || 'Valued'
    const lastName = rawBody.last_name?.trim() || rawBody.name?.split(' ').slice(1).join(' ')?.trim() || 'Client'
    const displayName = rawBody.name?.trim() || `${firstName} ${lastName}`.trim()
    const company = rawBody.company?.trim() || null
    const source = rawBody.source?.trim() || rawBody.tool_slug || 'website_lead_engine'
    const desk = resolveDesk(rawBody)
    const dealValue = calculateDynamicDealValue(rawBody)

    // Compute Lead Score (0 - 100)
    const scoreResult = calculateLeadScore({
      email,
      phone,
      country: rawBody.country || rawBody.jurisdiction || rawBody.country_intent,
      jurisdiction: rawBody.jurisdiction,
      package_type: rawBody.package_type,
      estimated_value: dealValue,
      consent_status: 'granted',
    })

    const customFields = {
      ...(rawBody.calculator_data || {}),
      tool_slug: rawBody.tool_slug || null,
      jurisdiction: rawBody.jurisdiction || rawBody.country_intent || 'UAE',
      desk,
      utm_source: rawBody.utm_source || null,
      utm_medium: rawBody.utm_medium || null,
      utm_campaign: rawBody.utm_campaign || null,
      gclid: rawBody.gclid || null,
      notes: rawBody.notes || null,
      calculated_deal_value_usd: dealValue,
      lead_score: scoreResult.score,
      lead_tier: scoreResult.tier,
      lead_factors: scoreResult.factors,
      submitted_at: new Date().toISOString(),
    }

    // 1. Check existing contact by email or phone
    const existingContacts = await db
      .select()
      .from(contacts)
      .where(
        or(
          email ? eq(contacts.email, email) : sql`false`,
          phone ? eq(contacts.phone, phone) : sql`false`
        )
      )
      .limit(1)

    let contactId = existingContacts[0]?.id

    if (existingContacts.length > 0 && contactId) {
      // Update existing contact
      const prevCustom = (existingContacts[0].custom_fields as Record<string, unknown>) || {}
      await db
        .update(contacts)
        .set({
          first_name: firstName !== 'Valued' ? firstName : existingContacts[0].first_name,
          last_name: lastName !== 'Client' ? lastName : existingContacts[0].last_name,
          display_name: displayName !== 'Valued Client' ? displayName : existingContacts[0].display_name,
          company: company || existingContacts[0].company,
          phone: phone || existingContacts[0].phone,
          email: email || existingContacts[0].email,
          custom_fields: { ...prevCustom, ...customFields },
          tags: Array.from(new Set([...(existingContacts[0].tags || []), source, desk, `tier:${scoreResult.tier}`])),
          whatsapp_consent: 'granted',
          whatsapp_consent_at: new Date(),
          email_consent: 'granted',
          email_consent_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(contacts.id, contactId))
    } else {
      // Insert new contact
      contactId = randomUUID()
      await db.insert(contacts).values({
        id: contactId,
        email,
        phone,
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        company,
        lifecycle_stage: 'lead',
        source,
        tags: [source, desk, `tier:${scoreResult.tier}`, 'inbound_v4'],
        custom_fields: customFields,
        email_consent: 'granted',
        email_consent_at: new Date(),
        whatsapp_consent: 'granted',
        whatsapp_consent_at: new Date(),
      })
    }

    // 2. Ensure default pipeline and stage exists
    let pipelineId: string | null = null
    let stageId: string | null = null

    const existingPipelines = await db
      .select({ id: pipelines.id })
      .from(pipelines)
      .where(eq(pipelines.is_default, true))
      .limit(1)

    if (existingPipelines[0]) {
      pipelineId = existingPipelines[0].id
    } else {
      const anyPipeline = await db.select({ id: pipelines.id }).from(pipelines).limit(1)
      if (anyPipeline[0]) {
        pipelineId = anyPipeline[0].id
      } else {
        pipelineId = randomUUID()
        await db.insert(pipelines).values({
          id: pipelineId,
          name: 'Direct Formation Pipeline',
          default_currency: 'USD',
          is_default: true,
        })
      }
    }

    const existingStages = await db
      .select({ id: pipeline_stages.id })
      .from(pipeline_stages)
      .where(eq(pipeline_stages.pipeline_id, pipelineId))
      .orderBy(pipeline_stages.position)
      .limit(1)

    if (existingStages[0]) {
      stageId = existingStages[0].id
    } else {
      stageId = randomUUID()
      await db.insert(pipeline_stages).values({
        id: stageId,
        pipeline_id: pipelineId,
        name: 'New Lead',
        position: 10,
        kind: 'open',
        probability: 20,
      })
    }

    // 3. Create Deal record
    const dealId = randomUUID()
    const dealTitle = `${rawBody.jurisdiction || rawBody.country_intent || 'UAE Freezone'} Formation - ${company || displayName}`

    await db.insert(deals).values({
      id: dealId,
      title: dealTitle,
      contact_id: contactId,
      pipeline_id: pipelineId,
      stage_id: stageId,
      value: dealValue,
      currency: 'USD',
      probability: scoreResult.score >= 70 ? 40 : 20,
      status: 'open',
    })

    // 4. Create follow-up task with 15m SLA
    const taskId = randomUUID()
    await db.insert(crm_tasks).values({
      id: taskId,
      title: `[15-min SLA] Call Lead: ${displayName} (${desk})`,
      details: `Inbound lead from ${source}. Estimated Deal Value: $${dealValue.toLocaleString()}. Score: ${scoreResult.score}/100 (${scoreResult.tier}). Intent: ${rawBody.jurisdiction || 'GCC'}.`,
      priority: scoreResult.score >= 70 ? 'high' : 'normal',
      due_at: new Date(Date.now() + 15 * 60 * 1000),
      contact_id: contactId,
      deal_id: dealId,
    })

    // 5. Create activity record
    await db.insert(crm_activities).values({
      id: randomUUID(),
      contact_id: contactId,
      deal_id: dealId,
      type: 'meeting',
      direction: 'inbound',
      subject: `Inbound Tool Submission: ${source}`,
      notes: JSON.stringify(customFields, null, 2),
      occurred_at: new Date(),
    })

    // 6. Spawn / ensure WhatsApp conversation if phone is present
    if (phone) {
      const existingConvs = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.contact_id, contactId))
        .limit(1)

      let convId = existingConvs[0]?.id
      if (!convId) {
        convId = randomUUID()
        await db.insert(conversations).values({
          id: convId,
          contact_id: contactId,
          channel: 'whatsapp',
          state: 'open',
          unread_count: 1,
          last_inbound_at: new Date(),
          last_message_at: new Date(),
          metadata: {
            source,
            desk,
            deal_id: dealId,
          },
        })
      }

      await db.insert(messages).values({
        id: randomUUID(),
        conversation_id: convId,
        direction: 'inbound',
        body: `Inbound inquiry from ${displayName} via ${source}. Estimated setup: $${dealValue.toLocaleString()}. Desk: ${desk}.`,
        message_ref: `inbound_${Date.now()}_${randomUUID().slice(0, 8)}`,
        status: 'delivered',
        occurred_at: new Date(),
        metadata: customFields,
      })
    }

    // 7. Insert Audit Event in events table
    await db.insert(events).values({
      id: randomUUID(),
      event_type: 'lead.created',
      source: `public_web:${source}`,
      payload: {
        contactId,
        dealId,
        email,
        phone,
        dealValue,
        leadScore: scoreResult.score,
        tier: scoreResult.tier,
        desk,
        customFields,
      },
    })

    // 8. Fire automation triggers asynchronously
    await emitAutomationTrigger('lead.created', {
      lead_id: contactId,
      email: email || undefined,
      phone: phone || undefined,
      country: rawBody.country || rawBody.jurisdiction || undefined,
      score: scoreResult.score,
    } as any)

    await emitAutomationTrigger('form.submitted', {
      form_id: source,
      lead_id: contactId,
      data: customFields,
    } as any)

    return NextResponse.json({
      success: true,
      leadId: contactId,
      dealId,
      dealValue,
      score: scoreResult.score,
      scoreTier: scoreResult.tier,
      desk,
      message: 'Lead ingested and routed successfully',
    })
  } catch (error) {
    console.error('[api/lead/submit] Ingestion error:', error)
    return NextResponse.json(
      {
        error: 'Failed to ingest lead submission',
        details: error instanceof Error ? error.message : 'Unknown server error',
      },
      { status: 500 }
    )
  }
}
