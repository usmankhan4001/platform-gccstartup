import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ApplicationClient } from './ApplicationClient'

export const metadata: Metadata = {
  title: 'Active Application & Preliminary Documents | GCC Startup',
  description: 'Submit your company name choices and upload compliance materials to initiate official registration.',
}

export default function ApplicationPage() {
  return (
    <div style={{ minHeight: '85vh', background: 'var(--surface-alt, #F8FAFC)', paddingBottom: 60 }}>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: 60 }}>Loading your application...</div>}>
        <ApplicationClient />
      </Suspense>
    </div>
  )
}
