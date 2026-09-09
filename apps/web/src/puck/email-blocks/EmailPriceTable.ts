import {
  EMAIL_FONT,
  EMAIL_HEADING_FONT,
  EMAIL_PALETTE,
  arr,
  defineEmailBlock,
  escapeHtml,
  inlineHtml,
  inlineText,
  str,
  textLines,
} from './shared'

export type EmailPriceRow = {
  item: string
  freezoneAED: string
  mainlandAED: string
  isIncluded?: boolean
}

export type EmailPriceTableProps = {
  title: string
  subtitle: string
  currencyLabel: string
  rows: EmailPriceRow[]
  totalFreezone: string
  totalMainland: string
  footerNote: string
}

export const EmailPriceTable = defineEmailBlock<EmailPriceTableProps>({
  label: 'Pricing Table',
  fields: {
    title: { type: 'text', label: 'Table Title' },
    subtitle: { type: 'text', label: 'Subtitle / Jurisdiction Note' },
    currencyLabel: { type: 'text', label: 'Currency (e.g. AED / USD)' },
    rows: {
      type: 'array',
      label: 'Breakdown Rows',
      arrayFields: {
        item: { type: 'text', label: 'Fee / Component Name' },
        freezoneAED: { type: 'text', label: 'Free Zone Price' },
        mainlandAED: { type: 'text', label: 'Mainland Price' },
      },
      getItemSummary: (item: Partial<EmailPriceRow>) => str(item?.item) || 'Fee Item',
    },
    totalFreezone: { type: 'text', label: 'Total Freezone (e.g. 12,500 AED)' },
    totalMainland: { type: 'text', label: 'Total Mainland (e.g. 18,500 AED)' },
    footerNote: { type: 'text', label: 'Footer Guarantee Note' },
  },
  defaults: {
    title: 'Formation Cost Estimate & Fee Breakdown',
    subtitle: 'Transparent government and statutory charges with zero hidden surprises',
    currencyLabel: 'AED',
    rows: [
      { item: 'Trade License & Government Registry Fee', freezoneAED: '8,500 AED', mainlandAED: '14,000 AED' },
      { item: 'Establishment Card & Ministry Registration', freezoneAED: '1,800 AED', mainlandAED: '2,200 AED' },
      { item: 'Investor / Partner Residence Visa (3 Years)', freezoneAED: '3,200 AED', mainlandAED: '3,800 AED' },
      { item: 'Emirates ID & Medical Fitness VIP Fast-Track', freezoneAED: '1,200 AED', mainlandAED: '1,200 AED' },
      { item: 'Corporate Bank Account Opening & Compliance Filing', freezoneAED: 'FREE', mainlandAED: 'FREE' },
    ],
    totalFreezone: '14,700 AED',
    totalMainland: '21,200 AED',
    footerNote: 'All prices subject to VAT and official economic department confirmation.',
  },
  toHtml: (props) => {
    const title = str(props.title)
    const subtitle = str(props.subtitle)
    const totalFz = str(props.totalFreezone)
    const totalMl = str(props.totalMainland)
    const footerNote = str(props.footerNote)
    const rows = arr(props.rows)

    let tableRows = ''
    rows.forEach((row, i) => {
      const isEven = i % 2 === 0
      const itemName = str(row.item)
      const fz = str(row.freezoneAED)
      const ml = str(row.mainlandAED)

      tableRows +=
        '<tr style="background-color:' +
        (isEven ? '#FFFFFF' : EMAIL_PALETTE.surfaceAlt) +
        ';border-bottom:1px solid ' +
        EMAIL_PALETTE.border +
        ';">' +
        '<td style="padding:12px 14px;font-family:' +
        EMAIL_FONT +
        ';font-size:13px;color:' +
        EMAIL_PALETTE.text +
        ';font-weight:500;">' +
        inlineHtml(itemName) +
        '</td>' +
        '<td align="right" style="padding:12px 14px;font-family:' +
        EMAIL_FONT +
        ';font-size:13px;color:' +
        (fz === 'FREE' ? '#16A34A' : EMAIL_PALETTE.textSecondary) +
        ';font-weight:' +
        (fz === 'FREE' ? '700' : '600') +
        ';">' +
        escapeHtml(fz) +
        '</td>' +
        '<td align="right" style="padding:12px 14px;font-family:' +
        EMAIL_FONT +
        ';font-size:13px;color:' +
        (ml === 'FREE' ? '#16A34A' : EMAIL_PALETTE.textSecondary) +
        ';font-weight:' +
        (ml === 'FREE' ? '700' : '600') +
        ';">' +
        escapeHtml(ml) +
        '</td>' +
        '</tr>'
    })

    return (
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#FFFFFF" style="width:100%;border-collapse:collapse;background-color:#FFFFFF;">' +
      '<tr><td style="padding:28px 32px;">' +
      (title
        ? '<h3 style="margin:0 0 6px 0;font-family:' +
          EMAIL_HEADING_FONT +
          ';font-size:18px;font-weight:800;color:' +
          EMAIL_PALETTE.text +
          ';">' +
          escapeHtml(title) +
          '</h3>'
        : '') +
      (subtitle
        ? '<p style="margin:0 0 16px 0;font-family:' +
          EMAIL_FONT +
          ';font-size:13px;color:' +
          EMAIL_PALETTE.textTertiary +
          ';">' +
          escapeHtml(subtitle) +
          '</p>'
        : '') +
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;border:1px solid ' +
      EMAIL_PALETTE.border +
      ';border-radius:8px;overflow:hidden;">' +
      '<tr bgcolor="' +
      EMAIL_PALETTE.navy +
      '">' +
      '<th align="left" style="padding:10px 14px;font-family:' +
      EMAIL_FONT +
      ';font-size:11px;font-weight:700;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.5px;">Fee Component</th>' +
      '<th align="right" style="padding:10px 14px;font-family:' +
      EMAIL_FONT +
      ';font-size:11px;font-weight:700;color:' +
      EMAIL_PALETTE.orange +
      ';text-transform:uppercase;letter-spacing:0.5px;">Freezone</th>' +
      '<th align="right" style="padding:10px 14px;font-family:' +
      EMAIL_FONT +
      ';font-size:11px;font-weight:700;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.5px;">Mainland</th>' +
      '</tr>' +
      tableRows +
      '<tr bgcolor="' +
      EMAIL_PALETTE.orangeLight +
      '" style="border-top:2px solid ' +
      EMAIL_PALETTE.orange +
      ';">' +
      '<td style="padding:14px;font-family:' +
      EMAIL_FONT +
      ';font-size:14px;font-weight:800;color:' +
      EMAIL_PALETTE.navy +
      ';">ESTIMATED TOTAL</td>' +
      '<td align="right" style="padding:14px;font-family:' +
      EMAIL_FONT +
      ';font-size:14px;font-weight:800;color:' +
      EMAIL_PALETTE.orange +
      ';">' +
      escapeHtml(totalFz) +
      '</td>' +
      '<td align="right" style="padding:14px;font-family:' +
      EMAIL_FONT +
      ';font-size:14px;font-weight:800;color:' +
      EMAIL_PALETTE.navy +
      ';">' +
      escapeHtml(totalMl) +
      '</td>' +
      '</tr>' +
      '</table>' +
      (footerNote
        ? '<p style="margin:10px 0 0 0;font-family:' +
          EMAIL_FONT +
          ';font-size:11px;color:' +
          EMAIL_PALETTE.textTertiary +
          ';font-style:italic;">' +
          escapeHtml(footerNote) +
          '</p>'
        : '') +
      '</td></tr></table>'
    )
  },
  toText: (props) => {
    const rows = arr(props.rows).map(
      (r) => `${str(r.item)}: Freezone ${str(r.freezoneAED)} | Mainland ${str(r.mainlandAED)}`,
    )
    return textLines(
      str(props.title),
      str(props.subtitle),
      '---',
      ...rows,
      `TOTAL: Freezone ${str(props.totalFreezone)} | Mainland ${str(props.totalMainland)}`,
      str(props.footerNote),
    )
  },
})
