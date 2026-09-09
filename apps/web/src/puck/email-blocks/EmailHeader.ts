import {
  EMAIL_FONT,
  EMAIL_PALETTE,
  defineEmailBlock,
  escapeHtml,
  hrefAttr,
  safeUrl,
  str,
  textLines,
} from './shared'

export type EmailHeaderProps = {
  logoText: string
  logoUrl: string
  siteUrl: string
  tagline: string
  badgeText: string
  theme: 'white' | 'navy' | 'light'
}

export const EmailHeader = defineEmailBlock<EmailHeaderProps>({
  label: 'Header',
  fields: {
    logoText: { type: 'text', label: 'Brand / Logo text' },
    logoUrl: { type: 'text', label: 'Logo image URL (optional)' },
    siteUrl: { type: 'text', label: 'Website link URL' },
    tagline: { type: 'text', label: 'Pre-header tagline' },
    badgeText: { type: 'text', label: 'Desk badge (e.g. Dubai Desk)' },
    theme: {
      type: 'select',
      label: 'Theme',
      options: [
        { label: 'White', value: 'white' },
        { label: 'Navy', value: 'navy' },
        { label: 'Light grey', value: 'light' },
      ],
    },
  },
  defaults: {
    logoText: 'GCC STARTUP',
    logoUrl: '',
    siteUrl: 'https://gccstartup.com',
    tagline: 'Company Formation & Banking Operations',
    badgeText: 'Official Advisory',
    theme: 'white',
  },
  toHtml: (props, ctx) => {
    const isNavy = str(props.theme) === 'navy'
    const isLight = str(props.theme) === 'light'
    const bg = isNavy ? EMAIL_PALETTE.navy : isLight ? EMAIL_PALETTE.surfaceAlt : EMAIL_PALETTE.white
    const textColor = isNavy ? EMAIL_PALETTE.white : EMAIL_PALETTE.text
    const subColor = isNavy ? '#8FA3C4' : EMAIL_PALETTE.textTertiary
    const border = isNavy ? '#1C2A4D' : EMAIL_PALETTE.border

    const logoText = str(props.logoText) || ctx.brandName || 'GCC STARTUP'
    const logoUrl = safeUrl(props.logoUrl, '')
    const siteUrl = safeUrl(props.siteUrl) || ctx.siteUrl || 'https://gccstartup.com'
    const tagline = str(props.tagline)
    const badgeText = str(props.badgeText)

    return (
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="' +
      bg +
      '" style="width:100%;border-collapse:collapse;background-color:' +
      bg +
      ';border-bottom:1px solid ' +
      border +
      ';">' +
      '<tr><td style="padding:20px 32px;background-color:' +
      bg +
      ';">' +
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;">' +
      '<tr>' +
      '<td align="left" valign="middle" style="font-family:' +
      EMAIL_FONT +
      ';">' +
      '<a href="' +
      hrefAttr(siteUrl) +
      '" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block;">' +
      (logoUrl
        ? '<img src="' +
          escapeHtml(logoUrl) +
          '" alt="' +
          escapeHtml(logoText) +
          '" height="32" style="display:block;height:32px;width:auto;border:0;" />'
        : '<table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>' +
          '<td style="background-color:' +
          EMAIL_PALETTE.orange +
          ';width:8px;height:24px;border-radius:2px;"></td>' +
          '<td style="padding-left:10px;font-family:' +
          EMAIL_FONT +
          ';font-size:18px;font-weight:900;letter-spacing:1px;color:' +
          textColor +
          ';text-transform:uppercase;">' +
          escapeHtml(logoText) +
          '</td></tr></table>') +
      '</a>' +
      (tagline
        ? '<div style="margin-top:4px;font-family:' +
          EMAIL_FONT +
          ';font-size:11px;color:' +
          subColor +
          ';font-weight:500;">' +
          escapeHtml(tagline) +
          '</div>'
        : '') +
      '</td>' +
      (badgeText
        ? '<td align="right" valign="middle" style="font-family:' +
          EMAIL_FONT +
          ';">' +
          '<span style="display:inline-block;padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:0.5px;background-color:' +
          (isNavy ? 'rgba(242,101,34,0.2)' : EMAIL_PALETTE.orangeLight) +
          ';color:' +
          EMAIL_PALETTE.orange +
          ';border:1px solid ' +
          (isNavy ? 'rgba(242,101,34,0.4)' : '#FCDCD0') +
          ';">' +
          escapeHtml(badgeText) +
          '</span>' +
          '</td>'
        : '') +
      '</tr>' +
      '</table>' +
      '</td></tr></table>'
    )
  },
  toText: (props, ctx) => {
    return textLines(
      str(props.logoText) || ctx.brandName || 'GCC STARTUP',
      str(props.tagline),
      str(props.badgeText) ? '[' + str(props.badgeText) + ']' : '',
      '===',
    )
  },
})
