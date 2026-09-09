'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Building,
  FileCheck2,
  Download,
  AlertCircle,
  ShieldCheck,
  Send,
  Calendar,
  ExternalLink,
  ChevronRight,
  Upload,
} from 'lucide-react'

type TrackedData = {
  id: string
  orderNumber: string
  clientName: string
  companyName: string
  companyNameAlt?: string | null
  country?: string | null
  jurisdiction?: string | null
  packageType?: string | null
  status: string
  dateCreated?: string | null
  kycStatus?: string | null
  incorporationDate?: string | null
  annualRenewalDate?: string | null
  officialDocuments?: Array<{ name: string; url: string; file_id?: string; date_uploaded?: string }>
  preliminaryDocuments?: Array<{ name: string; url: string }>
}

const MILESTONES = [
  {
    key: 'order',
    title: 'Order & Payment Verified',
    desc: 'Transaction processed and compliance file created.',
  },
  {
    key: 'kyc',
    title: 'KYC & Compliance Verification',
    desc: 'Identity verification, sanctions screening, and UBO disclosures reviewed.',
  },
  {
    key: 'applied',
    title: 'Applied to Official E-Registry',
    desc: 'Statutory documents officially filed with the government registrar.',
  },
  {
    key: 'registered',
    title: 'Company Officially Registered',
    desc: 'Certificate of Incorporation issued; statutory registers completed.',
  },
  {
    key: 'banking',
    title: 'Bank Account Applications Filed',
    desc: 'Corporate filing submitted to selected commercial and digital banks.',
  },
  {
    key: 'closed',
    title: 'All Deliverables Handed Over',
    desc: 'Entity is fully active, operational, and in good statutory standing.',
  },
]

function getActiveStepIndex(status: string): number {
  switch (status) {
    case 'new':
      return 0
    case 'paid_application':
      return 1
    case 'kyc_processing':
    case 'kyc_received':
      return 1
    case 'applied':
      return 2
    case 'registered':
      return 3
    case 'banking_filed':
      return 4
    case 'closed':
    case 'won':
      return 5
    default:
      return 1
  }
}

export function TrackingClient({ token }: { token: string }) {
  const [data, setData] = useState<TrackedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchTracking() {
      try {
        const res = await fetch(`/api/portal/track/${token}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Tracking record not found')
        setData(json.lead)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching tracking')
      } finally {
        setLoading(false)
      }
    }
    void fetchTracking()
  }, [token])

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <Clock size={36} color="var(--blue, #2563EB)" style={{ animation: 'spin 2s linear infinite' }} />
        <h2 style={{ marginTop: 16, color: '#334155' }}>Connecting to Live Formation Tracker...</h2>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ maxWidth: 650, margin: '60px auto', padding: 32, textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 12px auto' }} />
        <h2 style={{ fontSize: 22, color: '#0F172A', margin: '0 0 8px 0' }}>Tracking Record Unavailable</h2>
        <p style={{ color: '#64748B', fontSize: 14 }}>{error || 'We could not locate this order with the provided secure token.'}</p>
      </div>
    )
  }

  const activeIndex = getActiveStepIndex(data.status)
  const isFullyRegistered = activeIndex >= 3
  const isAllDone = activeIndex >= 5

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 20px', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>
      {/* Top Banner */}
      <div style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 20, padding: 32, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid #E2E8F0', paddingBottom: 20 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--blue, #2563EB)' }}>
              LIVE FORMATION TRACKER · ORDER #{data.orderNumber}
            </span>
            <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 800, color: 'var(--text, #0F172A)', margin: '6px 0 4px 0' }}>
              {data.companyName}
            </h1>
            {data.companyNameAlt && (
              <span style={{ fontSize: 13, color: '#64748B' }}>
                Alternative Name: {data.companyNameAlt}
              </span>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                background: isAllDone ? '#DCFCE7' : '#EFF6FF',
                color: isAllDone ? '#15803D' : '#1D4ED8',
                textTransform: 'capitalize',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isAllDone ? '#16A34A' : '#2563EB' }} />
              Current Status: {data.status.replace(/_/g, ' ')}
            </span>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>
              Target: {data.country || 'International'} · {data.packageType?.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* SHIPMENT-STYLE HORIZONTAL / VERTICAL PROGRESS TRACKER */}
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
            {MILESTONES.map((milestone, idx) => {
              const isPast = idx < activeIndex
              const isCurrent = idx === activeIndex
              const isUpcoming = idx > activeIndex

              return (
                <div key={milestone.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, position: 'relative', paddingBottom: idx === MILESTONES.length - 1 ? 0 : 32 }}>
                  {/* Connecting Vertical Line */}
                  {idx !== MILESTONES.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 17,
                        top: 36,
                        bottom: 0,
                        width: 2,
                        background: isPast ? 'var(--blue, #2563EB)' : '#E2E8F0',
                        zIndex: 0,
                      }}
                    />
                  )}

                  {/* Step Icon Badge */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isPast ? 'var(--blue, #2563EB)' : isCurrent ? '#EFF6FF' : '#F1F5F9',
                      border: isCurrent ? '3px solid var(--blue, #2563EB)' : '2px solid transparent',
                      color: isPast ? '#fff' : isCurrent ? 'var(--blue, #2563EB)' : '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 14,
                      zIndex: 1,
                      flexShrink: 0,
                    }}
                  >
                    {isPast ? <CheckCircle2 size={20} /> : idx + 1}
                  </div>

                  {/* Step Details */}
                  <div style={{ flex: 1, paddingTop: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontWeight: isCurrent || isPast ? 700 : 500,
                          fontSize: 16,
                          color: isUpcoming ? '#94A3B8' : '#0F172A',
                        }}
                      >
                        {milestone.title}
                      </span>
                      {isCurrent && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309' }}>
                          IN PROGRESS
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: isUpcoming ? '#94A3B8' : '#475569', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      {milestone.desc}
                    </p>

                    {/* Milestone Highlights for specific stages */}
                    {isCurrent && milestone.key === 'applied' && (
                      <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 12, color: '#334155' }}>
                        ⏱ <strong>Government Registrar Turnaround:</strong> Our filing specialist has submitted all statutory documents. Registrar approval typically takes 1 to 2 business days.
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* OFFICIAL DOCUMENT VAULT (Activated upon registration) */}
      <div style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 20, padding: 28, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <FileCheck2 size={22} color="var(--blue, #2563EB)" />
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text, #0F172A)' }}>
            Official Statutory Documents Vault
          </h2>
        </div>

        {data.officialDocuments && data.officialDocuments.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {data.officialDocuments.map((doc, dIdx) => (
              <div
                key={dIdx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  borderRadius: 12,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{doc.name}</div>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Official Government Record</span>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--blue, #2563EB)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Download size={14} /> Download
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 24, textAlign: 'center', background: '#F8FAFC', borderRadius: 12, color: '#64748B', fontSize: 13 }}>
            {isFullyRegistered
              ? 'Registration complete. Official documents are being indexed by our filing officer.'
              : 'Official incorporation certificates (Certificate of Incorporation, Business Registration, M&A) will appear here as soon as official registrar issuance is complete.'}
          </div>
        )}
      </div>

      {/* COMPLIANCE & ANNUAL CALENDAR DETAILS */}
      {(data.incorporationDate || data.annualRenewalDate) && (
        <div style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 20, padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#0F172A', fontWeight: 700, fontSize: 16 }}>
            <Calendar size={18} color="var(--blue, #2563EB)" /> Statutory Compliance & Maintenance Dates
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, fontSize: 13 }}>
            {data.incorporationDate && (
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>INCORPORATION DATE</span>
                <strong style={{ fontSize: 15, color: '#0F172A' }}>{data.incorporationDate}</strong>
              </div>
            )}
            {data.annualRenewalDate && (
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>NEXT ANNUAL RENEWAL DUE</span>
                <strong style={{ fontSize: 15, color: '#2563EB' }}>{data.annualRenewalDate}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
