// Syncs WhatsApp message templates from the Meta Cloud API into
// `message_templates` (upsert on the unique (name, language) pair).
// Requires META_WHATSAPP_ACCESS_TOKEN + META_WHATSAPP_WABA_ID; when either is
// unset the sync is a graceful no-op returning syncedCount 0.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { message_templates } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

interface MetaTemplate {
  id?: string
  name?: string
  language?: string
  status?: string
  category?: string
  components?: Array<{ type?: string; text?: string }>
  rejected_reason?: string
}

const STATUS_MAP: Record<string, 'draft' | 'pending' | 'approved' | 'rejected' | 'disabled'> = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
  PAUSED: 'disabled',
  DISABLED: 'disabled',
}

function placeholderCount(components: MetaTemplate['components']): number {
  const body = components?.find((c) => (c.type || '').toUpperCase() === 'BODY')
  const matches = body?.text?.match(/\{\{\d+\}\}/g)
  return matches ? matches.length : 0
}

export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  const token = process.env.META_WHATSAPP_ACCESS_TOKEN
  const wabaId = process.env.META_WHATSAPP_WABA_ID

  if (!token || !wabaId) {
    return NextResponse.json({
      success: true,
      syncedCount: 0,
      message:
        'META_WHATSAPP_ACCESS_TOKEN / META_WHATSAPP_WABA_ID not configured — nothing to sync.',
    })
  }

  try {
    const version = process.env.META_WHATSAPP_GRAPH_VERSION ?? 'v20.0'
    const res = await fetch(
      `https://graph.facebook.com/${version}/${wabaId}/message_templates?limit=200`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) {
      const detail = await res.text().catch(() => null)
      console.error(`[templates/sync] Meta fetch failed ${res.status}${detail ? `: ${detail.slice(0, 500)}` : ''}`)
      return NextResponse.json({ success: false, error: 'Meta template fetch failed' }, { status: 502 })
    }

    const json = (await res.json().catch(() => null)) as { data?: MetaTemplate[] } | null
    const metaTemplates = json?.data ?? []

    let syncedCount = 0
    for (const tpl of metaTemplates) {
      if (!tpl.name || !tpl.language) continue

      const bodyComponent = tpl.components?.find((c) => (c.type || '').toUpperCase() === 'BODY')
      if (!bodyComponent?.text) continue

      const status = STATUS_MAP[(tpl.status || '').toUpperCase()] ?? 'pending'
      const category = (tpl.category || 'utility').toLowerCase() as
        | 'marketing'
        | 'utility'
        | 'authentication'

      await db
        .insert(message_templates)
        .values({
          id: crypto.randomUUID(),
          name: tpl.name,
          language: tpl.language,
          body: bodyComponent.text,
          header: tpl.components?.find((c) => (c.type || '').toUpperCase() === 'HEADER')?.text ?? null,
          footer: tpl.components?.find((c) => (c.type || '').toUpperCase() === 'FOOTER')?.text ?? null,
          placeholder_count: placeholderCount(tpl.components),
          category,
          status,
          provider_template_id: tpl.id ?? null,
          approved_at: status === 'approved' ? new Date() : null,
          rejection_reason: tpl.rejected_reason ?? null,
        })
        .onConflictDoUpdate({
          target: [message_templates.name, message_templates.language],
          set: {
            body: bodyComponent.text,
            status,
            category,
            provider_template_id: tpl.id ?? null,
            approved_at: status === 'approved' ? new Date() : null,
            rejection_reason: tpl.rejected_reason ?? null,
            updated_at: new Date(),
          },
        })
      syncedCount++
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      message: `Successfully synchronized ${syncedCount} templates from Meta WhatsApp Cloud.`,
    })
  } catch (error) {
    console.error('Error syncing templates', error)
    return NextResponse.json({ success: false, error: 'Template sync failed' }, { status: 500 })
  }
}
