import { NextRequest } from 'next/server'
import { desc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { pages } from '@gccstartup/db'
import { handleAdmin, json, errorJson, newId } from '../../admin/_lib'

const createSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200),
  status: z.enum(['draft', 'published', 'scheduled']).optional().default('draft'),
})

export const GET = (request: NextRequest) =>
  handleAdmin(request, async () => {
    const rows = await db
      .select({
        id: pages.id,
        title: pages.title,
        slug: pages.slug,
        status: pages.status,
        author: pages.author,
        blocks_count: pages.blocks, // we will return blocks length
        created_at: pages.created_at,
        updated_at: pages.updated_at,
      })
      .from(pages)
      .orderBy(desc(pages.updated_at))
      .limit(500)

    const formatted = rows.map((r) => {
      const blocksObj = r.blocks_count as any
      let count = 0
      if (Array.isArray(blocksObj)) count = blocksObj.length
      else if (blocksObj && typeof blocksObj === 'object' && Array.isArray(blocksObj.content)) count = blocksObj.content.length
      
      return {
        ...r,
        blocksCount: count,
        blocks_count: undefined,
      }
    })

    return json(formatted)
  })

export const POST = (request: NextRequest) =>
  handleAdmin(request, async (admin) => {
    const body = await request.json().catch(() => null)
    if (!body) return errorJson('Invalid JSON body', 400)

    const result = createSchema.safeParse(body)
    if (!result.success) {
      return errorJson(result.error.errors[0]?.message || 'Invalid input', 400)
    }

    const { title, slug, status } = result.data
    const id = newId()

    await db.insert(pages).values({
      id,
      title,
      slug,
      status,
      author: admin.name || admin.email,
      created_by: admin.id,
      blocks: [],
    })

    return json({ id, title, slug, status }, 201)
  })
