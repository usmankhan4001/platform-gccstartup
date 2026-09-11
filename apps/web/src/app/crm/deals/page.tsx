import { DealsPipeline } from '@/components/crm/DealsPipeline'
import { loadPipelineBoardData } from '@/components/crm/server-data'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Deals | GCC Startup Platform',
  description: 'Every formation deal across the eight-stage GCC pipeline, with forecast and win-rate KPIs.',
}

export default async function DealsPage() {
  const data = await loadPipelineBoardData()

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Deals Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every formation deal across the 8-stage GCC pipeline, with forecast and win-rate KPIs.
          </p>
        </div>
      </div>

      <DealsPipeline
        initialCards={data.cards}
        owners={data.owners}
        kpis={data.kpis}
        loadError={data.error}
      />
    </div>
  )
}
