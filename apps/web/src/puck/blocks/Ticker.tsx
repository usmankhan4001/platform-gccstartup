import type { ComponentConfig } from '@puckeditor/core'

export type TickerProps = { items: Array<{ text: string }> }

export const Ticker: ComponentConfig<TickerProps> = {
  fields: {
    items: { type: 'array', arrayFields: { text: { type: 'text' } } },
  },
  defaultProps: {
    items: [
      { text: 'Bahrain — 0% corporate tax' },
      { text: 'UAE — 0% on foreign-sourced income' },
      { text: 'Hong Kong — fully remote setup' },
    ],
  },
  render: ({ items = [] }) => {
    const list = Array.isArray(items) && items.length > 0
      ? items
      : [
          { text: '0% Corporate Tax (QFZP Qualified)' },
          { text: '100% Foreign Ownership Guaranteed' },
          { text: '72-Hour Express Trade License' },
          { text: 'Dedicated Dubai & Riyadh Legal Desks' },
          { text: 'Tier-1 UAE Corporate Banking Pre-Approved' },
        ]

    return (
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[0, 1].flatMap((rep) =>
            list.map((item: any, i) => (
              <span key={`${rep}-${i}`}>{typeof item === 'string' ? item : item?.text || String(item)}</span>
            )),
          )}
        </div>
      </div>
    )
  },
}
