import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { flows } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const publish = body?.publish !== false

    const existing = await db.select().from(flows).where(eq(flows.id, id)).limit(1)
    if (!existing[0]) return NextResponse.json({ error: 'Flow not found' }, { status: 404 })

    if (publish) {
      // A flow with no canvas nodes cannot run; refuse to activate it rather than
      // enrolling contacts into a flow that does nothing.
      const nodes = Array.isArray(existing[0].nodes) ? existing[0].nodes : []
      if (!nodes.length) return NextResponse.json({ error: 'Flow has no canvas nodes to publish' }, { status: 400 })
    }

    const nextStatus = publish ? 'active' : 'draft'
    const updated = await db
      .update(flows)
      .set({ status: nextStatus, updated_at: new Date(), ...(publish ? { version: existing[0].version + 1 } : {}) })
      .where(eq(flows.id, id))
      .returning()

    return NextResponse.json({ success: true, status: nextStatus, flow: updated[0] })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/flows/id/publish] failed', error)
    return NextResponse.json({ error: 'Failed to update flow publish state' }, { status: 500 })
  }
}
