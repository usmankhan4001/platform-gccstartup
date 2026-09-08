import { NextRequest, NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { deals, pipeline_stages, pipelines } from '@gccstartup/db'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, json, errorJson } from '../../_lib'

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'analytics:read')) return errorJson('Missing permission: analytics:read', 403)
  return handle(async () => {
    try {
      const pipelineIdParam = new URL(request.url).searchParams.get('pipelineId')

      const stageRows = await db
        .select({
          stageId: pipeline_stages.id,
          stageName: pipeline_stages.name,
          kind: pipeline_stages.kind,
          probability: pipeline_stages.probability,
          pipelineId: pipelines.id,
          pipelineName: pipelines.name,
          currency: pipelines.default_currency,
          dealCount: sql<number>`count(${deals.id})::int`,
          totalValue: sql<number>`coalesce(sum(${deals.value}), 0)::bigint`,
        })
        .from(pipeline_stages)
        .innerJoin(pipelines, eq(pipeline_stages.pipeline_id, pipelines.id))
        .leftJoin(deals, eq(deals.stage_id, pipeline_stages.id))
        .where(pipelineIdParam ? eq(pipelines.id, pipelineIdParam) : undefined)
        .groupBy(pipeline_stages.id, pipeline_stages.name, pipeline_stages.kind, pipeline_stages.probability, pipelines.id, pipelines.name, pipelines.default_currency)
        .orderBy(pipelines.name, pipeline_stages.position)

      let totalDeals = 0
      let totalValue = 0
      let weightedValue = 0
      const stages = stageRows.map((row) => {
        const value = Number(row.totalValue)
        const weighted = row.kind === 'open' ? Math.round((value * row.probability) / 100) : value
        totalDeals += row.dealCount
        totalValue += value
        weightedValue += weighted
        return {
          stageId: row.stageId,
          name: row.stageName,
          kind: row.kind,
          pipeline: row.pipelineName,
          count: row.dealCount,
          value,
          weightedValue: weighted,
          currency: row.currency,
        }
      })

      return json({
        stages,
        summary: {
          totalDeals,
          totalValue,
          weightedValue,
          averageDealSize: totalDeals > 0 ? Math.round(totalValue / totalDeals) : 0,
        },
      })
    } catch (error) {
      console.error('[api/v2/analytics/pipeline] query failed', error)
      return json({ stages: [], summary: { totalDeals: 0, totalValue: 0, weightedValue: 0, averageDealSize: 0 } })
    }
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
