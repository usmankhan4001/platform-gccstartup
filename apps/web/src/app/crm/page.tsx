import { DealsPipeline } from '@/components/crm/DealsPipeline'
import { loadPipelineBoardData } from '@/components/crm/server-data'

// The board reads live pipeline tables, so it must never be baked at build time.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Deals Pipeline | GCC Startup Platform',
  description: 'Formation pipeline from new lead to banking filed, with weighted forecast and lead scoring.',
}

export default async function CrmPage() {
  const data = await loadPipelineBoardData()

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Deals Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time formation deals, stage progression, weighted revenue forecast, and lead scoring.
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
