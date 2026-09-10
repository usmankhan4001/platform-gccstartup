'use client'

import { useRouter } from 'next/navigation'

// Served by the service worker when a navigation fails, so it must render
// without any network access: no fonts, no images, no data fetches.
export default function OfflinePage() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0A142F] px-6 text-center text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
        GCC Startup
      </p>

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        You&apos;re offline
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
        We can&apos;t reach the network right now. Everything already synced to this device is
        still available — your last saved contacts, deals, and conversations are here to read.
      </p>

      <button
        type="button"
        onClick={() => router.refresh()}
        className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0A142F] transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Retry
      </button>

      <p className="mt-4 text-xs text-white/40">
        New changes will sync once you reconnect.
      </p>
    </main>
  )
}
