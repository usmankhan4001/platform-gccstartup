// WhatsApp message templates CRUD over `message_templates`. Meta Cloud API
// creation is optional infrastructure: when META_WHATSAPP_ACCESS_TOKEN and
// META_WHATSAPP_WABA_ID are set the template is also registered on Meta and the
// provider id stored; otherwise the row is created locally with status
// 'pending' and can be synced later via POST /api/templates/sync.
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { message_templates } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

type BodyComponent = {
  type?: string
  text?: string
  format?: string
  buttons?: unknown[]
}

// Counts {{1}}-style positional placeholders in the BODY component text.
function countPlaceholders(components: BodyComponent[]): number {
  const body = components.find((c) => (c.type || '').toUpperCase() === 'BODY')
  const text = typeof body?.text === 'string' ? body.text : ''
  const matches = text.match(/\{\{\d+\}\}/g)
  return matches ? matches.length : 0
}

async function createOnMeta(
  cleanName: string,
  category: string,
  language: string,
  components: BodyComponent[]
): Promise<{ id: string } | null> {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN
  const wabaId = process.env.META_WHATSAPP_WABA_ID
  if (!token || !wabaId) return null

  const version = process.env.META_WHATSAPP_GRAPH_VERSION ?? 'v20.0'
  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${wabaId}/message_templates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanName, category: category.toUpperCase(), language, components }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => null)
      console.error(`[templates] Meta template create failed ${res.status}${detail ? `: ${detail.slice(0, 500)}` : ''}`)
      return null
    }
    const json = (await res.json().catch(() => null)) as { id?: string } | null
    return json?.id ? { id: json.id } : null
  } catch (error) {
    console.error('[templates] Meta template create threw', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const templates = await db
      .select()
      .from(message_templates)
      .orderBy(desc(message_templates.created_at))
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates', error)
    return NextResponse.json({ error: 'Failed to retrieve templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let user: { id: string }
  try {
    user = await authGuard(request, ['admin', 'super_admin'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const body = await request.json()
    const { name, category, language, components } = body as {
      name?: string
      category?: string
      language?: string
      components?: BodyComponent[]
    }

    const validCategories = ['marketing', 'utility', 'authentication']
    if (!name || !category || !language) {
      return NextResponse.json(
        { error: 'Template name, category, and language are required' },
        { status: 400 }
      )
    }
    if (!validCategories.includes(String(category).toLowerCase())) {
      return NextResponse.json(
        { error: `Category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }
    if (!Array.isArray(components) || components.length === 0) {
      return NextResponse.json({ error: 'At least one template component is required' }, { status: 400 })
    }

    const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    const bodyComponent = components.find((c) => (c.type || '').toUpperCase() === 'BODY')
    if (!bodyComponent?.text?.trim()) {
      return NextResponse.json({ error: 'A BODY component with text is required' }, { status: 400 })
    }

    // Optional Meta registration — a missing/failed Meta call never blocks the local row
    const metaResult = await createOnMeta(cleanName, category, language, components)

    const inserted = await db
      .insert(message_templates)
      .values({
        id: randomUUID(),
        name: cleanName,
        language,
        body: bodyComponent.text,
        header: components.find((c) => (c.type || '').toUpperCase() === 'HEADER')?.text ?? null,
        footer: components.find((c) => (c.type || '').toUpperCase() === 'FOOTER')?.text ?? null,
        placeholder_count: countPlaceholders(components),
        category: category.toLowerCase() as 'marketing' | 'utility' | 'authentication',
        status: 'pending',
        provider_template_id: metaResult?.id ?? null,
        created_by: user.id,
        updated_by: user.id,
      })
      .returning()

    return NextResponse.json({ success: true, template: inserted[0] })
  } catch (error) {
    console.error('Error creating template', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 400 })
  }
}
