import { NextRequest, NextResponse } from 'next/server'
import { authGuard, AuthError } from '@/lib/auth'

export type SesConfigResponse = {
  configured: boolean
  region: string | null
  fromEmail: string | null
  fromName: string | null
  missing: string[]
}

/**
 * Reports whether the SES transport can actually send. The UI uses this to swap
 * "SES Dedicated IP Pool Active" badges for an honest "not configured" state
 * instead of pretending mail went out (invariant 4: unset env = no-op).
 */
export async function GET(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'manager'])

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim()
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim()
    const region = process.env.AWS_REGION?.trim() || null
    const fromEmail =
      process.env.EMAIL_FROM_ADDRESS?.trim() || process.env.SENDER_TRANSACTIONAL_FROM_EMAIL?.trim() || null
    const fromName =
      process.env.EMAIL_FROM_NAME?.trim() ||
      process.env.SENDER_TRANSACTIONAL_FROM_NAME?.trim() ||
      process.env.SENDER_CAMPAIGN_FROM_NAME?.trim() ||
      null

    const missing: string[] = []
    if (!accessKeyId) missing.push('AWS_ACCESS_KEY_ID')
    if (!secretAccessKey) missing.push('AWS_SECRET_ACCESS_KEY')
    if (!region) missing.push('AWS_REGION')

    const payload: SesConfigResponse = {
      configured: missing.length === 0 && Boolean(fromEmail),
      region,
      fromEmail,
      fromName,
      missing: fromEmail ? missing : [...missing, 'EMAIL_FROM_ADDRESS'],
    }

    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/config] failed', error)
    return NextResponse.json({ error: 'Failed to read email configuration' }, { status: 500 })
  }
}
