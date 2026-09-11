import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'

export default function PublicNotFound() {
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
          background: 'rgba(15, 76, 129, 0.1)',
          color: 'var(--primary, #0F4C81)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <FileQuestion size={26} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy-900, #0A192F)', margin: '0 0 8px 0' }}>
          Page or Resource Not Found
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted, #64748B)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          The requested dossier, page, or service could not be located.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 8,
            background: 'var(--primary, #0F4C81)',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <Home size={16} />
          Return to Portal
        </Link>
      </div>
    </div>
  )
}
