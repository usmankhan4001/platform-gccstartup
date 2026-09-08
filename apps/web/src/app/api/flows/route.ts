import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { flows } from '@gccstartup/db'
import { authGuard, AuthError } from '@/lib/auth'

type FlowNode = { id: string; type?: string; data?: Record<string, unknown>; position?: { x: number; y: number } }
type FlowEdge = { id: string; source: string; target: string; sourceHandle?: string | null }

/** The canvas may post nodes/edges as arrays or as JSON strings; accept both. */
function parseCanvas(value: unknown, fallback: unknown[]): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : fallback
    } catch {
      return fallback
    }
  }
  return fallback
}

function defaultNodes(): FlowNode[] {
  return [
    { id: 'start_1', type: 'trigger', data: { label: 'Start Flow', type: 'ANY_INBOUND' }, position: { x: 250, y: 50 } },
    { id: 'msg_1', type: 'message', data: { label: 'Welcome Message', text: 'Hello {{firstName}}! How can we help you today?' }, position: { x: 250, y: 180 } },
  ]
}

export async function GET(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin'])
    const rows = await db.select().from(flows).orderBy(desc(flows.updated_at)).limit(200)
    return NextResponse.json(rows)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/flows] list failed', error)
    return NextResponse.json({ error: 'Failed to retrieve flows' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authGuard(request, ['admin', 'super_admin'])
    const body = await request.json()
    const { name, description, nodes, edges, nodesJson, edgesJson, triggerType, triggerConfig } = body ?? {}

    if (!name?.trim()) return NextResponse.json({ error: 'Flow name is required' }, { status: 400 })

    const initialNodes = parseCanvas(nodes ?? nodesJson, defaultNodes())
    const initialEdges = parseCanvas(edges ?? edgesJson, [
      { id: 'e1', source: (initialNodes[0] as FlowNode)?.id ?? 'start_1', target: (initialNodes[1] as FlowNode)?.id ?? 'msg_1' },
    ])

    const created = await db
      .insert(flows)
      .values({
        id: randomUUID(),
        name: String(name).trim().slice(0, 200),
        description: description ? String(description) : null,
        status: 'draft',
        trigger_type: ['manual', 'lead_created', 'form_submitted', 'tag_added', 'deal_stage_changed', 'date_based', 'event_based'].includes(triggerType)
          ? triggerType
          : 'manual',
        trigger_config: triggerConfig && typeof triggerConfig === 'object' ? triggerConfig : {},
        nodes: initialNodes,
        edges: initialEdges,
        created_by: user.id,
      })
      .returning()

    return NextResponse.json({ success: true, flow: created[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('[api/flows] create failed', error)
    return NextResponse.json({ error: 'Failed to create flow' }, { status: 500 })
  }
}
