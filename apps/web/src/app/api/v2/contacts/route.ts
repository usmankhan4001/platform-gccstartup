import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, paginationFrom, metaFor, newId } from '../_lib'

const LIFECYCLE_STAGES = ['lead', 'subscriber', 'prospect', 'client', 'churned'] as const
const CONSENT_STATES = ['unknown', 'granted', 'denied'] as const

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'contacts:read')) return errorJson('Missing permission: contacts:read', 403)
  return handle(async () => {
    const { page, limit, offset } = paginationFrom(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const filters: Array<ReturnType<typeof eq>> = [isNull(contacts.deleted_at) as never]

    for (const [rawKey, rawValue] of searchParams.entries()) {
      if (!rawKey.startsWith('filter[') || !rawKey.endsWith(']')) continue
      const filterKey = rawKey.slice(7, -1)
      if (filterKey === 'lifecycle_stage' || filterKey === 'lifecycleStage') {
        if ((LIFECYCLE_STAGES as readonly string[]).includes(rawValue)) filters.push(eq(contacts.lifecycle_stage, rawValue as (typeof LIFECYCLE_STAGES)[number]) as never)
      } else if (filterKey === 'email_consent' || filterKey === 'emailConsent') {
        if ((CONSENT_STATES as readonly string[]).includes(rawValue)) filters.push(eq(contacts.email_consent, rawValue as (typeof CONSENT_STATES)[number]) as never)
      } else if (filterKey === 'source' && rawValue) {
        filters.push(eq(contacts.source, rawValue) as never)
      }
    }

    if (search) {
      const term = `%${search}%`
      filters.push(
        or(
          ilike(contacts.first_name, term),
          ilike(contacts.last_name, term),
          ilike(contacts.email, term),
          ilike(contacts.display_name, term),
        ) as never,
      )
    }

    const where = and(...filters)

    const [rows, totals] = await Promise.all([
      db.select().from(contacts).where(where).orderBy(desc(contacts.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(contacts).where(where),
    ])

    const total = totals[0]?.count ?? 0
    return json(
      rows.map((row) => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        displayName: row.display_name,
        email: row.email,
        phone: row.phone,
        company: row.company,
        jobTitle: row.job_title,
        lifecycleStage: row.lifecycle_stage,
        source: row.source,
        tags: row.tags ?? [],
        customAttributes: row.custom_fields ?? {},
        emailConsent: row.email_consent,
        whatsappConsent: row.whatsapp_consent,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      200,
      metaFor(page, limit, total),
    )
  })
})

export const POST = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'contacts:write')) return errorJson('Missing permission: contacts:write', 403)
  return handle(async () => {
    const body = await request.json()
    const { firstName, lastName, email, phone, company, jobTitle, lifecycleStage, source, tags, customAttributes, emailConsent } = body ?? {}

    if (!firstName?.trim() && !email?.trim() && !phone?.trim()) {
      return errorJson('At least one of firstName, email, or phone is required', 400)
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return errorJson('Invalid email address', 400)
    }

    const created = await db
      .insert(contacts)
      .values({
        id: newId(),
        email: email ? String(email).trim().toLowerCase() : null,
        phone: phone ? String(phone).trim() : null,
        first_name: firstName ? String(firstName).trim() : null,
        last_name: lastName ? String(lastName).trim() : null,
        display_name: [firstName, lastName].filter(Boolean).join(' ').trim() || null,
        company: company ? String(company) : null,
        job_title: jobTitle ? String(jobTitle) : null,
        lifecycle_stage: (LIFECYCLE_STAGES as readonly string[]).includes(lifecycleStage) ? lifecycleStage : 'lead',
        source: source ? String(source).slice(0, 100) : 'api',
        tags: Array.isArray(tags) ? tags.map(String).slice(0, 50) : [],
        custom_fields: customAttributes && typeof customAttributes === 'object' ? customAttributes : {},
        email_consent: (CONSENT_STATES as readonly string[]).includes(emailConsent) ? emailConsent : 'unknown',
        email_consent_at: emailConsent === 'granted' ? new Date() : null,
      })
      .returning()

    const row = created[0]
    return json({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      lifecycleStage: row.lifecycle_stage,
      customAttributes: row.custom_fields,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }, 201)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
