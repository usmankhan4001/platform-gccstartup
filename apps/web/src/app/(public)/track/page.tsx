'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Search, ArrowRight, Building2, Clock, FileCheck } from 'lucide-react'

export default function TrackSearchPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = token.trim()
    if (!trimmed) {
      setError('Please enter your tracking token or dossier reference number.')
      return
    }
    router.push(`/track/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div style={{ minHeight: '85vh', background: 'var(--surface-alt, #F8FAFC)', padding: '60px 20px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            background: 'rgba(15, 76, 129, 0.08)',
            color: 'var(--primary, #0F4C81)',
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}>
            <ShieldCheck size={16} />
            GCC Incorporation Dossier Tracker
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading, "Cinzel", serif)',
            fontSize: 'clamp(28px, 4vw, 38px)',
            fontWeight: 700,
            color: 'var(--navy-900, #0A192F)',
            margin: '0 0 12px 0',
          }}>
            Track Your Formation Progress
          </h1>
          <p style={{
            fontSize: 16,
            color: 'var(--text-muted, #64748B)',
            lineHeight: 1.6,
            margin: 0,
          }}>
            Enter the private dossier tracking token provided in your confirmation email or SMS to access real-time registry milestones, compliance filings, and digital certificates.
          </p>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid var(--border, #E2E8F0)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
          padding: '36px 32px',
          marginBottom: 32,
        }}>
          <form onSubmit={handleSubmit}>
            <label htmlFor="token-input" style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--navy-800, #1E293B)', marginBottom: 8 }}>
              Dossier Reference / Tracking Token
            </label>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                id="token-input"
                type="text"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value)
                  if (error) setError('')
                }}
                placeholder="e.g. GCC-2026-DXB-9842 or token hash..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 16px 14px 44px',
                  borderRadius: 10,
                  border: `1.5px solid ${error ? '#EF4444' : 'var(--border, #CBD5E1)'}`,
                  fontSize: 15,
                  color: 'var(--text-primary, #0F172A)',
                  background: '#FFFFFF',
                  outline: 'none',
                }}
              />
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #94A3B8)' }} />
            </div>

            {error && (
              <p style={{ color: '#EF4444', fontSize: 13, marginTop: -8, marginBottom: 16 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px 24px',
                background: 'var(--primary, #0F4C81)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>View Dossier Status</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-light, #F1F5F9)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted, #64748B)' }}>
            <span>Need a new company formation?</span>
            <Link href="/portal/package-selection" style={{ color: 'var(--primary, #0F4C81)', fontWeight: 600, textDecoration: 'none' }}>
              Select Package &rarr;
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 18, border: '1px solid var(--border-light, #F1F5F9)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Building2 size={20} color="var(--primary, #0F4C81)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy-900, #0A192F)' }}>Registry Filings</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted, #64748B)' }}>Direct integration with GCC economic departments.</div>
            </div>
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 18, border: '1px solid var(--border-light, #F1F5F9)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Clock size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy-900, #0A192F)' }}>Milestone Timelines</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted, #64748B)' }}>Real-time audit trails from filing to license issuance.</div>
            </div>
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 18, border: '1px solid var(--border-light, #F1F5F9)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <FileCheck size={20} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy-900, #0A192F)' }}>Instant Certificates</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted, #64748B)' }}>Download verified licenses and MOAs immediately.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
