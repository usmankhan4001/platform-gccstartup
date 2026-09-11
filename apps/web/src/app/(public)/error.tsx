'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Public portal route error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'var(--surface-alt, #F8FAFC)',
    }}>
      <div style={{
        maxWidth: 480,
        width: '100%',
        padding: '36px 32px',
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid var(--border, #E2E8F0)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#EF4444',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <AlertCircle size={26} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy-900, #0A192F)', margin: '0 0 8px 0' }}>
          Unable to Load Content
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted, #64748B)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          We encountered an issue fetching this information. Please verify your connection or try again.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              background: 'var(--primary, #0F4C81)',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <Link
            href="/"
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              background: 'var(--surface-alt, #F1F5F9)',
              color: 'var(--text-primary, #334155)',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Home size={16} />
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
