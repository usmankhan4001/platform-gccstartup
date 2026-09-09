'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { ButtonLink, Select } from '@/components/ui'

export type InteractiveToolsProps = {
  eyebrow: string
  title: string
}

const estData: Record<string, { name: string; base: [number, number]; time: string }> = {
  uae: { name: 'UAE', base: [4200, 4200], time: '~30 days incl. visit' },
  bahrain: { name: 'Bahrain', base: [2500, 2500], time: '~30 days incl. visit' },
  hongkong: { name: 'Hong Kong', base: [850, 2500], time: '17–18 days, remote' },
  singapore: { name: 'Singapore', base: [850, 2500], time: '17–18 days, remote' },
  ireland: { name: 'Ireland', base: [2500, 2500], time: '2–3 days, remote' },
  bvi: { name: 'BVI & Cayman', base: [2500, 3500], time: 'Varies by structure' },
}
const tierAdd: Record<string, [number, number]> = { basic: [0, 0], standard: [0, 0], premium: [1000, 1000] }
const tierName: Record<string, string> = { basic: 'Basic (Registration only)', standard: 'Standard (Company + Nominee)', premium: 'Premium (Company + UBO)' }

function CostEstimator({ eyebrow, title }: InteractiveToolsProps) {
  const [country, setCountry] = useState('uae')
  const [tier, setTier] = useState('standard')
  const [banks, setBanks] = useState(1)
  const [residency, setResidency] = useState(false)

  const c = estData[country] || estData['uae']
  const t = tierAdd[tier] || tierAdd['standard']
  const res = residency ? 1000 : 0
  const lo = (c?.base?.[0] || 4200) + (t?.[0] || 0) + banks * 500 + res
  const hi = (c?.base?.[1] || 4200) + (t?.[1] || 0) + banks * 500 + res

  return (
    <section className="section" id="tools">
      <div className="wrap-narrow">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        {title && <h2>{title}</h2>}
        <div className="card" style={{ marginTop: 'var(--space-6)' }}>
          <div className="grid-2">
            <Select label="Jurisdiction" value={country} onChange={(e) => setCountry(e.target.value)}>
              {Object.entries(estData).map(([key, v]) => (
                <option key={key} value={key}>
                  {v.name}
                </option>
              ))}
            </Select>
            <Select label="Package tier" value={tier} onChange={(e) => setTier(e.target.value)}>
              {Object.entries(tierName).map(([key, v]) => (
                <option key={key} value={key}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid-2">
            <Select label="Bank accounts" value={String(banks)} onChange={(e) => setBanks(Number(e.target.value))}>
              <option value="0">No banking yet</option>
              <option value="1">1 account (+$500)</option>
              <option value="2">2 accounts (+$1,000)</option>
            </Select>
            <Select label="Tax residency" value={residency ? 'yes' : 'no'} onChange={(e) => setResidency(e.target.value === 'yes')}>
              <option value="no">Not needed</option>
              <option value="yes">Yes, include (+€1,000)</option>
            </Select>
          </div>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', padding: 'var(--space-6)', background: 'var(--surface-alt)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 32, fontWeight: 900 }}>
              ${lo.toLocaleString()} – ${hi.toLocaleString()}
            </div>
            <div style={{ color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
              {c.name} · {tierName[tier]} · Timeline {c.time}
            </div>
          </div>
          <ButtonLink href="#lead-form" className="w-full flex-center" style={{ marginTop: 'var(--space-6)' }}>
            Get my full cost breakdown →
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

export const InteractiveTools: ComponentConfig<InteractiveToolsProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
  },
  defaultProps: { eyebrow: 'Free tool', title: 'Business setup cost estimator' },
  render: (props) => <CostEstimator {...props} />,
}
