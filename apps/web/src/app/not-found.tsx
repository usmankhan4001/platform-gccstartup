import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#F8FAFC', color: '#0F172A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 480, margin: '24px', padding: '40px', background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(15, 76, 129, 0.1)', color: '#0F4C81', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <FileQuestion size={28} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0', color: '#0A192F' }}>
            Page Not Found
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            The requested page could not be located on the GCC Startup platform. It may have been moved or removed.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link
              href="/"
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
                textDecoration: 'none',
              }}
            >
              <Home size={16} />
              Return Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
