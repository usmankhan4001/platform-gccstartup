// Sends a test WhatsApp template message via the fail-safe Meta client and
// records the attempt as a `send_whatsapp` outbox job for auditability.
// When the Meta env vars are unset the client no-ops and the endpoint reports
// success:false with a clear reason instead of pretending the send happened.
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { message_templates, outbox_jobs } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'
import { sendWhatsappTemplateWithMeta } from '@/lib/whatsapp/client'

export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const body = await request.json()
    const { to, templateName, languageCode, headerMediaUrl, bodyVariables } = body as {
      to?: string
      templateName?: string
      languageCode?: string
      headerMediaUrl?: string
      bodyVariables?: string[]
    }

    if (!to || !templateName) {
      return NextResponse.json(
        { error: 'Recipient phone number and template name are required' },
        { status: 400 }
      )
    }

    // Fall back to the stored template's variable count when no explicit
    // variables were supplied, so callers can test a template without knowing
    // its placeholder arity.
    let variables = Array.isArray(bodyVariables) ? bodyVariables : undefined
    if (!variables) {
      const rows = await db
        .select({ placeholder_count: message_templates.placeholder_count })
        .from(message_templates)
        .where(eq(message_templates.name, templateName))
        .limit(1)
      const count = rows[0]?.placeholder_count ?? 0
      if (count > 0) variables = Array.from({ length: count }, () => 'Test')
    }

    const result = await sendWhatsappTemplateWithMeta(to, templateName, languageCode || 'en', {
      headerMediaUrl,
      bodyVariables: variables,
    })

    const metaConfigured =
      !!process.env.META_WHATSAPP_ACCESS_TOKEN && !!process.env.META_WHATSAPP_PHONE_NUMBER_ID

    // Audit the attempt in the durable outbox regardless of outcome
    await db.insert(outbox_jobs).values({
      id: randomUUID(),
      job_type: 'send_whatsapp',
      payload: {
        kind: 'template_test',
        to,
        templateName,
        languageCode: languageCode || 'en',
        wamid: result?.wamid ?? null,
      },
      status: result ? 'sent' : 'failed',
      attempts: 1,
      last_error: result ? null : metaConfigured ? 'Meta API rejected the send' : 'Meta WhatsApp env not configured',
      next_run_at: new Date(),
      completed_at: new Date(),
      idempotency_key: `template_test:${randomUUID()}`,
    })

    if (!result) {
      return NextResponse.json({
        success: false,
        error: metaConfigured
          ? 'Meta Cloud API rejected the test send'
          : 'META_WHATSAPP_ACCESS_TOKEN / META_WHATSAPP_PHONE_NUMBER_ID not configured — send skipped',
      })
    }

    return NextResponse.json({
      success: true,
      result: { id: result.wamid },
      message: `Test template message successfully dispatched to ${to}`,
    })
  } catch (error) {
    console.error('Error sending test template', error)
    return NextResponse.json({ success: false, error: 'Test template send failed' }, { status: 500 })
  }
}
