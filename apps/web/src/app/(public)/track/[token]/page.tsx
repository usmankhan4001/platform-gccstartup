import type { Metadata } from 'next'
import { TrackingClient } from './TrackingClient'

export const metadata: Metadata = {
  title: 'Live Company Formation Status Tracker | GCC Startup',
  description: 'Track your official company formation progress, e-registry filing status, banking application milestones, and download official incorporation certificates.',
}

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  return (
    <main style={{ minHeight: '85vh', background: 'var(--surface-alt, #F8FAFC)', paddingBottom: 60 }}>
      <TrackingClient token={token} />
    </main>
  )
}
