import { NextRequest, NextResponse } from 'next/server'
import { authGuard, AuthError } from '@/lib/auth'
import { enqueueBroadcast } from '@/lib/email/send'
import { emailDirectus } from '@/lib/email/client'

export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
    const body = await request.json().catch(() => ({}))
    const campaignId = typeof body?.campaignId === 'string' ? body.campaignId : ''
    const deliverAt = typeof body?.deliverAt === 'string' && !Number.isNaN(Date.parse(body.deliverAt)) ? new Date(body.deliverAt) : undefined

    if (!campaignId) return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })

    const result = await enqueueBroadcast(emailDirectus(), campaignId, deliverAt ? { deliverAt } : {})
    if (!result.ok) return NextResponse.json({ error: result.error ?? 'Dispatch failed' }, { status: 409 })

    return NextResponse.json({ data: result }, { status: 202 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/campaigns/dispatch] failed', error)
    return NextResponse.json({ error: 'Failed to dispatch campaign' }, { status: 500 })
  }
}
