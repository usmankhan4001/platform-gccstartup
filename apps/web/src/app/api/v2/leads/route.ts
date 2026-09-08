import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contacts } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, paginationFrom, metaFor, newId } from '../_lib'

/**
 * Leads are contacts at the `lead` lifecycle stage — there is no separate leads
 * table. The API surface keeps the lead vocabulary (stage -> custom_fields.lead_stage,
 * score -> custom_fields.lead_score) so consumers never see the mapping.
 */
const LEAD_WHERE = and(eq(contacts.lifecycle_stage, 'lead'), isNull(contacts.deleted_at))

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'contacts:read')) return errorJson('Missing permission: contacts:read', 403)
  return handle(async () => {
    const { page, limit, offset } = paginationFrom(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const filters: Array<any> = [LEAD_WHERE]

    for (const [rawKey, rawValue] of searchParams.entries()) {
      if (!rawKey.startsWith('filter[') || !rawKey.endsWith(']')) continue
      const filterKey = rawKey.slice(7, -1)
      if (filterKey === 'source' && rawValue) filters.push(eq(contacts.source, rawValue))
      else if (filterKey === 'ownerId' && rawValue) filters.push(eq(contacts.owner_id, rawValue))
    }
    if (search) {
      const term = `%${search}%`
      filters.push(or(ilike(contacts.first_name, term), ilike(contacts.last_name, term), ilike(contacts.email, term)) as never)
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
        email: row.email,
        phone: row.phone,
        company: row.company,
        source: row.source,
        stage: (row.custom_fields as Record<string, unknown> | null)?.lead_stage ?? 'new',
        score: (row.custom_fields as Record<string, unknown> | null)?.lead_score ?? 0,
        ownerId: row.owner_id,
        emailConsent: row.email_consent,
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
    const { firstName, lastName, email, phone, company, source = 'api', stage = 'new', score = 0, ownerId, customAttributes } = body ?? {}

    if (!email?.trim() && !phone?.trim()) return errorJson('Email or phone is required', 400)

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
        lifecycle_stage: 'lead',
        source: String(source).slice(0, 100),
        owner_id: ownerId ? String(ownerId) : null,
        custom_fields: {
          ...(customAttributes && typeof customAttributes === 'object' ? customAttributes : {}),
          lead_stage: String(stage).slice(0, 50),
          lead_score: Number.isFinite(Number(score)) ? Number(score) : 0,
        },
      })
      .returning()

    const row = created[0]
    return json({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      source: row.source,
      stage,
      score,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }, 201)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
