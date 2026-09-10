import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSuppressionByEmail } from '@/lib/email/client'
import { renderEmail, type EmailDocument } from '@/lib/email/render'
import { authGuard, AuthError } from '@/lib/auth'
import { createSESProvider } from '@gccstartup/shared'

type TestSendResponse = {
  ok: boolean
  reason?: 'not_configured' | 'suppressed' | 'send_failed'
  missing?: string[]
  messageId?: string
  error?: string
}

function envMissing(): string[] {
  const missing: string[] = []
  if (!process.env.AWS_ACCESS_KEY_ID?.trim()) missing.push('AWS_ACCESS_KEY_ID')
  if (!process.env.AWS_SECRET_ACCESS_KEY?.trim()) missing.push('AWS_SECRET_ACCESS_KEY')
  if (!process.env.AWS_REGION?.trim()) missing.push('AWS_REGION')
  if (!process.env.EMAIL_FROM_ADDRESS?.trim() && !process.env.SENDER_TRANSACTIONAL_FROM_EMAIL?.trim()) {
    missing.push('EMAIL_FROM_ADDRESS')
  }
  return missing
}

/**
 * Renders the builder's active document exactly as a real send would
 * (`renderEmail`) and dispatches one transactional email through the SES v2
 * client. A test send never touches `email_sends` (campaign_id is NOT NULL and a
 * test is not a campaign) and never enqueues — if SES is unconfigured the route
 * reports `not_configured` with the missing env vars instead of pretending
 * success. Suppressed addresses are refused: the do-not-mail list is not
 * advisory (invariant 6).
 */
export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'manager'])
    const body = await request.json().catch(() => null)

    const to = typeof body?.to === 'string' ? body.to.trim().toLowerCase() : ''
    if (!to || !to.includes('@')) {
      return NextResponse.json({ ok: false, error: 'A valid recipient email is required' }, { status: 400 })
    }

    const suppression = await getSuppressionByEmail(to).catch(() => null)
    if (suppression) {
      return NextResponse.json({ ok: false, reason: 'suppressed', error: `${to} is on the suppression list` }, { status: 409 })
    }

    const provider = createSESProvider()
    if (!provider) {
      const missing = envMissing()
      console.warn('[api/email/test-send] SES not configured, missing:', missing.join(', '))
      return NextResponse.json({ ok: false, reason: 'not_configured', missing } satisfies TestSendResponse)
    }

    // renderEmail never throws and accepts any blocks shape — a half-edited
    // document renders as best it can rather than failing the request.
    const document = (body?.document ?? null) as EmailDocument | null
    if (!document || !Array.isArray(document.content)) {
      return NextResponse.json({ ok: false, error: 'A rendered document is required' }, { status: 400 })
    }

    const rootSubject = document.root?.props?.subject
    const subject = (typeof body?.subject === 'string' && body.subject.trim()) || (typeof rootSubject === 'string' && rootSubject.trim()) || 'GCC Startup — test email'
    const fromEmail = process.env.EMAIL_FROM_ADDRESS?.trim() || process.env.SENDER_TRANSACTIONAL_FROM_EMAIL?.trim() || 'info@gccstartup.com'
    const fromName = process.env.EMAIL_FROM_NAME?.trim() || process.env.SENDER_TRANSACTIONAL_FROM_NAME?.trim() || 'GCC Startup'

    const rendered = renderEmail(document, {
      brandName: fromName,
      variables: {
        first_name: 'Tariq',
        firstname: 'Tariq',
        name: 'Tariq Al-Mansoor',
        email: to,
      },
    })

    const result = await provider.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html: rendered.html,
      text: rendered.text,
      tags: { category: 'test' },
    })

    return NextResponse.json({ ok: true, messageId: result.id } satisfies TestSendResponse)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/email/test-send] send failed', error)
    return NextResponse.json(
      { ok: false, reason: 'send_failed', error: error instanceof Error ? error.message : 'Send failed' } satisfies TestSendResponse,
      { status: 502 },
    )
  }
}
