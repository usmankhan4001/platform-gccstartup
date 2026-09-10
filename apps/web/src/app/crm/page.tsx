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
    <div className="space-y-5">
      <header className="border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-black tracking-tight text-[var(--text)]">Deals pipeline</h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Drag a card between stages to persist the change. Switch to the table view for bulk actions and sorting.
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
