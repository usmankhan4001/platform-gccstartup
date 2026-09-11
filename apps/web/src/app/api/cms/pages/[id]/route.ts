import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { pages } from '@gccstartup/db'
import { handleAdmin, json, errorJson } from '../../../admin/_lib'

const updateSchema = z.object({
  title: z.string().max(200).optional(),
  slug: z.string().max(200).optional(),
  blocks: z.any().optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().optional().nullable(),
})

export const GET = (request: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  handleAdmin(request, async () => {
    const { id } = await params
    const rows = await db.select().from(pages).where(eq(pages.id, id)).limit(1)

    if (!rows[0]) return errorJson('Page not found', 404)
    return json(rows[0])
  })

export const PUT = (request: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  handleAdmin(request, async (admin) => {
    const { id } = await params
    const body = await request.json().catch(() => null)
    if (!body) return errorJson('Invalid JSON body', 400)

    const result = updateSchema.safeParse(body)
    if (!result.success) {
      return errorJson(result.error.errors[0]?.message || 'Invalid input', 400)
    }

    const existing = await db.select({ id: pages.id }).from(pages).where(eq(pages.id, id)).limit(1)
    if (!existing[0]) return errorJson('Page not found', 404)

    const updateData = {
      ...result.data,
      updated_by: admin.id,
      updated_at: new Date(),
    }

    await db.update(pages).set(updateData).where(eq(pages.id, id))

    return json({ success: true })
  })

export const DELETE = (request: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  handleAdmin(request, async () => {
    const { id } = await params
    
    const existing = await db.select({ id: pages.id }).from(pages).where(eq(pages.id, id)).limit(1)
    if (!existing[0]) return errorJson('Page not found', 404)

    await db.delete(pages).where(eq(pages.id, id))

    return json({ success: true })
  })
