import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { email_campaigns } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson, type RouteContext } from '../../../_lib'
import { enqueueBroadcast } from '@/lib/email/send'
import { emailDirectus } from '@/lib/email/client'

type Ctx = { params: Promise<{ id: string }> }

export const POST = requireApiKey(async (request: NextRequest, context: Ctx, key: any) => {
  if (!hasPermission(key, 'campaigns:write')) return errorJson('Missing permission: campaigns:write', 403)
  return handle(async () => {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const deliverAt =
      typeof body?.deliverAt === 'string' && !Number.isNaN(Date.parse(body.deliverAt)) ? new Date(body.deliverAt) : undefined

    const existing = await db.select({ status: email_campaigns.status }).from(email_campaigns).where(eq(email_campaigns.id, id)).limit(1)
    if (!existing[0]) return errorJson('Campaign not found', 404)
    if (['sent', 'cancelled'].includes(existing[0].status)) {
      return errorJson(`Campaign already ${existing[0].status}`, 400)
    }

    const result = await enqueueBroadcast(emailDirectus(), id, deliverAt ? { deliverAt } : {})
    if (!result.ok) return errorJson(result.error ?? 'Dispatch failed', 409)

    return json({
      campaignId: result.campaignId,
      status: 'dispatching',
      totalRecipients: result.recipientCount,
      blocked: result.blocked,
      truncated: result.truncated,
      queuedAt: new Date().toISOString(),
    }, 202)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
