'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Info,
  ShieldCheck,
  Building2,
  FileCheck2,
  ArrowRight,
  Clock,
  HelpCircle,
  Sparkles,
  Lock,
} from 'lucide-react'
import {
  JURISDICTIONS,
  PACKAGE_OPTIONS,
  ADDONS,
  calculateOrderTotal,
  type PackageOption,
} from '@/lib/funnel/packages'

export function PackageSelectorClient() {
  const router = useRouter()
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(JURISDICTIONS[0].id)
  const [selectedPackage, setSelectedPackage] = useState<PackageOption['id']>('self_ubo')
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['bank-account-tier1'])
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calculation = calculateOrderTotal(selectedJurisdiction, selectedPackage, selectedAddons)
  const currentJurisdiction = calculation.jurisdiction
  const currentPkg = calculation.package

  function toggleAddon(addonId: string) {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId],
    )
  }

  async function handleProceedToCheckout() {
    if (!contactName.trim() || !contactEmail.trim()) {
      setError('Please provide your name and email address to prepare your application.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          jurisdictionId: selectedJurisdiction,
          packageId: selectedPackage,
          addonIds: selectedAddons,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // If Stripe or payment URL provided, redirect; otherwise proceed to application stage
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else if (data.orderNumber && data.trackingToken) {
        // Direct simulation / dev fallback: redirect directly to post-payment application
        router.push(`/portal/application?order=${data.orderNumber}&token=${data.trackingToken}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during checkout.')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>
      {/* Top Banner / Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'var(--blue-lt, #EEF2FF)', color: 'var(--blue, #2563EB)', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <Sparkles size={16} /> Fast-Track Company Formation
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'var(--text, #0F172A)', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
          Select Your Jurisdiction & Structure
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-secondary, #475569)', maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>
          Choose your incorporation territory, configure your beneficial ownership model, and review statutory compliance requirements before checkout.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)', gap: 36, alignItems: 'start' }}>
        {/* Left Column: Configuration Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          
          {/* STEP 1: Jurisdiction Picker */}
          <section style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 16, padding: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--blue, #2563EB)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>1</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text, #0F172A)' }}>Select Formation Jurisdiction</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {JURISDICTIONS.map((j) => {
                const isSelected = j.id === selectedJurisdiction
                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => setSelectedJurisdiction(j.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: 16,
                      borderRadius: 12,
                      border: isSelected ? '2px solid var(--blue, #2563EB)' : '1px solid var(--border, #E2E8F0)',
                      background: isSelected ? 'var(--blue-lt, #F8FAFC)' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {j.popular && (
                      <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 700, background: '#FEF3C7', color: '#B45309', padding: '2px 6px', borderRadius: 4 }}>
                        POPULAR
                      </span>
                    )}
                    <span style={{ fontSize: 26, marginBottom: 8 }}>{j.flag}</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text, #0F172A)' }}>{j.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary, #64748B)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {j.turnaroundDays} business days
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue, #2563EB)', marginTop: 8 }}>
                      From ${j.basePrice.toLocaleString()}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Jurisdiction Highlights */}
            <div style={{ marginTop: 18, padding: 14, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
              <strong>{currentJurisdiction.flag} {currentJurisdiction.name}:</strong> {currentJurisdiction.description}
            </div>
          </section>

          {/* STEP 2: Service Structure / UBO Option */}
          <section style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 16, padding: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--blue, #2563EB)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>2</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text, #0F172A)' }}>Ownership & Directorship Structure</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PACKAGE_OPTIONS.map((pkg) => {
                const isSelected = pkg.id === selectedPackage
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    style={{
                      border: isSelected ? '2px solid var(--blue, #2563EB)' : '1px solid var(--border, #E2E8F0)',
                      background: isSelected ? 'var(--blue-lt, #F0F7FF)' : '#fff',
                      borderRadius: 14,
                      padding: 20,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: isSelected ? '6px solid var(--blue, #2563EB)' : '2px solid #CBD5E1', background: '#fff' }} />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text, #0F172A)' }}>{pkg.title}</span>
                          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary, #64748B)' }}>({pkg.subtitle})</span>
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 16, color: pkg.price === 0 ? 'var(--success, #16A34A)' : 'var(--blue, #2563EB)' }}>
                        {pkg.price === 0 ? 'Included' : `+$${pkg.price.toLocaleString()}`}
                      </span>
                    </div>

                    <p style={{ fontSize: 13, color: '#475569', margin: '10px 0 12px 30px', lineHeight: 1.5 }}>
                      {pkg.description}
                    </p>

                    {/* Checklists & Legal Requirements */}
                    <div style={{ marginLeft: 30, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 10, borderTop: '1px dashed #E2E8F0', fontSize: 12, color: '#334155' }}>
                      {pkg.checklist.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={13} color="var(--success, #16A34A)" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tooltip trigger button */}
                    <div style={{ position: 'absolute', top: 18, right: pkg.price === 0 ? 80 : 100 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveTooltip(activeTooltip === pkg.id ? null : pkg.id)
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                        title="Click to view legal compliance requirements"
                      >
                        <HelpCircle size={16} />
                      </button>
                    </div>

                    {/* Interactive Tooltip Card */}
                    {activeTooltip === pkg.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          marginTop: 12,
                          marginLeft: 30,
                          padding: 14,
                          background: '#1E293B',
                          color: '#F8FAFC',
                          borderRadius: 8,
                          fontSize: 12,
                          lineHeight: 1.5,
                          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, color: '#93C5FD' }}>
                          <ShieldCheck size={14} /> Legal & Compliance Guidance
                        </div>
                        <p style={{ margin: '0 0 8px 0' }}>{pkg.tooltip}</p>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {pkg.legalRequirements.map((req, rIdx) => (
                            <li key={rIdx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* STEP 3: Recommended Add-ons */}
          <section style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 16, padding: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--blue, #2563EB)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>3</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text, #0F172A)' }}>Select Essential Add-ons</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ADDONS.map((addon) => {
                const isSelected = selectedAddons.includes(addon.id)
                return (
                  <label
                    key={addon.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 16,
                      borderRadius: 12,
                      border: isSelected ? '1px solid var(--blue, #2563EB)' : '1px solid var(--border, #E2E8F0)',
                      background: isSelected ? '#F8FAFC' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAddon(addon.id)}
                      style={{ marginTop: 3, width: 16, height: 16 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text, #0F172A)' }}>{addon.title}</span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--blue, #2563EB)' }}>+${addon.price}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary, #64748B)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        {addon.description}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          </section>

          {/* PRE-CHECKOUT COMPLIANCE DOCUMENT NOTICE */}
          <section style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B45309', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
              <FileCheck2 size={20} /> Pre-Checkout Compliance Notice: Required Documents
            </div>
            <p style={{ fontSize: 13, color: '#78350F', margin: '0 0 14px 0', lineHeight: 1.5 }}>
              To ensure compliance with {currentJurisdiction.name} anti-money laundering regulations and official registrar laws, please ensure you have the following preliminary documents ready for submission immediately after checkout:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>
              {currentJurisdiction.requiredDocuments.map((doc, dIdx) => (
                <li key={dIdx} style={{ marginBottom: 4 }}>{doc}</li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right Column: Order Summary & Checkout Card */}
        <div style={{ position: 'sticky', top: 30 }}>
          <div style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 18, padding: 28, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 18px 0', color: 'var(--text, #0F172A)', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              Order Calculation Summary
            </h3>

            {/* Line Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>{currentJurisdiction.name} Formation Base</span>
                <span style={{ fontWeight: 600 }}>${currentJurisdiction.basePrice.toLocaleString()}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>{currentPkg.title}</span>
                <span style={{ fontWeight: 600 }}>{currentPkg.price === 0 ? '$0' : `+$${currentPkg.price.toLocaleString()}`}</span>
              </div>

              {calculation.addons.map((a) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>{a.title}</span>
                  <span style={{ fontWeight: 600 }}>+${a.price.toLocaleString()}</span>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px dashed #E2E8F0' }}>
                <span style={{ color: '#64748B' }}>Government Registry & Filing Fee</span>
                <span style={{ fontWeight: 600 }}>${currentJurisdiction.registryFee.toLocaleString()}</span>
              </div>
            </div>

            {/* Total Price */}
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 18, marginBottom: 24, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #0F172A)' }}>Total Investment</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--blue, #2563EB)' }}>
                    ${calculation.total.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 12, color: '#64748B', display: 'block' }}>{calculation.currency} (All inclusive)</span>
                </div>
              </div>
            </div>

            {/* Contact Details Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                Full Legal Name *
                <input
                  type="text"
                  placeholder="e.g. Alexander Wright"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 4, fontSize: 14 }}
                  required
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                Email Address (for official tracking) *
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 4, fontSize: 14 }}
                  required
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                WhatsApp / Phone Number
                <input
                  type="tel"
                  placeholder="+971 50 123 4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 4, fontSize: 14 }}
                />
              </label>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #F87171', color: '#991B1B', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleProceedToCheckout}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 10,
                background: 'var(--blue, #2563EB)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              {loading ? 'Initiating Checkout...' : 'Lock In Pricing & Pay'}
              <ArrowRight size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, fontSize: 12, color: '#64748B' }}>
              <Lock size={13} /> 256-Bit Encrypted Secure Payment
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
