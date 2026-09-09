'use client'

import { useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { Select, Flag } from '@/components/ui'

export type ComparisonToolProps = {
  eyebrow: string
  title: string
  description: string
}

const cmpData: Record<
  string,
  { flagCode: string; name: string; tax: string; time: string; bank: string; own: string; res: string; from: string }
> = {
  uae: { flagCode: 'ae', name: 'UAE', tax: '9% / 0% foreign', time: '~30 days', bank: 'Local + fintech', own: '100% foreign', res: 'Yes — Emirates ID', from: '€4,200' },
  bahrain: { flagCode: 'bh', name: 'Bahrain', tax: '0% corporate', time: '~30 days', bank: 'Credible local', own: '100% foreign', res: 'Yes', from: '$2,500' },
  oman: { flagCode: 'om', name: 'Oman', tax: '15% corporate', time: '~30 days', bank: 'Local + fintech', own: '100% foreign', res: 'Yes — residence visa', from: '$2,500' },
  qatar: { flagCode: 'qa', name: 'Qatar', tax: '0% in QFC', time: '3–5 weeks', bank: 'Strong local', own: '100% foreign', res: 'Yes — investor', from: '$3,000' },
  hongkong: { flagCode: 'hk', name: 'Hong Kong', tax: '0% on foreign', time: '17–18 days', bank: 'Fintech (remote)', own: '100% foreign', res: 'No', from: '$850' },
  singapore: { flagCode: 'sg', name: 'Singapore', tax: '5% corporate', time: '17–18 days', bank: 'Strong local', own: 'Nominee dir. inc.', res: 'No', from: '$850' },
  ireland: { flagCode: 'ie', name: 'Ireland', tax: '12.5% corporate', time: '2–3 days', bank: 'EU banking', own: '100% foreign', res: 'No', from: '$2,500' },
  bvi: { flagCode: 'ky', name: 'BVI & Cayman', tax: '0% · private', time: 'Varies', bank: 'Offshore', own: '100% foreign', res: 'No', from: '$2,500' },
}
const rows: Array<[string, keyof (typeof cmpData)['uae']]> = [
  ['Corporate tax', 'tax'],
  ['Setup timeline', 'time'],
  ['Banking', 'bank'],
  ['Ownership', 'own'],
  ['Tax residency', 'res'],
  ['Starting from', 'from'],
]

function Comparison({ eyebrow, title, description }: ComparisonToolProps) {
  const [a, setA] = useState('hongkong')
  const [b, setB] = useState('uae')
  const dataA = cmpData[a] || cmpData['hongkong']
  const dataB = cmpData[b] || cmpData['uae']

  return (
    <section className="section section-alt">
      <div className="wrap-narrow">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        {title && <h2>{title}</h2>}
        {description && <p style={{ marginTop: 'var(--space-2)' }}>{description}</p>}
        <div className="grid-2" style={{ marginTop: 'var(--space-6)' }}>
          <Select label="Compare" value={a} onChange={(e) => setA(e.target.value)}>
            {Object.entries(cmpData).map(([key, v]) => (
              <option key={key} value={key}>
                {v.name}
              </option>
            ))}
          </Select>
          <Select label="Against" value={b} onChange={(e) => setB(e.target.value)}>
            {Object.entries(cmpData).map(([key, v]) => (
              <option key={key} value={key}>
                {v.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="card" style={{ marginTop: 'var(--space-4)', padding: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
          <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-alt)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontSize: 13 }} />
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Flag code={dataA.flagCode} size="sm" /> {dataA.name}
                  </span>
                </th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Flag code={dataB.flagCode} size="sm" /> {dataB.name}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, key]) => (
                <tr key={key} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 13, color: 'var(--text-tertiary)' }}>{label}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{dataA[key]}</td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{dataB[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export const ComparisonTool: ComponentConfig<ComparisonToolProps> = {
  fields: {
    eyebrow: { type: 'text' },
    title: { type: 'text' },
    description: { type: 'textarea' },
  },
  defaultProps: { eyebrow: 'Free tool', title: 'Compare two jurisdictions', description: '' },
  render: (props) => <Comparison {...props} />,
}
