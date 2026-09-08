import { NextRequest, NextResponse } from 'next/server'
import { and, desc, ilike, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { media } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, paginationFrom, metaFor, newId } from '../_lib'

/**
 * Documents are the `media` table: a file record with an R2 object key. The upload
 * itself goes through POST /api/v2/documents/presign; a record created here exists
 * before its object until the upload completes.
 */
export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'documents:read')) return errorJson('Missing permission: documents:read', 403)
  return handle(async () => {
    const { page, limit, offset } = paginationFrom(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const filters: Array<any> = []
    if (search) filters.push(ilike(media.file_name, `%${search}%`))
    const where = filters.length ? and(...filters) : undefined

    const [rows, totals] = await Promise.all([
      db.select().from(media).where(where).orderBy(desc(media.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(media).where(where),
    ])

    return json(rows.map((row) => ({
      id: row.id,
      name: row.file_name,
      storageKey: row.r2_key,
      mimeType: row.mime_type,
      size: row.file_size_bytes,
      width: row.width,
      height: row.height,
      altText: row.alt_text,
      folderId: row.folder_id,
      uploadedBy: row.uploaded_by,
      createdAt: row.created_at,
    })), 200, metaFor(page, limit, totals[0]?.count ?? 0))
  })
})

export const POST = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'documents:write')) return errorJson('Missing permission: documents:write', 403)
  return handle(async () => {
    const body = await request.json()
    const { name, mimeType, size, folderId, altText } = body ?? {}

    if (!name?.trim()) return errorJson('Document name is required', 400)
    if (!mimeType?.trim()) return errorJson('mimeType is required', 400)

    const storageKey = `docs/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}/${String(name).replace(/[^\w.\-]+/g, '_')}`.slice(0, 500)

    const created = await db
      .insert(media)
      .values({
        id: newId(),
        file_name: String(name).trim().slice(0, 255),
        r2_key: storageKey,
        mime_type: String(mimeType).slice(0, 100),
        file_size_bytes: Number.isFinite(Number(size)) ? Number(size) : 0,
        folder_id: folderId ? String(folderId) : null,
        alt_text: altText ? String(altText) : null,
        uploaded_by: key.id,
      })
      .returning()

    const row = created[0]
    return json({
      id: row.id,
      name: row.file_name,
      storageKey: row.r2_key,
      mimeType: row.mime_type,
      size: row.file_size_bytes,
      uploadedBy: row.uploaded_by,
      createdAt: row.created_at,
    }, 201)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
