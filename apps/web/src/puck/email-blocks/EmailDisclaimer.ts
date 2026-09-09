import {
  EMAIL_FONT,
  EMAIL_PALETTE,
  defineEmailBlock,
  escapeHtml,
  inlineHtml,
  inlineText,
  str,
  textLines,
} from './shared'

export type EmailDisclaimerProps = {
  jurisdictionWarning: string
  confidentialityNotice: string
  registeredEntityText: string
  taxNotice: string
}

export const EmailDisclaimer = defineEmailBlock<EmailDisclaimerProps>({
  label: 'Legal Disclaimer',
  fields: {
    jurisdictionWarning: { type: 'textarea', label: 'Jurisdiction & Regulatory Notice' },
    confidentialityNotice: { type: 'textarea', label: 'Confidentiality Warning' },
    registeredEntityText: { type: 'text', label: 'Registered Agent / License ID' },
    taxNotice: { type: 'text', label: 'Corporate Tax / FTA Notice' },
  },
  defaults: {
    jurisdictionWarning:
      'GCC Startup Advisory FZ-LLC is a licensed corporate service provider registered under UAE Federal Decree Law No. 32 of 2021. This transmission does not constitute binding formal legal advice without an executed client engagement letter.',
    confidentialityNotice:
      'CONFIDENTIALITY NOTICE: This transmission is intended solely for the designated recipient(s) and may contain proprietary corporate structuring strategies or privileged data. Any unauthorized review or dissemination is strictly prohibited.',
    registeredEntityText: 'UAE Commercial License #109482 · Registered with Federal Tax Authority (FTA)',
    taxNotice: 'Corporate Tax Advice complies with UAE Federal Decree-Law No. 47 of 2022 on the Taxation of Corporations and Businesses.',
  },
  toHtml: (props) => {
    const warning = str(props.jurisdictionWarning)
    const conf = str(props.confidentialityNotice)
    const reg = str(props.registeredEntityText)
    const tax = str(props.taxNotice)

    return (
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="' +
      EMAIL_PALETTE.surfaceAlt +
      '" style="width:100%;border-collapse:collapse;background-color:' +
      EMAIL_PALETTE.surfaceAlt +
      ';border-top:1px solid ' +
      EMAIL_PALETTE.border +
      ';">' +
      '<tr><td style="padding:20px 32px;font-family:' +
      EMAIL_FONT +
      ';">' +
      (warning
        ? '<p style="margin:0 0 8px 0;font-size:11px;line-height:16px;color:' +
          EMAIL_PALETTE.textTertiary +
          ';">' +
          inlineHtml(warning) +
          '</p>'
        : '') +
      (conf
        ? '<p style="margin:0 0 8px 0;font-size:10px;line-height:15px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.3px;">' +
          escapeHtml(conf) +
          '</p>'
        : '') +
      '<div style="font-size:10px;color:' +
      EMAIL_PALETTE.textTertiary +
      ';line-height:14px;border-top:1px dotted ' +
      EMAIL_PALETTE.border +
      ';padding-top:6px;margin-top:6px;">' +
      (reg ? '<span>' + escapeHtml(reg) + '</span>' : '') +
      (tax ? ' &bull; <span>' + escapeHtml(tax) + '</span>' : '') +
      '</div>' +
      '</td></tr></table>'
    )
  },
  toText: (props) => {
    return textLines(
      '=== LEGAL & REGULATORY NOTICE ===',
      inlineText(props.jurisdictionWarning),
      str(props.confidentialityNotice),
      str(props.registeredEntityText),
      str(props.taxNotice),
    )
  },
})
