'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Workspace Module Error:', error)
  }, [error])

  return (
    <div style={{
      padding: '40px 24px',
      margin: '24px auto',
      maxWidth: 600,
      background: '#FFFFFF',
      borderRadius: 12,
      border: '1px solid #FECACA',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      textAlign: 'center',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 10,
        background: '#FEE2E2',
        color: '#DC2626',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
      }}>
        <AlertTriangle size={24} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1E293B', margin: '0 0 8px 0' }}>
        Workspace View Encountered an Error
      </h3>
      <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: '0 0 20px 0' }}>
        Failed to render the requested workspace segment. This might be due to network timeout or permission changes.
      </p>
      <button
        onClick={() => reset()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          background: '#0F4C81',
          color: '#FFFFFF',
          fontSize: 13,
          fontWeight: 600,
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        <RefreshCw size={14} />
        Reload View
      </button>
    </div>
  )
}
