import {
  DEFAULT_RENDER_CONTEXT,
  EMAIL_FONT,
  EMAIL_MAX_WIDTH,
  EMAIL_PALETTE,
  EMAIL_BLOCK_TYPES,
  escapeHtml,
  fallbackFooter,
  getEmailBlock,
  type EmailRenderContext,
} from '@/puck/email-blocks'

/**
 * Turns a block-designer document into a sendable email.
 *
 * Deliberately pure TypeScript — no React, no JSX, no client-only import — so it
 * is safe to call from an API route, from the outbox drainer, and from a Vitest
 * `node` environment. The block renderers it walks live in
 * `src/puck/email-blocks/` and are pure for the same reason; the Puck editor
 * wraps the identical `toHtml()` output for its preview pane, so what a designer
 * sees is what the transport receives.
 *
 * The contract callers rely on: **renderEmail never throws.** A `blocks` column
 * can hold anything — a half-migrated shape, a JSON string, null, a block type
 * that was removed two releases ago — and a send job must not die because of it.
 * Unknown block types are skipped; unusable input renders an empty but valid
 * document.
 */

export { EMAIL_MAX_WIDTH, EMAIL_BLOCK_TYPES }

export type RenderedEmail = {
  /** A complete document: doctype, head, table-based body, all styles inline. */
  html: string
  /** A genuine plain-text alternative, built from each block's toText(). */
  text: string
}

export type RenderEmailOptions = {
  /** Overrides `root.props.preheader`. */
  preheader?: string
  /** Merge tags, applied to both outputs. A caller passing these must NOT
   * interpolate again. */
  variables?: Record<string, string>
  /** Injected into the EmailFooter block, and into the fallback footer when the
   * document has none of its own. */
  unsubscribeUrl?: string
  /** Renders a "View in browser" line. Omitted entirely when absent. */
  webVersionUrl?: string
  siteUrl?: string
  brandName?: string
  brandAddress?: string
  /** Only used for the document `<title>`, which no client displays but every
   * accessibility checker looks for. */
  subject?: string
}

export type EmailBlockItem = {
  type: string
  props: Record<string, unknown>
}

export type EmailDocument = {
  content: EmailBlockItem[]
  root: { props: Record<string, unknown> }
}

/* ---------------------------------------------------------------- merge tags */

/** The tags the designer offers, with the sample values preview and test-sends
 * fill in. `unsubscribe_url` is listed so an author can drop it into body copy;
 * the footer block gets its value from renderEmail's options, not from here. */
export const EMAIL_MERGE_TAGS: ReadonlyArray<{ tag: string; label: string; sample: string }> = [
  { tag: '{{first_name}}', label: 'First name', sample: 'Tariq' },
  { tag: '{{firstname}}', label: 'First name (alias)', sample: 'Tariq' },
  { tag: '{{last_name}}', label: 'Last name', sample: 'Al-Mansoor' },
  { tag: '{{name}}', label: 'Full name', sample: 'Tariq Al-Mansoor' },
  { tag: '{{email}}', label: 'Email address', sample: 'tariq@almansoorgroup.ae' },
  { tag: '{{company_name}}', label: 'Company / Brand Name', sample: 'Apex Global Technologies FZ-LLC' },
  { tag: '{{jurisdiction}}', label: 'Jurisdiction', sample: 'Dubai Multi Commodities Centre (DMCC)' },
  { tag: '{{country}}', label: 'Country of interest', sample: 'United Arab Emirates' },
  { tag: '{{interest}}', label: 'Stated interest', sample: 'Free Zone Tech Formation & Golden Visa' },
  { tag: '{{tax_savings_aed}}', label: 'Estimated Tax Savings', sample: '185,000 AED' },
  { tag: '{{deal_value}}', label: 'Estimated Deal Value', sample: 'AED 16,500' },
  { tag: '{{trade_license_expiry}}', label: 'Trade License Expiry', sample: '15 November 2026' },
  { tag: '{{license_number}}', label: 'Trade License Number', sample: 'DMCC-948210' },
  { tag: '{{assigned_desk}}', label: 'Assigned Desk', sample: 'Dubai Desk (Emaar Square)' },
  { tag: '{{advisor_name}}', label: 'Dedicated Specialist', sample: 'Sarah Al-Maktoum' },
  { tag: '{{portal_url}}', label: 'Client Portal Token URL', sample: 'https://gccstartup.com/track/tk_784f19bc' },
  { tag: '{{nda_download_url}}', label: 'Encrypted NDA URL', sample: 'https://gccstartup.com/nda/download/nda_99182' },
  { tag: '{{quote_amount}}', label: 'Official Quotation Amount', sample: 'AED 14,700' },
  { tag: '{{unsubscribe_url}}', label: 'Unsubscribe link', sample: 'https://gccstartup.com/unsubscribe?token=sample' },
]

/**
 * Merge-tag substitution: `{{ key }}`, case-insensitive, optional inner
 * whitespace, a falsy value substituting the empty string.
 *
 * Behaviourally identical to the private helper this replaces in
 * `src/app/api/admin/email/campaigns/route.ts` — the syntax is the same, so no
 * stored subject line or body changes meaning when a caller switches over. The
 * one deliberate difference: a key that is not a valid regular expression is
 * skipped rather than thrown, because renderEmail() must not die on a malformed
 * variable name. Every input the original returned for, this returns the same
 * string for.
 */
export function interpolate(text: string, vars: Record<string, string>): string {
  let result = typeof text === 'string' ? text : ''
  if (!vars || typeof vars !== 'object') return result
  for (const [k, v] of Object.entries(vars)) {
    let reg: RegExp
    try {
      reg = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi')
    } catch {
      continue
    }
    result = result.replace(reg, v || '')
  }
  return result
}

/** The HTML pass escapes the *values* before substituting them. `interpolate`
 * itself cannot do this — it is also used on plain-text subject lines — but a
 * lead whose name contains an angle bracket must not become markup once it lands
 * inside a webmail preview pane. Ampersands in an unsubscribe query string
 * become `&amp;`, which is the correct spelling inside an href. */
function interpolateHtml(html: string, vars: Record<string, string>): string {
  const escaped: Record<string, string> = {}
  for (const [k, v] of Object.entries(vars)) escaped[k] = escapeHtml(v || '')
  return interpolate(html, escaped)
}

/* ------------------------------------------------------------ normalisation */

function toPlainObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function toBlockItems(value: unknown): EmailBlockItem[] {
  if (!Array.isArray(value)) return []
  const items: EmailBlockItem[] = []
  for (const entry of value) {
    const obj = toPlainObject(entry)
    const type = typeof obj.type === 'string' ? obj.type : ''
    if (!type) continue
    items.push({ type, props: toPlainObject(obj.props) })
  }
  return items
}

/**
 * Accepts every shape a `blocks` column has ever held: a Puck `Data` object, the
 * `{ blocks: [...] }` alias an older import script wrote, a bare array, and any
 * of those still JSON-stringified. Mirrors `normalizePuckData` in
 * `src/puck/normalize.ts` on purpose — the two must agree about what counts as a
 * document — but returns the flatter shape the renderer walks, and never throws.
 */
export function normalizeEmailData(input: unknown): EmailDocument {
  const empty: EmailDocument = { content: [], root: { props: {} } }
  if (input === null || input === undefined) return empty

  let parsed: unknown = input
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim()
    if (!trimmed) return empty
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      return empty
    }
  }

  if (Array.isArray(parsed)) return { content: toBlockItems(parsed), root: { props: {} } }

  if (typeof parsed !== 'object' || parsed === null) return empty

  const obj = parsed as Record<string, unknown>
  const content = Array.isArray(obj.content) ? obj.content : Array.isArray(obj.blocks) ? obj.blocks : []

  // Puck moved root data under `root.props`, but documents written before that
  // change keep their fields directly on `root`. Read both.
  const rawRoot = toPlainObject(obj.root)
  const rootProps = Object.hasOwn(rawRoot, 'props') ? toPlainObject(rawRoot.props) : rawRoot

  return { content: toBlockItems(content), root: { props: rootProps } }
}

/* ---------------------------------------------------------------- document */

/**
 * The one embedded `<style>` block in the whole system. Every block writes its
 * own styles inline, which is what a client that strips `<style>` (the Gmail app
 * signed into a non-Gmail account, most notably) is left with — a complete,
 * correct light-mode email. This block only *enhances*: it stacks columns on
 * narrow screens and repaints for dark mode. Nothing here is load-bearing.
 */
const HEAD_STYLE = `
  body { margin:0 !important; padding:0 !important; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table { border-collapse:collapse !important; mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
  a { color:${EMAIL_PALETTE.orange}; }
  .email-shell { width:${EMAIL_MAX_WIDTH}px; }
  @media only screen and (max-width:480px) {
    .email-shell { width:100% !important; border-radius:0 !important; }
    .email-col { display:block !important; width:100% !important; padding-right:0 !important; padding-bottom:22px !important; }
    h1 { font-size:24px !important; line-height:32px !important; }
    h2 { font-size:20px !important; line-height:28px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .email-page, .email-page td { background-color:#0B1120 !important; }
    .email-shell { background-color:#111A2E !important; border-color:#243049 !important; }
    .email-heading, .email-heading * { color:#F8FAFC !important; }
    .email-body, .email-body * { color:#CBD5E1 !important; }
    .email-divider { border-top-color:#243049 !important; }
  }
  /* Outlook.com rewrites selectors under a [data-ogsc] attribute in dark mode
     and ignores prefers-color-scheme entirely. */
  [data-ogsc] .email-heading, [data-ogsc] .email-heading * { color:#F8FAFC !important; }
  [data-ogsc] .email-body, [data-ogsc] .email-body * { color:#CBD5E1 !important; }
`

/** The hidden line a client shows next to the subject. The trailing run of
 * zero-width non-joiners stops it pulling the first paragraph of body copy in
 * after the intended text. */
function preheaderHtml(preheader: string): string {
  if (!preheader) return ''
  const padding = '&#847;&zwnj;&nbsp;'.repeat(60)
  return (
    '<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#FFFFFF;opacity:0;">' +
    escapeHtml(preheader) +
    padding +
    '</div>'
  )
}

function documentHtml(bodyRows: string, preheader: string, title: string): string {
  return (
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n' +
    '<html xmlns="http://www.w3.org/1999/xhtml" lang="en">\n' +
    '<head>\n' +
    '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<meta name="x-apple-disable-message-reformatting" />\n' +
    '<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />\n' +
    '<meta name="color-scheme" content="light dark" />\n' +
    '<meta name="supported-color-schemes" content="light dark" />\n' +
    '<title>' +
    escapeHtml(title) +
    '</title>\n' +
    '<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->\n' +
    '<style type="text/css">' +
    HEAD_STYLE +
    '</style>\n' +
    '</head>\n' +
    '<body class="email-page" style="margin:0;padding:0;background-color:' +
    EMAIL_PALETTE.surfaceAlt +
    ';font-family:' +
    EMAIL_FONT +
    ';">\n' +
    preheaderHtml(preheader) +
    '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-page" bgcolor="' +
    EMAIL_PALETTE.surfaceAlt +
    '" style="width:100%;border-collapse:collapse;background-color:' +
    EMAIL_PALETTE.surfaceAlt +
    ';">\n' +
    '<tr><td align="center" style="padding:24px 12px;">\n' +
    '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="' +
    EMAIL_MAX_WIDTH +
    '" class="email-shell" bgcolor="' +
    EMAIL_PALETTE.white +
    '" style="width:' +
    EMAIL_MAX_WIDTH +
    'px;max-width:' +
    EMAIL_MAX_WIDTH +
    'px;border-collapse:collapse;background-color:' +
    EMAIL_PALETTE.white +
    ';border:1px solid ' +
    EMAIL_PALETTE.border +
    ';border-radius:20px;overflow:hidden;">\n' +
    bodyRows +
    '\n</table>\n' +
    '</td></tr>\n</table>\n' +
    '</body>\n</html>'
  )
}

/* ------------------------------------------------------------------- render */

function buildContext(options: RenderEmailOptions): EmailRenderContext {
  return {
    siteUrl: options.siteUrl || DEFAULT_RENDER_CONTEXT.siteUrl,
    brandName: options.brandName || DEFAULT_RENDER_CONTEXT.brandName,
    brandAddress: options.brandAddress || DEFAULT_RENDER_CONTEXT.brandAddress,
    unsubscribeUrl: options.unsubscribeUrl || '',
    webVersionUrl: options.webVersionUrl || '',
  }
}

export function renderEmail(data: unknown, options: RenderEmailOptions = {}): RenderedEmail {
  const opts = options && typeof options === 'object' ? options : {}
  const doc = normalizeEmailData(data)
  const ctx = buildContext(opts)

  const rows: string[] = []
  const textParts: string[] = []
  let sawFooter = false

  for (const item of doc.content) {
    const block = getEmailBlock(item.type)
    // An unknown type is skipped rather than surfaced: a template written against
    // a block that has since been renamed still sends, minus that section.
    if (!block) continue
    if (item.type === 'EmailFooter') sawFooter = true

    // A block author's mistake must not take a campaign down with it, so each one
    // is contained. A block that throws contributes nothing and the send goes on.
    let html = ''
    let text = ''
    try {
      html = block.toHtml({ ...block.defaults, ...item.props }, ctx)
    } catch {
      html = ''
    }
    try {
      text = block.toText({ ...block.defaults, ...item.props }, ctx)
    } catch {
      text = ''
    }

    if (html) rows.push('<tr><td align="center" style="padding:0;">' + html + '</td></tr>')
    if (text) textParts.push(text)
  }

  // No marketing send may leave without an unsubscribe path, and a "view in
  // browser" link is worthless if the document has nowhere to put it. When the
  // author did not place a footer block, append one.
  if (!sawFooter && (ctx.unsubscribeUrl || ctx.webVersionUrl)) {
    const fallback = fallbackFooter(ctx)
    if (fallback.html) rows.push('<tr><td align="center" style="padding:0;">' + fallback.html + '</td></tr>')
    if (fallback.text) textParts.push(fallback.text)
  }

  // An empty document still gets a valid shell: a send that produces no markup at
  // all is rejected by most transports, and a blank template is a design mistake,
  // not a crash.
  if (rows.length === 0) {
    rows.push('<tr><td style="padding:32px;font-family:' + EMAIL_FONT + ';font-size:16px;color:' + EMAIL_PALETTE.textTertiary + ';">&nbsp;</td></tr>')
  }

  const rootProps = doc.root.props
  const preheader =
    typeof opts.preheader === 'string' && opts.preheader
      ? opts.preheader
      : typeof rootProps.preheader === 'string'
        ? rootProps.preheader
        : ''
  const title =
    (typeof opts.subject === 'string' && opts.subject) ||
    (typeof rootProps.subject === 'string' ? rootProps.subject : '') ||
    (typeof rootProps.title === 'string' ? rootProps.title : '') ||
    ctx.brandName

  let html = documentHtml(rows.join('\n'), preheader, title)
  let text = textParts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'

  const variables = opts.variables && typeof opts.variables === 'object' ? opts.variables : null
  if (variables) {
    html = interpolateHtml(html, variables)
    text = interpolate(text, variables)
  }

  return { html, text }
}

/**
 * renderEmail with the sample merge values filled in, for the designer preview
 * and for a test-send. A preview that still shows `{{firstname}}` is the single
 * most common reason a broken merge tag reaches a real recipient unnoticed.
 */
export function renderEmailPreview(data: unknown, options: RenderEmailOptions = {}): RenderedEmail {
  const opts = options && typeof options === 'object' ? options : {}
  const samples: Record<string, string> = {}
  for (const entry of EMAIL_MERGE_TAGS) {
    const key = entry.tag.replace(/[{}\s]/g, '')
    samples[key] = entry.sample
  }
  const variables = { ...samples, ...(opts.variables ?? {}) }
  return renderEmail(data, {
    ...opts,
    variables,
    unsubscribeUrl: opts.unsubscribeUrl || samples.unsubscribe_url,
  })
}
