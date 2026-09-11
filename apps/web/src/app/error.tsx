'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled platform error:', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#F8FAFC', color: '#0F172A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 500, margin: '24px', padding: '40px', background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <AlertTriangle size={28} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px 0', color: '#0A192F' }}>
            An Unexpected Error Occurred
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            We encountered a temporary technical glitch while loading this module. Our operations team has been notified.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 8,
                background: '#0F4C81',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 8,
                background: '#F1F5F9',
                color: '#334155',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Home size={16} />
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
