import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { email_templates } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, paginationFrom, metaFor, newId } from '../_lib'

const CATEGORIES = ['marketing', 'transactional', 'flow', 'notification'] as const

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'templates:read')) return errorJson('Missing permission: templates:read', 403)
  return handle(async () => {
    const { page, limit, offset } = paginationFrom(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const filters: Array<any> = []

    for (const [rawKey, rawValue] of searchParams.entries()) {
      if (!rawKey.startsWith('filter[') || !rawKey.endsWith(']')) continue
      const filterKey = rawKey.slice(7, -1)
      if (filterKey === 'category' && (CATEGORIES as readonly string[]).includes(rawValue)) {
        filters.push(eq(email_templates.category, rawValue as (typeof CATEGORIES)[number]))
      } else if (filterKey === 'isActive' && ['true', 'false'].includes(rawValue)) {
        filters.push(eq(email_templates.is_active, rawValue === 'true'))
      }
    }
    if (search) filters.push(ilike(email_templates.name, `%${search}%`))
    const where = filters.length ? and(...filters) : undefined

    const [rows, totals] = await Promise.all([
      db.select().from(email_templates).where(where).orderBy(desc(email_templates.updated_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(email_templates).where(where),
    ])

    const total = totals[0]?.count ?? 0
    return json(rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: 'email',
      category: row.category,
      subject: row.subject,
      content: row.html_body,
      variables: row.variables ?? [],
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })), 200, metaFor(page, limit, total))
  })
})

export const POST = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'templates:write')) return errorJson('Missing permission: templates:write', 403)
  return handle(async () => {
    const body = await request.json()
    const { name, subject, content, text, blocks, variables, category, customAttributes } = body ?? {}

    if (!name?.trim() || !subject?.trim() || !content?.trim()) {
      return errorJson('Name, subject and content are required', 400)
    }

    const created = await db
      .insert(email_templates)
      .values({
        id: newId(),
        name: String(name).trim().slice(0, 200),
        subject: String(subject).trim().slice(0, 500),
        html_body: String(content),
        text_body: text ? String(text) : null,
        blocks: Array.isArray(blocks) ? blocks : [],
        variables: Array.isArray(variables) ? variables.map(String) : [],
        category: (CATEGORIES as readonly string[]).includes(category) ? category : 'marketing',
        ...(customAttributes && typeof customAttributes === 'object' && 'description' in customAttributes
          ? { description: String((customAttributes as Record<string, unknown>).description) }
          : {}),
      })
      .returning()

    const row = created[0]
    return json({
      id: row.id,
      name: row.name,
      type: 'email',
      category: row.category,
      subject: row.subject,
      content: row.html_body,
      variables: row.variables ?? [],
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }, 201)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
