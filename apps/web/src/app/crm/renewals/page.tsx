import { RenewalLedger } from '@/components/crm/RenewalLedger'
import { loadRenewalLedgerData } from '@/components/crm/server-data'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Annual Renewal & Compliance Ledger | GCC Startup Platform',
  description: 'Track trade licenses, visa expirations, corporate tax filing deadlines, and automated renewal triggers.',
}

export default async function RenewalsPage() {
  const data = await loadRenewalLedgerData()

  return (
    <div className="space-y-5">
      <header className="border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-black tracking-tight text-[var(--text)]">
          Annual renewal &amp; compliance ledger
        </h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Trade license, visa and Emirates ID, corporate tax and UBO deadlines with live countdowns and a
          60/30/7-day reminder ladder.
        </p>
      </header>

      <RenewalLedger rows={data.rows} stats={data.stats} forecast={data.forecast} error={data.error} />
    </div>
  )
}
