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
    <div className="space-y-5">
      <header className="border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-black tracking-tight text-[var(--text)]">Deals</h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          The same board as the CRM home - Kanban for stage movement, table for bulk edits.
        </p>
      </header>

      <DealsPipeline
        initialCards={data.cards}
        owners={data.owners}
        kpis={data.kpis}
        loadError={data.error}
      />
    </div>
  )
}
