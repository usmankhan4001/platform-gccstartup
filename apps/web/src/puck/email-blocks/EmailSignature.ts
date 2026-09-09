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

export type EmailSignatureProps = {
  advisorName: string
  advisorTitle: string
  deskLocation: string
  licenseNumber: string
  phone: string
  whatsappUrl: string
  avatarUrl: string
  bookingUrl: string
}

export const EmailSignature = defineEmailBlock<EmailSignatureProps>({
  label: 'Advisor Signature',
  fields: {
    advisorName: { type: 'text', label: 'Advisor Name' },
    advisorTitle: { type: 'text', label: 'Advisor Title / Role' },
    deskLocation: { type: 'text', label: 'Desk Location (e.g. Dubai Desk)' },
    licenseNumber: { type: 'text', label: 'Corporate Agent Reg No.' },
    phone: { type: 'text', label: 'Direct Desk Phone' },
    whatsappUrl: { type: 'text', label: 'WhatsApp Direct Link' },
    avatarUrl: { type: 'text', label: 'Advisor Photo / Avatar URL' },
    bookingUrl: { type: 'text', label: 'Calendar / Meeting Link' },
  },
  defaults: {
    advisorName: 'Tariq Al-Mansoor',
    advisorTitle: 'Senior GCC Formation Specialist & Banking Counsel',
    deskLocation: 'Dubai Desk · Emaar Square, Downtown Dubai',
    licenseNumber: 'UAE DED Agent #94821-B',
    phone: '+971 4 812 9000',
    whatsappUrl: 'https://wa.me/97148129000',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    bookingUrl: 'https://gccstartup.com/contact',
  },
  toHtml: (props) => {
    const name = str(props.advisorName)
    const title = str(props.advisorTitle)
    const desk = str(props.deskLocation)
    const reg = str(props.licenseNumber)
    const phone = str(props.phone)
    const whatsapp = safeUrl(props.whatsappUrl, '')
    const avatar = safeUrl(props.avatarUrl, '')
    const booking = safeUrl(props.bookingUrl, '')

    return (
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#FFFFFF" style="width:100%;border-collapse:collapse;background-color:#FFFFFF;">' +
      '<tr><td style="padding:24px 32px;border-top:1px dashed ' +
      EMAIL_PALETTE.border +
      ';">' +
      '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;">' +
      '<tr>' +
      (avatar
        ? '<td width="64" valign="top" style="width:64px;padding-right:16px;">' +
          '<img src="' +
          escapeHtml(avatar) +
          '" alt="' +
          escapeHtml(name) +
          '" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:50%;border:2px solid ' +
          EMAIL_PALETTE.orange +
          ';object-fit:cover;" />' +
          '</td>'
        : '') +
      '<td valign="top" style="font-family:' +
      EMAIL_FONT +
      ';">' +
      '<div style="font-size:15px;font-weight:800;color:' +
      EMAIL_PALETTE.text +
      ';margin:0 0 2px 0;">' +
      escapeHtml(name) +
      '</div>' +
      '<div style="font-size:12px;font-weight:600;color:' +
      EMAIL_PALETTE.orange +
      ';margin:0 0 4px 0;">' +
      escapeHtml(title) +
      '</div>' +
      '<div style="font-size:11px;color:' +
      EMAIL_PALETTE.textTertiary +
      ';line-height:16px;">' +
      escapeHtml(desk) +
      (reg ? ' &bull; ' + escapeHtml(reg) : '') +
      '</div>' +
      '<div style="margin-top:8px;font-size:12px;color:' +
      EMAIL_PALETTE.navy +
      ';font-weight:500;">' +
      (phone ? '<span>Tel: ' + escapeHtml(phone) + '</span>' : '') +
      (whatsapp
        ? ' &nbsp;|&nbsp; <a href="' +
          hrefAttr(whatsapp) +
          '" target="_blank" rel="noopener" style="color:#16A34A;text-decoration:none;font-weight:700;">WhatsApp Direct &rarr;</a>'
        : '') +
      (booking
        ? ' &nbsp;|&nbsp; <a href="' +
          hrefAttr(booking) +
          '" target="_blank" rel="noopener" style="color:' +
          EMAIL_PALETTE.orange +
          ';text-decoration:none;font-weight:700;">Book Call &rarr;</a>'
        : '') +
      '</div>' +
      '</td>' +
      '</tr>' +
      '</table>' +
      '</td></tr></table>'
    )
  },
  toText: (props) => {
    return textLines(
      '---',
      str(props.advisorName),
      str(props.advisorTitle),
      str(props.deskLocation),
      str(props.licenseNumber),
      str(props.phone) ? 'Phone: ' + str(props.phone) : '',
      str(props.whatsappUrl) ? 'WhatsApp: ' + str(props.whatsappUrl) : '',
      str(props.bookingUrl) ? 'Booking: ' + str(props.bookingUrl) : '',
    )
  },
})
