import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { and, eq, isNull, or, sql } from 'drizzle-orm'
import { authGuard, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { contacts } from '@gccstartup/db'

const MAX_ROWS = 5000

/** Canonical contact fields plus every legacy header name the import wizard emits. */
const FIELD_ALIASES: Record<string, string> = {
  phonenumber: 'phone',
  phone: 'phone',
  mobile: 'phone',
  whatsapp: 'phone',
  email: 'email',
  emailaddress: 'email',
  firstname: 'first_name',
  first_name: 'first_name',
  lastname: 'last_name',
  last_name: 'last_name',
  name: 'display_name',
  fullname: 'display_name',
  company: 'company',
  organisation: 'company',
  organization: 'company',
  jobtitle: 'job_title',
  job_title: 'job_title',
  title: 'job_title',
  source: 'source',
  tags: 'tags',
}

function fieldKey(value: string): string | null {
  return FIELD_ALIASES[value.trim().toLowerCase()] || null
}

function extractValue(row: Record<string, unknown> | unknown[], key: string): unknown {
  if (Array.isArray(row)) {
    const index = Number(key)
    return Number.isInteger(index) ? row[index] : undefined
  }
  return row[key]
}

function cellToString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return null
}

type ContactDraft = {
  phone: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  company: string | null
  job_title: string | null
  source: string | null
  tags: string[]
}

function buildDraft(raw: Record<string, unknown> | unknown[], mapping: Record<string, string>, defaultTags: string[]): ContactDraft | null {
  const draft: ContactDraft = {
    phone: null,
    email: null,
    first_name: null,
    last_name: null,
    display_name: null,
    company: null,
    job_title: null,
    source: null,
    tags: [...defaultTags],
  }

  for (const [sourceKey, rawTarget] of Object.entries(mapping)) {
    const target = fieldKey(String(rawTarget))
    if (!target) continue
    const value = extractValue(raw, sourceKey)
    if (target === 'tags') {
      const tagText = cellToString(value)
      if (tagText) {
        for (const tag of tagText.split(/[,;|]/).map((t) => t.trim()).filter(Boolean)) {
          if (!draft.tags.includes(tag)) draft.tags.push(tag)
        }
      }
      continue
    }
    const text = cellToString(value)
    if (!text) continue
    if (target === 'email') draft.email = text.toLowerCase()
    else if (target === 'phone') draft.phone = text
    else if (target === 'first_name') draft.first_name = text.slice(0, 100)
    else if (target === 'last_name') draft.last_name = text.slice(0, 100)
    else if (target === 'display_name') draft.display_name = text.slice(0, 200)
    else if (target === 'company') draft.company = text.slice(0, 200)
    else if (target === 'job_title') draft.job_title = text.slice(0, 200)
    else if (target === 'source') draft.source = text.slice(0, 100)
  }

  // Rows without either unique key cannot be deduped — skip them rather than
  // creating unmatchable duplicates on every re-import.
  if (!draft.phone && !draft.email) return null
  return draft
}

export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['staff'])
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const rows = body.rows
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No data rows provided for import' }, { status: 400 })
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ error: `Import is capped at ${MAX_ROWS} rows per request` }, { status: 400 })
    }

    const mapping = (body.columnMapping && typeof body.columnMapping === 'object' && !Array.isArray(body.columnMapping)
      ? body.columnMapping
      : {}) as Record<string, string>

    // Groups and tags are the same membership mechanism in this schema
    // (contacts.tags jsonb), so both import targets land there.
    const defaultTags: string[] = []
    for (const key of ['targetTagId', 'targetGroupId']) {
      const tag = body[key]
      if (typeof tag === 'string' && tag.trim() && !defaultTags.includes(tag.trim())) {
        defaultTags.push(tag.trim())
      }
    }

    let created = 0
    let updated = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i]
      if (!raw || (typeof raw !== 'object' && !Array.isArray(raw))) {
        errors.push(`Row ${i + 1}: not an object`)
        continue
      }
      const draft = buildDraft(raw as Record<string, unknown> | unknown[], mapping, defaultTags)
      if (!draft) {
        errors.push(`Row ${i + 1}: missing both phone and email — skipped`)
        continue
      }

      try {
        const matchCondition = draft.phone
          ? or(eq(contacts.phone, draft.phone), draft.email ? eq(contacts.email, draft.email) : undefined)
          : eq(contacts.email, draft.email as string)

        const existing = await db
          .select({ id: contacts.id, tags: contacts.tags })
          .from(contacts)
          .where(and(matchCondition, isNull(contacts.deleted_at)))
          .limit(1)

        if (existing[0]) {
          const mergedTags = [...new Set([...(existing[0].tags || []), ...draft.tags])]
          await db
            .update(contacts)
            .set({
              phone: draft.phone,
              email: draft.email,
              first_name: draft.first_name,
              last_name: draft.last_name,
              display_name: draft.display_name,
              company: draft.company,
              job_title: draft.job_title,
              tags: mergedTags,
              updated_at: new Date(),
            })
            .where(eq(contacts.id, existing[0].id))
          updated++
        } else {
          await db.insert(contacts).values({
            id: randomUUID(),
            phone: draft.phone,
            email: draft.email,
            first_name: draft.first_name,
            last_name: draft.last_name,
            display_name:
              draft.display_name || [draft.first_name, draft.last_name].filter(Boolean).join(' ') || null,
            company: draft.company,
            job_title: draft.job_title,
            source: draft.source || 'import',
            tags: draft.tags,
            custom_fields: sql`'{}'::jsonb`,
          })
          created++
        }
      } catch (rowError) {
        console.error(`[contacts/import] row ${i + 1} failed`, rowError)
        errors.push(`Row ${i + 1}: database error`)
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: created + updated,
      createdCount: created,
      updatedCount: updated,
      skippedCount: errors.length,
      errors,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[contacts/import] failed', error)
    return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 })
  }
}
