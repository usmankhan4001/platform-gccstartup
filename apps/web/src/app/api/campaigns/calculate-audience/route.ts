import { NextRequest, NextResponse } from 'next/server'
import { and, eq, isNotNull, isNull, notExists, or, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts, email_suppressions } from '@gccstartup/db'

type AudienceFilter = {
  sendToAll?: boolean
  includeGroups?: string[]
  includeTags?: string[]
  excludeGroups?: string[]
  excludeTags?: string[]
}

function parseAudienceFilter(value: unknown): AudienceFilter {
  let candidate = value
  if (typeof candidate === 'string') {
    try {
      candidate = JSON.parse(candidate || '{}')
    } catch {
      candidate = {}
    }
  }
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return {}
  const raw = candidate as Record<string, unknown>
  const toStringArray = (input: unknown): string[] | undefined =>
    Array.isArray(input) ? input.filter((t): t is string => typeof t === 'string' && t.trim() !== '') : undefined
  return {
    sendToAll: raw.sendToAll === true,
    includeGroups: toStringArray(raw.includeGroups),
    includeTags: toStringArray(raw.includeTags),
    excludeGroups: toStringArray(raw.excludeGroups),
    excludeTags: toStringArray(raw.excludeTags),
  }
}

export async function POST(request: NextRequest) {
  try {
    await authGuard(request)
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const filter = parseAudienceFilter(body.audienceFilter)
    const include = [...new Set([...(filter.includeGroups || []), ...(filter.includeTags || [])])]
    const exclude = [...new Set([...(filter.excludeGroups || []), ...(filter.excludeTags || [])])]

    const conditions = [
      isNull(contacts.deleted_at),
      isNotNull(contacts.email),
      eq(contacts.email_consent, 'granted'),
      isNull(contacts.unsubscribed_at),
      notExists(
        db
          .select({ one: sql`1` })
          .from(email_suppressions)
          .where(eq(email_suppressions.email, contacts.email)),
      ),
    ]
    if (include.length) {
      const includeExpr = or(...include.map((tag) => sql`${contacts.tags} @> ${JSON.stringify(tag)}::jsonb`))
      if (includeExpr) conditions.push(includeExpr)
    }
    for (const tag of exclude) {
      conditions.push(sql`NOT (${contacts.tags} @> ${JSON.stringify(tag)}::jsonb)`)
    }

    const audience = await db
      .select({
        id: contacts.id,
        firstName: contacts.first_name,
        lastName: contacts.last_name,
        phone: contacts.phone,
        email: contacts.email,
      })
      .from(contacts)
      .where(and(...conditions))
      .limit(5000)

    const sampleContacts = audience.slice(0, 5).map((c) => ({
      id: c.id,
      name: [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Customer',
      phone: c.phone,
      email: c.email,
    }))

    return NextResponse.json({ count: audience.length, sampleContacts })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[campaigns/calculate-audience] failed', error)
    return NextResponse.json({ error: 'Failed to calculate audience' }, { status: 500 })
  }
}
