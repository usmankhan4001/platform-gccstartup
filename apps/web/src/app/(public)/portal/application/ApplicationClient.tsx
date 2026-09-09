'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  UploadCloud,
  FileCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Building,
  FileText,
  Trash2,
} from 'lucide-react'

type UploadedDoc = {
  name: string
  url: string
  fileId?: string
  size?: number
}

export function ApplicationClient() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') || ''
  const token = searchParams.get('token') || ''

  const [companyName1, setCompanyName1] = useState('')
  const [companyName2, setCompanyName2] = useState('')
  const [businessActivity, setBusinessActivity] = useState('')
  const [documents, setDocuments] = useState<UploadedDoc[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/portal/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Upload failed')

        setDocuments((prev) => [
          ...prev,
          {
            name: data.name,
            url: data.url,
            fileId: data.fileId,
            size: data.size,
          },
        ])
      } catch (uploadErr) {
        setError(uploadErr instanceof Error ? uploadErr.message : 'Upload failed')
      }
    }

    setUploading(false)
    event.target.value = ''
  }

  function removeDoc(index: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmitApplication(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName1.trim()) {
      setError('Please provide your primary proposed company name.')
      return
    }

    if (documents.length === 0) {
      setError('Please upload at least one identification document (e.g. passport copy).')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/orders/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          orderNumber,
          companyName1,
          companyName2,
          businessActivity,
          documents,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit application')

      setSubmitted(true)
    } catch (submitErr) {
      setError(submitErr instanceof Error ? submitErr.message : 'Error submitting application')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 700, margin: '60px auto', padding: '40px 24px', textAlign: 'center', background: '#fff', borderRadius: 20, border: '1px solid var(--border, #E2E8F0)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <CheckCircle size={36} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text, #0F172A)', margin: '0 0 12px 0' }}>
          Application Successfully Submitted!
        </h1>
        <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          Thank you. Your entity formation order for <strong>{companyName1}</strong> ({orderNumber}) is now in the active compliance review stage.
        </p>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, textAlign: 'left', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--blue, #2563EB)', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
            <Clock size={18} /> Expected Response: Within 24 Hours
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            Our compliance officer and Virtual Assistant team are currently validating your preliminary documents and preparing the statutory e-registry filing. You will receive an email & WhatsApp notification as soon as filing begins.
          </p>
        </div>

        <Link
          href={`/track/${token}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 28px',
            borderRadius: 10,
            background: 'var(--blue, #2563EB)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
          }}
        >
          Open Shipment-Style Live Tracker <ArrowRight size={18} />
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 840, margin: '40px auto', padding: '0 20px', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: '#DCFCE7', color: '#15803D', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
          <CheckCircle size={14} /> Payment Verified {orderNumber ? `· Order: ${orderNumber}` : ''}
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 800, color: 'var(--text, #0F172A)', margin: '0 0 8px 0' }}>
          Active Application & Preliminary Documents
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', margin: 0 }}>
          Please specify your intended company name choices and upload your compliance materials to initiate official e-registry filing.
        </p>
      </div>

      <form onSubmit={handleSubmitApplication} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Step A: Company Names */}
        <section style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 16, padding: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Building size={20} color="var(--blue, #2563EB)" />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text, #0F172A)' }}>1. Intended Company Names</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
              Primary Proposed Name *
              <input
                type="text"
                placeholder="e.g. Apex Global Technologies Limited"
                value={companyName1}
                onChange={(e) => setCompanyName1(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 6, fontSize: 14 }}
                required
              />
              <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>
                Include entity ending (e.g. Limited, Ltd, LLC, FZ-LLC depending on chosen territory).
              </span>
            </label>

            <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
              Alternative / Fallback Name (Optional)
              <input
                type="text"
                placeholder="e.g. Apex Holdings International Limited"
                value={companyName2}
                onChange={(e) => setCompanyName2(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 6, fontSize: 14 }}
              />
              <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>
                Used if your primary choice is unavailable at the government registry.
              </span>
            </label>

            <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
              Brief Business Activity Description
              <textarea
                rows={3}
                placeholder="Describe your core commercial activities (e.g. Software development, consulting, international commodity trade)..."
                value={businessActivity}
                onChange={(e) => setBusinessActivity(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 6, fontSize: 14 }}
              />
            </label>
          </div>
        </section>

        {/* Step B: Preliminary Document Upload */}
        <section style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 16, padding: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <FileText size={20} color="var(--blue, #2563EB)" />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text, #0F172A)' }}>2. Preliminary KYC Compliance Materials</h2>
          </div>

          <div style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: 14, padding: 32, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleFileUpload}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            />
            <UploadCloud size={38} color="#64748B" style={{ margin: '0 auto 10px auto' }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E293B', marginBottom: 4 }}>
              {uploading ? 'Uploading documents...' : 'Click or Drag & Drop Documents to Upload'}
            </div>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
              Supported: Passport copy, proof of address (utility bill or bank statement within 3 months). Max 15MB each (PDF, PNG, JPG).
            </p>
          </div>

          {/* Uploaded Documents List */}
          {documents.length > 0 && (
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Uploaded Files ({documents.length}):</span>
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#F1F5F9',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <FileCheck size={16} color="#16A34A" />
                    <span style={{ fontWeight: 600, color: '#1E293B', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {doc.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDoc(idx)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
                    title="Remove document"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B', padding: 14, borderRadius: 10, fontSize: 14 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || uploading}
          style={{
            padding: '16px 28px',
            borderRadius: 12,
            background: 'var(--blue, #2563EB)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 17,
            border: 'none',
            cursor: submitting || uploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
          }}
        >
          {submitting ? 'Submitting Application...' : 'Submit Application & Start Official Filing'}
          <ArrowRight size={20} />
        </button>
      </form>
    </div>
  )
}
