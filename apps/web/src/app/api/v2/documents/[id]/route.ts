import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { media } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, type RouteContext } from '../../_lib'

export const GET = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'documents:read')) return errorJson('Missing permission: documents:read', 403)
  return handle(async () => {
    const { id } = await context.params
    const rows = await db.select().from(media).where(eq(media.id, id)).limit(1)
    if (!rows[0]) return errorJson('Document not found', 404)
    const row = rows[0]
    return json({
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
    })
  })
})

export const DELETE = requireApiKey(async (request: NextRequest, context: RouteContext, key: any) => {
  if (!hasPermission(key, 'documents:write')) return errorJson('Missing permission: documents:write', 403)
  return handle(async () => {
    const { id } = await context.params
    // Deletes the record only. The R2 object is removed by the storage GC job;
    // removing blobs inline would make an accidental DELETE unrecoverable.
    const deleted = await db.delete(media).where(eq(media.id, id)).returning({ id: media.id })
    if (!deleted.length) return errorJson('Document not found', 404)
    return json({ deleted: true, id })
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
